import os
import sys
from contextlib import asynccontextmanager
from pathlib import Path

import yaml
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
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
from infer import infer

config_root = Path(__file__).resolve().parent.parent / "01-config"
CONFIG_FILES = {
    "dataset": config_root / "dataset.yaml",
    "flow": config_root / "flow_config.yaml",
    "train": config_root / "train_config.yaml",
}


def read_yaml(path: Path):
    try:
        with path.open("r", encoding="utf-8") as f:
            return yaml.safe_load(f) or {}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error leyendo YAML: {e}")


def write_yaml(path: Path, data: dict):
    try:
        with path.open("w", encoding="utf-8") as f:
            yaml.safe_dump(data, f, sort_keys=False, allow_unicode=True)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error escribiendo YAML: {e}")


def deep_update(base: dict, updates: dict):
    for key, value in updates.items():
        if isinstance(value, dict) and isinstance(base.get(key), dict):
            deep_update(base[key], value)
        else:
            base[key] = value
    return base


app = FastAPI(lifespan=lifespan)


@app.get("/")
async def root():
    """Endpoint raíz - API info"""
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
    """Endpoint de salud de la API"""
    return {"status": "healthy", "monitoring": "active"}


@app.get("/config")
async def list_configs():
    return {"configs": list(CONFIG_FILES.keys())}


@app.get("/config/{name}")
async def get_config(name: str):
    path = CONFIG_FILES.get(name)
    if not path or not path.exists():
        raise HTTPException(status_code=404, detail="Config no encontrada")
    return read_yaml(path)


@app.put("/config/{name}")
async def put_config(name: str, config: dict):
    path = CONFIG_FILES.get(name)
    if not path:
        raise HTTPException(status_code=404, detail="Config no encontrada")
    write_yaml(path, config)
    return {"status": "ok", "config": config}


@app.patch("/config/{name}")
async def patch_config(name: str, updates: dict):
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
async def run_inference(
    file: UploadFile = File(...),
    model_path: str | None = Form(None),
    confidence: float = Form(50),
    iou: float = Form(50),
    ttaenabled: bool = Form(False),
):
    # Guardar el archivo temporalmente en un directorio válido para la plataforma
    from pathlib import Path
    from tempfile import NamedTemporaryFile

    safe_filename = Path(file.filename).name
    with NamedTemporaryFile(
        prefix="upload_", suffix=Path(safe_filename).suffix, delete=False
    ) as tmp:
        temp_file_path = Path(tmp.name)
        tmp.write(await file.read())

    try:
        # Convertir valores desde la UI (0-100) a rango 0.0-1.0
        conf_val = float(confidence) / 100.0 if confidence is not None else 0.5
        iou_val = float(iou) / 100.0 if iou is not None else 0.5
        model_path = model_path or None
        tta = bool(ttaenabled)

        # Ejecutar inferencia usando la ruta temporal y parámetros recibidos
        results = infer(
            str(temp_file_path),
            model_path=model_path,
            conf=conf_val,
            iou=iou_val,
            tta=tta,
        )
    finally:
        try:
            temp_file_path.unlink()
        except Exception:
            pass

    # Procesar resultados (ejemplo: convertir a dict)
    output = []
    for r in results:
        for box in r.boxes:
            output.append(
                {
                    "class": int(box.cls),
                    "confidence": float(box.conf),
                    "bbox": box.xyxy.tolist(),
                }
            )

    return {"detections": output}


@app.post("/training_flow")
async def run_flow():
    sys.path.insert(0, str(root_dir / ".." / "07-orchestration"))
    from flow import training_flow

    training_flow()
