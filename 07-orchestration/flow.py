# 1 preparacion conversion json a txt
# 2 separacion de dataset
# 3 entrenamiento

import sys
from pathlib import Path

import yaml
from prefect import flow, task

# monitoreo de inferencia y recursos del sistema
root_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(root_dir / ".." / "03-src" / "04-utils"))
from json2txt import Json2TxtTask
from separar_train_val import SepararTrainValTask

sys.path.insert(0, str(root_dir / ".." / "03-src" / "01-models"))
from train import train

with open("01-config/flow_config.yaml", "r") as f:
    config = yaml.safe_load(f)


@task
def prepare_data():
    print("Preparando datos...")

    def parse_class_map(entries):
        if isinstance(entries, dict):
            return {str(k): int(v) for k, v in entries.items()}

        mapping = {}
        for entry in entries or []:
            if ":" in entry:
                label, value = entry.split(":", 1)
                try:
                    mapping[label.strip()] = int(value)
                except ValueError:
                    print(
                        f"Advertencia: valor de clase inválido para '{label}': {value}"
                    )
        return mapping

    params = {
        "input_dir": config["prepare"]["input_dir"],
        "output_dir": config["prepare"]["output_dir"],
        "carpeta_imagenes": config["prepare"]["carpeta_imagenes"]
        or config["prepare"]["input_dir"],
        "class_map": parse_class_map(config["prepare"].get("class_map", {})),
        "default_class_id": config["prepare"]["default_class_id"],
        "polygon_4pt_as_bbox": config["prepare"]["polygon_4pt_as_bbox"],
    }

    Json2TxtTask(params).run()


@task
def split_dataset():
    print("Separando dataset...")

    task = SepararTrainValTask(
        {
            "images_folder": config["split"]["images"],
            "labels_folder": config["split"]["labels"],
            "train_folder": config["split"]["train"],
            "val_folder": config["split"]["val"],
            "split_ratio": config["split"]["split_ratio"],
        }
    )
    task.run()


@task
def train_model():
    print("Entrenando modelo...")
    train.train()


@flow
def training_flow():
    print("Iniciando flujo de entrenamiento...")
    # Aquí irían las tareas de preparación, separación y entrenamiento
    prepare_data()
    split_dataset()
    train_model()

    print("Flujo de entrenamiento completado.")
