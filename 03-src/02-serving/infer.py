from ultralytics import YOLO

model = YOLO("04-models/yolo26n.pt", task="detect", verbose=False)

def infer(image_path: str):
    results = model(image_path)
    return results