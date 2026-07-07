"""Utilities for running YOLO inference over single images."""

from pathlib import Path

import yaml
from ultralytics import YOLO

DEFAULT_MODEL = "04-models/yolo26n.pt"
_model_cache = {}


def _normalize_threshold(value, default=0.5):
    """
    Normalize a threshold value to the [0, 1] range expected by Ultralytics.

    Parameters
    ----------
    value : float | None
        Threshold value provided by configuration or the API.
    default : float, optional
        Fallback value when ``value`` is ``None``.

    Returns
    -------
    float
        Threshold normalized to the range expected by the model.
    """
    if value is None:
        return default

    value = float(value)
    return value / 100.0 if value > 1.0 else value


def _load_inference_config():
    """
    Load inference settings from the repository configuration file.

    Returns
    -------
    dict
        Dictionary with inference model and threshold settings.
    """
    config_path = Path(__file__).resolve().parents[2] / "01-config" / "inference.yaml"
    if not config_path.exists():
        return {}

    with config_path.open("r", encoding="utf-8") as f:
        return yaml.safe_load(f) or {}


def _get_model(model_path: str | None = None):
    """
    Load and cache an Ultralytics YOLO model instance.

    Parameters
    ----------
    model_path : str | None, optional
        Path to the model weights file. If omitted, the default repo model is used.

    Returns
    -------
    YOLO
        Cached YOLO model instance.
    """
    path = model_path or DEFAULT_MODEL
    # Cache models by the given path to avoid reloading on every request
    if path not in _model_cache:
        _model_cache[path] = YOLO(path, task="detect", verbose=False)
    return _model_cache[path]


def infer(
    image_path: str,
    model_path: str | None = None,
    conf: float | None = None,
    iou: float | None = None,
    tta: bool | None = None,
):
    """
    Run object detection inference on a single image.

    Parameters
    ----------
    image_path : str
        Path to the image file to analyze.
    model_path : str | None, optional
        Optional model weights path. Uses the repository default when not provided.
    conf : float | None, optional
        Confidence threshold for predictions.
    iou : float | None, optional
        Non-maximum suppression threshold.
    tta : bool | None, optional
        Whether to enable test-time augmentation.

    Returns
    -------
    list
        Ultralytics result objects for the processed image.
    """
    config = _load_inference_config()
    if model_path is None:
        model_path = config.get("model_path") or None
    if conf is None:
        conf = config.get("confidence", 50)
    if iou is None:
        iou = config.get("iou", 50)
    if tta is None:
        tta = config.get("ttaenabled", False)

    conf_value = _normalize_threshold(conf, 0.5)
    iou_value = _normalize_threshold(iou, 0.5)
    tta_value = bool(tta)

    model = _get_model(model_path)
    results = model(image_path, conf=conf_value, iou=iou_value, augment=tta_value)
    return results
