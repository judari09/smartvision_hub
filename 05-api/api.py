"""FastAPI backend for SmartVision Hub inference and configuration management."""

import base64
import io
import os
import sys
from contextlib import asynccontextmanager
from pathlib import Path

import cv2
import numpy as np
import yaml
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles

# monitoreo de inferencia y recursos del sistema
root_dir = Path(__file__).resolve().parent
sys.path.insert(
    0, str(root_dir / ".." / "03-src" / "03-monitoring")
)  # Agregar el directorio de monitoreo al path
import threading

# Variables globales para el hilo de monitoreo
monitor_thread = None
stop_event = None


def start_monitoring():
    """
    Start the Prometheus metrics server and export system metrics periodically.

    Notes
    -----
    The monitoring thread is launched from the FastAPI lifespan handler and
    continues until the application shuts down.
    """
    import time

    try:
        from prometheus_client import start_http_server as prometheus_start

        print("[MONITOR] Iniciando servidor Prometheus en puerto 8001...")
        prometheus_start(8001)
        print("[MONITOR] Servidor Prometheus iniciado exitosamente")
        print("[MONITOR] Accede a http://localhost:8001/metrics")

        # Intentar cargar monitor, si falla continúa sin él
        try:
            from monitor import export_system_metrics

            print("[MONITOR] Módulo monitor cargado")
            while stop_event is None or not stop_event.is_set():
                try:
                    export_system_metrics()
                except Exception as e:
                    print(f"[MONITOR] Error exportando métricas: {e}")
                time.sleep(5)
        except ImportError as e:
            print(f"[MONITOR] Módulo monitor no disponible: {e}")
            print("[MONITOR] Servidor Prometheus escuchando métricas por defecto")
            while stop_event is None or not stop_event.is_set():
                time.sleep(5)
    except Exception as e:
        print(f"[MONITOR] Error fatal en start_monitoring: {e}")
        import traceback

        traceback.print_exc()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize monitoring when the API starts and stop it on shutdown."""
    global monitor_thread, stop_event
    # Inicio: iniciar monitoreo
    stop_event = threading.Event()
    monitor_thread = threading.Thread(target=start_monitoring, daemon=True)
    monitor_thread.start()
    print("Monitoreo iniciado en puerto 8000")
    yield
    # Cierre: detener monitoreo
    if stop_event:
        stop_event.set()
    print("Monitoreo detenido")


root_dir = Path(__file__).resolve().parent
sys.path.insert(
    0, str(root_dir / ".." / "03-src" / "02-serving")
)  # Agregar el directorio padre al path
from infer import _normalize_threshold, infer

config_root = Path(__file__).resolve().parent.parent / "01-config"
CONFIG_FILES = {
    "dataset": config_root / "dataset.yaml",
    "flow": config_root / "flow_config.yaml",
    "train": config_root / "train_config.yaml",
    "inference": config_root / "inference.yaml",
}


def read_yaml(path: Path):
    """Read a YAML configuration file and raise a FastAPI error on failure."""
    try:
        with path.open("r", encoding="utf-8") as f:
            return yaml.safe_load(f) or {}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error leyendo YAML: {e}")


def write_yaml(path: Path, data: dict):
    """Persist a YAML configuration file to disk."""
    try:
        with path.open("w", encoding="utf-8") as f:
            yaml.safe_dump(data, f, sort_keys=False, allow_unicode=True)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error escribiendo YAML: {e}")


def deep_update(base: dict, updates: dict):
    """Recursively merge configuration updates into an existing dictionary."""
    for key, value in updates.items():
        if isinstance(value, dict) and isinstance(base.get(key), dict):
            deep_update(base[key], value)
        else:
            base[key] = value
    return base


app = FastAPI(lifespan=lifespan)

# Habilitar CORS para permitir peticiones desde la interfaz web (AJAX/fetch)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Cambia a orígenes específicos en producción
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Return basic API metadata and the available endpoints."""
    return {
        "name": "SmartVision Hub API",
        "version": "1.0.0",
        "endpoints": {
            "infer": "/infer (POST) - Ejecutar inferencia YOLO",
            "config_list": "/config (GET) - Listar configuraciones disponibles",
            "config_get": "/config/{name} (GET) - Obtener configuración",
            "config_replace": "/config/{name} (PUT) - Reemplazar configuración con JSON",
            "config_patch": "/config/{name} (PATCH) - Actualizar campos parciales de configuración",
            "health": "/health - Estado de la API",
        },
    }


@app.get("/health")
async def health():
    """Return the backend health status and monitoring state."""
    return {"status": "healthy", "monitoring": "active"}


@app.get("/config")
async def list_configs():
    """List the configuration files that can be managed through the API."""
    return {"configs": list(CONFIG_FILES.keys())}


@app.get("/config/{name}")
async def get_config(name: str):
    """Read a specific YAML configuration file from disk."""
    path = CONFIG_FILES.get(name)
    if not path or not path.exists():
        raise HTTPException(status_code=404, detail="Config no encontrada")
    return read_yaml(path)


@app.put("/config/{name}")
async def put_config(name: str, config: dict):
    """Replace a YAML configuration file with a new payload."""
    path = CONFIG_FILES.get(name)
    if not path:
        raise HTTPException(status_code=404, detail="Config no encontrada")
    write_yaml(path, config)
    return {"status": "ok", "config": config}


@app.patch("/config/{name}")
async def patch_config(name: str, updates: dict):
    """Apply a partial update to an existing YAML configuration file."""
    path = CONFIG_FILES.get(name)
    if not path or not path.exists():
        raise HTTPException(status_code=404, detail="Config no encontrada")
    current = read_yaml(path)
    if not isinstance(current, dict):
        raise HTTPException(status_code=500, detail="Configuración inválida")
    deep_update(current, updates)
    write_yaml(path, current)
    return {"status": "ok", "config": current}


@app.post("/infer")
async def run_inference(file: UploadFile = File(...)):
    """
    Run YOLO inference on an uploaded image and return detections plus an annotated image.

    Parameters
    ----------
    file : UploadFile
        Uploaded image file sent by the frontend.

    Returns
    -------
    dict
        Dictionary containing detection results, mapped class names, and a
        base64-encoded annotated image.
    """
    # Guardar el archivo temporalmente en un directorio válido para la plataforma
    from pathlib import Path
    from tempfile import NamedTemporaryFile

    safe_filename = Path(file.filename).name
    with NamedTemporaryFile(
        prefix="upload_", suffix=Path(safe_filename).suffix, delete=False
    ) as tmp:
        temp_file_path = Path(tmp.name)
        tmp.write(await file.read())

    input_image = None
    output = []
    class_names = {}
    annotated_image = None

    try:
        inference_config_path = config_root / "inference.yaml"
        inference_config = (
            read_yaml(inference_config_path) if inference_config_path.exists() else {}
        )

        model_path = inference_config.get("model_path") or None
        confidence = inference_config.get("confidence", 50)
        iou = inference_config.get("iou", 50)
        ttaenabled = inference_config.get("ttaenabled", False)

        conf_val = _normalize_threshold(confidence, 0.5)
        iou_val = _normalize_threshold(iou, 0.5)
        tta = bool(ttaenabled)

        results = infer(
            str(temp_file_path),
            model_path=model_path,
            conf=conf_val,
            iou=iou_val,
            tta=tta,
        )

        input_image = cv2.imread(str(temp_file_path))
        if input_image is None:
            raise HTTPException(
                status_code=500, detail="No se pudo leer la imagen para inferencia."
            )

        if len(results) > 0:
            first_result = results[0]
            if hasattr(first_result, "names"):
                class_names = {int(k): str(v) for k, v in first_result.names.items()}
            elif (
                hasattr(first_result, "model")
                and getattr(first_result.model, "names", None) is not None
            ):
                class_names = {
                    int(k): str(v) for k, v in first_result.model.names.items()
                }

        filtered_results = []
        for r in results:
            for box in r.boxes:
                box_conf = float(box.conf)
                # print(f"Box confidence: {box_conf}, Threshold: {conf_val}")
                if box_conf < conf_val:
                    continue
                class_id = int(box.cls)
                detection = {
                    "class": class_id,
                    "class_name": class_names.get(class_id, str(class_id)),
                    "confidence": box_conf,
                    "bbox": box.xyxy.tolist(),
                }
                output.append(detection)
                filtered_results.append((box, detection))

        if input_image is not None:
            for box, detection in filtered_results:
                coords = np.asarray(box.xyxy).astype(float).flatten()
                if coords.size != 4:
                    continue

                x1, y1, x2, y2 = [int(round(float(v))) for v in coords]
                label = (
                    f"{detection['class_name']} {detection['confidence'] * 100:.0f}%"
                )

                cv2.rectangle(input_image, (x1, y1), (x2, y2), (0, 0, 255), thickness=2)
                text_size, text_baseline = cv2.getTextSize(
                    label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1
                )
                text_width, text_height = text_size
                text_y = y1 - 10
                if text_y - text_height - text_baseline < 0:
                    text_y = y1 + text_height + 10

                cv2.rectangle(
                    input_image,
                    (x1, text_y - text_height - text_baseline),
                    (x1 + text_width + 6, text_y + 2),
                    (0, 0, 255),
                    thickness=cv2.FILLED,
                )
                cv2.putText(
                    input_image,
                    label,
                    (x1 + 3, text_y),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.5,
                    (255, 255, 255),
                    thickness=1,
                    lineType=cv2.LINE_AA,
                )

            success, encoded_image = cv2.imencode(".png", input_image)
            if success:
                annotated_image = f"data:image/png;base64,{base64.b64encode(encoded_image).decode('ascii')}"
            else:
                annotated_image = None
    except Exception:
        annotated_image = None
    finally:
        try:
            temp_file_path.unlink()
        except Exception:
            pass

    return {
        "detections": output,
        "classes": class_names,
        "annotated_image": annotated_image,
    }


@app.post("/training_flow")
async def run_flow():
    sys.path.insert(0, str(root_dir / ".." / "07-orchestration"))
    from flow import training_flow

    training_flow()
