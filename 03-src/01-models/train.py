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
import yaml
from ultralytics import YOLO, settings

# ── Rutas ────────────────────────────────────────────────────────────────────
REPO_ROOT = Path(__file__).resolve().parents[2]
CONFIG_YAML = REPO_ROOT / "01-config" / "train_config.yaml"

# El archivo data.yaml debe estar versionado con DVC.
# Antes de entrenar: `dvc pull`
DATA_YAML = REPO_ROOT / "01-config" / "dataset.yaml"


def load_yaml_config(config_path: Path) -> dict:
    """
    Load a YAML configuration file from disk.

    Parameters
    ----------
    config_path : Path
        Path to the YAML file to load.

    Returns
    -------
    dict
        Parsed configuration dictionary.
    """
    with config_path.open("r", encoding="utf-8") as f:
        return yaml.safe_load(f)


_config = load_yaml_config(CONFIG_YAML)
TRAIN_CFG: dict = _config["train"]
DATA_YAML = Path(TRAIN_CFG["data"])
if not DATA_YAML.is_absolute():
    DATA_YAML = REPO_ROOT / DATA_YAML
TRAIN_CFG["data"] = str(DATA_YAML)

# ── Configuración de MLflow ──────────────────────────────────────────────────
MLFLOW_CFG: dict = _config["mlflow"]
tracking_uri = Path(MLFLOW_CFG["tracking_uri"])
if not tracking_uri.is_absolute():
    tracking_uri = REPO_ROOT / tracking_uri
MLFLOW_CFG["tracking_uri"] = str(tracking_uri)
MLFLOW_CFG["run_name"] = TRAIN_CFG.get("name", MLFLOW_CFG.get("run_name"))


# ── Pipeline de aumentado Albumentations ─────────────────────────────────────
def build_augmentation_pipeline() -> list:
    """
    Build a realistic augmentation pipeline for vehicle plate detection.

    Returns
    -------
    list
        Sequence of Albumentations transforms that simulate blur, weather,
        illumination changes, sensor noise, compression artifacts, perspective,
        and partial occlusions.
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
    Configure MLflow integration for the training run.

    Notes
    -----
    The Ultralytics MLflow callback reuses the active run when one already
    exists, so the run is started here before training begins.
    """
    os.environ["MLFLOW_BACKEND_STORE_URI"] = MLFLOW_CFG["backend_store_uri"]
    os.environ["MLFLOW_EXPERIMENT_NAME"] = MLFLOW_CFG["experiment_name"]
    os.environ["MLFLOW_RUN"] = MLFLOW_CFG["run_name"]
    # No llamar settings.reset() — eliminaría el flag mlflow=True
    settings.update({"mlflow": True})
    mlflow.set_tracking_uri(MLFLOW_CFG["tracking_uri"])
    mlflow.set_experiment(MLFLOW_CFG["experiment_name"])


# ── Entrenamiento ─────────────────────────────────────────────────────────────
def train() -> None:
    """
    Train the YOLO model and register the resulting artifact in MLflow.

    Notes
    -----
    The training configuration is loaded from the YAML files and the resulting
    model is registered in the MLflow model registry after training completes.
    """
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
            name=MLFLOW_CFG["name_registry"],  # Nombre en el registry
        )

        print(f"Modelo registrado: {registered_model.name}")
        print(f"Versión: {registered_model.version}")


if __name__ == "__main__":
    train()
