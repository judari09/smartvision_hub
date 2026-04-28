"""
Entrenamiento YOLO para detección de placas vehiculares.

Tracking  : MLflow  — métricas por época, hiperparámetros y artefactos
Dataset   : DVC     — ejecutar `dvc pull` antes de entrenar para obtener las imágenes
Aumentado : Albumentations — pipeline severo que simula condiciones reales de captura
"""

import os
from pathlib import Path

import albumentations as A
import mlflow
from ultralytics import YOLO, settings

# ── Rutas ────────────────────────────────────────────────────────────────────
PROJECT_ROOT = Path(__file__).parent

# El archivo data.yaml debe estar versionado con DVC.
# Antes de entrenar: `dvc pull`
DATA_YAML = PROJECT_ROOT / "01-config" / "dataset.yaml"

# ── Configuración de entrenamiento ───────────────────────────────────────────
TRAIN_CFG: dict = dict(
    # Modelo base
    model="yolo11n.pt",
    data=str(DATA_YAML),
    # Ciclo de entrenamiento
    epochs=15,
    patience=30,        # early stopping sin mejora en val/mAP50-95
    batch=16,
    imgsz=640,
    # Hardware
    device=0,           # GPU 0; usar "cpu" o [0, 1] para multi-GPU
    workers=8,
    # Optimizador
    optimizer="AdamW",
    lr0=1e-3,
    lrf=1e-2,           # lr_final = lr0 * lrf
    momentum=0.937,
    weight_decay=5e-4,
    warmup_epochs=3,
    # Augmentaciones geométricas integradas de Ultralytics
    degrees=5.0,        # rotación leve (las placas rara vez aparecen muy inclinadas)
    translate=0.1,
    scale=0.6,          # zoom out agresivo para aprender placas lejanas
    shear=2.0,
    perspective=0.0005,
    fliplr=0.5,
    flipud=0.0,         # las placas nunca aparecen invertidas verticalmente
    mosaic=0.8,
    mixup=0.1,
    copy_paste=0.0,
    # Augmentaciones de color integradas de Ultralytics
    hsv_h=0.015,
    hsv_s=0.7,
    hsv_v=0.4,
    # Salida
    project="vehicles_detection",
    name="yolo11n_run",
    exist_ok=False,
    save_period=10,     # checkpoint cada N épocas
    plots=True,
    val=True,
    verbose=True,
)

# ── Configuración de MLflow ──────────────────────────────────────────────────
MLFLOW_CFG: dict = dict(
    tracking_uri=str(PROJECT_ROOT / "mlruns"),
    experiment_name="license-plate-detection",
    run_name=TRAIN_CFG["name"],
    tags={
        "model": TRAIN_CFG["model"],
        "dataset": "placas-colombia-v1",
        "framework": "ultralytics",
        "augmentation": "albumentations-severe",
    },
)


# ── Pipeline de aumentado Albumentations ─────────────────────────────────────
def build_augmentation_pipeline() -> list:
    """
    Augmentaciones realistas para detección de placas en entornos viales.

    Escenarios cubiertos:
    - Desenfoque por movimiento y vibración de cámara
    - Condiciones climáticas: lluvia, niebla, destello solar
    - Variaciones de iluminación: noche, contraluz, sobrexposición
    - Ruido de sensor: cámaras de seguridad de bajo costo, alta ISO
    - Compresión JPEG de grabaciones y transmisiones en baja calidad
    - Perspectiva oblicua: cámaras en ángulo lateral o superior
    - Oclusiones parciales: objetos, suciedad, vehículos superpuestos
    """
    return [
        # ── Desenfoque ───────────────────────────────────────────────────────
        A.OneOf(
            [
                # Placa en movimiento rápido
                A.MotionBlur(blur_limit=(3, 15), p=1.0),
                # Cámara desenfocada o lente sucio
                A.Defocus(radius=(1, 5), alias_blur=0.1, p=1.0),
                # Vibración de cámara
                A.GaussianBlur(blur_limit=(3, 9), p=1.0),
            ],
            p=0.5,
        ),
        # ── Condiciones climáticas ───────────────────────────────────────────
        A.OneOf(
            [
                A.RandomRain(
                    slant_range=(-15, 15),
                    drop_length=12,
                    drop_width=1,
                    brightness_coefficient=0.85,
                    p=1.0,
                ),
                A.RandomFog(
                    fog_coef_range=(0.2, 0.5),
                    alpha_coef=0.1,
                    p=1.0,
                ),
                A.RandomSunFlare(
                    flare_roi=(0.0, 0.0, 1.0, 0.5),
                    src_radius=150,
                    num_flare_circles_range=(4, 8),
                    p=1.0,
                ),
            ],
            p=0.3,
        ),
        # ── Iluminación: noche, contraluz, sobrexposición ────────────────────
        A.OneOf(
            [
                A.RandomBrightnessContrast(
                    brightness_limit=(-0.5, 0.4),
                    contrast_limit=(-0.3, 0.4),
                    p=1.0,
                ),
                # Gamma bajo → subexposición nocturna; alto → sobrexposición
                A.RandomGamma(gamma_limit=(40, 180), p=1.0),
            ],
            p=0.6,
        ),
        # ── Tonalidad y saturación (luces LED, neón, semáforos) ─────────────
        A.HueSaturationValue(
            hue_shift_limit=20,
            sat_shift_limit=40,
            val_shift_limit=30,
            p=0.4,
        ),
        # ── Ruido de sensor ──────────────────────────────────────────────────
        A.OneOf(
            [
                A.GaussNoise(std_range=(0.05, 0.25), per_channel=True, p=1.0),
                A.ISONoise(color_shift=(0.02, 0.1), intensity=(0.2, 0.7), p=1.0),
            ],
            p=0.4,
        ),
        # ── Compresión JPEG (grabaciones de baja calidad / streaming) ────────
        A.ImageCompression(quality_range=(25, 75), p=0.4),
        # ── Realce de contraste local (CLAHE) ────────────────────────────────
        A.CLAHE(clip_limit=(2.0, 6.0), tile_grid_size=(8, 8), p=0.3),
        # ── Perspectiva oblicua (cámara lateral o en altura) ─────────────────
        A.Perspective(scale=(0.03, 0.10), keep_size=True, p=0.35),
        # ── Oclusión parcial ─────────────────────────────────────────────────
        A.CoarseDropout(
            num_holes_range=(1, 10),
            hole_height_range=(6, 32),
            hole_width_range=(6, 32),
            fill=0,
            p=0.3,
        ),
    ]


# ── Setup MLflow ─────────────────────────────────────────────────────────────
def configure_mlflow() -> None:
    """
    Establece variables de entorno y activa la integración automática de
    Ultralytics con MLflow.

    El callback nativo de Ultralytics reutiliza el active_run() si ya existe,
    por lo que arrancar el run aquí permite añadir tags antes del entrenamiento.
    """
    os.environ["MLFLOW_TRACKING_URI"] = MLFLOW_CFG["tracking_uri"]
    os.environ["MLFLOW_EXPERIMENT_NAME"] = MLFLOW_CFG["experiment_name"]
    os.environ["MLFLOW_RUN"] = MLFLOW_CFG["run_name"]
    # No llamar settings.reset() — eliminaría el flag mlflow=True
    settings.update({"mlflow": True})
    mlflow.set_tracking_uri(MLFLOW_CFG["tracking_uri"])
    mlflow.set_experiment(MLFLOW_CFG["experiment_name"])


# ── Entrenamiento ─────────────────────────────────────────────────────────────
def train() -> None:
    configure_mlflow()

    # Arrancar el run manualmente para poder asociar tags personalizados.
    # El callback de Ultralytics detecta el active_run() y lo reutiliza:
    # no se crean runs duplicados.
    with mlflow.start_run(
        run_name=MLFLOW_CFG["run_name"],
        tags=MLFLOW_CFG["tags"],
    ):
        model = YOLO(TRAIN_CFG["model"])
        model.train(
            **{k: v for k, v in TRAIN_CFG.items() if k != "model"},
            augmentations=build_augmentation_pipeline(),
        )
        
        # ── Registrar modelo en MLflow ───────────────────────────────────────
        # Obtener el run_id actual
        run_id = mlflow.active_run().info.run_id
        
        # URI del modelo YOLO (se guarda automáticamente como "model")
        model_uri = f"runs:/{run_id}/model"
        
        # Registrar en el Model Registry
        registered_model = mlflow.register_model(
            model_uri=model_uri,
            name="vehicle_detection"  # Nombre en el registry
        )
        
        print(f"Modelo registrado: {registered_model.name}")
        print(f"Versión: {registered_model.version}")
        

if __name__ == "__main__":
    train()
