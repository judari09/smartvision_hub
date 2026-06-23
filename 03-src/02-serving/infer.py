from ultralytics import YOLO

DEFAULT_MODEL = "04-models/yolo26n.pt"
_model_cache = {}


def _get_model(model_path: str | None = None):
    path = model_path or DEFAULT_MODEL
    # Cache models by the given path to avoid reloading on every request
    if path not in _model_cache:
        _model_cache[path] = YOLO(path, task="detect", verbose=False)
    return _model_cache[path]


def infer(
    image_path: str,
    model_path: str | None = None,
    conf: float = 0.5,
    iou: float = 0.5,
    tta: bool = False,
):
    """Run inference on a single image.

    Args:
        image_path: Path to the image file.
        model_path: Optional path to a model file (cached).
        conf: Confidence threshold (0.0 - 1.0).
        iou: IOU threshold (0.0 - 1.0).
        tta: Enable test-time augmentation (augment).

    Returns:
        ultralytics results object iterable.
    """
    model = _get_model(model_path)
    results = model(image_path, conf=conf, iou=iou, augment=tta)
    return results
