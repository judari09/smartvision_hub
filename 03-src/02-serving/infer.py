from ultralytics import YOLO

model = YOLO("models/", task="detect")

def infer(image_path: str):
    results = model(image_path)
    return results