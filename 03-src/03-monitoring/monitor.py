"""
Exportador Prometheus para monitoreo de inferencia YOLO y recursos del sistema.
"""

import time

from prometheus_client import Gauge, start_http_server
from ultralytics.utils.logger import SystemLogger

# Definir métricas Prometheus
inference_latency = Gauge(
    "yolo_inference_latency_ms", "Tiempo de inferencia por imagen (ms)"
)
detection_count = Gauge("yolo_detection_count", "Número de detecciones por imagen")
avg_confidence = Gauge("yolo_avg_confidence", "Confianza promedio de las detecciones")
cpu_usage = Gauge("system_cpu_usage_percent", "Uso de CPU (%)")
ram_usage = Gauge("system_ram_usage_percent", "Uso de RAM (%)")
gpu_usage = Gauge("system_gpu_usage_percent", "Uso de GPU (%)", ["gpu_id"])
gpu_mem = Gauge("system_gpu_memory_percent", "Uso de memoria GPU (%)", ["gpu_id"])
gpu_temp = Gauge("system_gpu_temp_celsius", "Temperatura GPU (°C)", ["gpu_id"])
gpu_power = Gauge("system_gpu_power_watts", "Consumo GPU (W)", ["gpu_id"])


def export_inference_metrics(results):
    """Exporta métricas de inferencia YOLO a Prometheus."""
    if not results:
        return
    r = results[0]
    # Latencia de inferencia
    if hasattr(r, "speed") and "inference" in r.speed:
        inference_latency.set(r.speed["inference"])
    # Conteo de detecciones
    if hasattr(r, "boxes") and hasattr(r.boxes, "shape"):
        detection_count.set(r.boxes.shape[0])
        if hasattr(r.boxes, "conf"):
            avg_confidence.set(r.boxes.conf.mean().item())


def export_system_metrics():
    """Exporta métricas de recursos del sistema a Prometheus."""
    logger = SystemLogger()
    metrics = logger.get_metrics()
    cpu_usage.set(metrics["cpu"])
    ram_usage.set(metrics["ram"])
    for gpu_id, gpu in metrics.get("gpus", {}).items():
        gpu_usage.labels(gpu_id=gpu_id).set(gpu["usage"])
        gpu_mem.labels(gpu_id=gpu_id).set(gpu["memory"])
        gpu_temp.labels(gpu_id=gpu_id).set(gpu["temp"])
        gpu_power.labels(gpu_id=gpu_id).set(gpu["power"])


if __name__ == "__main__":
    # Iniciar servidor Prometheus en el puerto 8000
    start_http_server(8000)
    print("Prometheus metrics exporter corriendo en http://localhost:8000/metrics")
    while True:
        export_system_metrics()
        # Para exportar métricas de inferencia, llama export_inference_metrics(results) después de cada inferencia
        time.sleep(5)
