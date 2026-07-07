# SmartVision Hub

SmartVision Hub es una plataforma de demostración para ejecutar inferencia de objetos con YOLO desde una interfaz web moderna y un backend FastAPI. El flujo cubre la carga de imágenes, la inferencia con un modelo entrenado o listo para usar, la visualización de resultados y la gestión básica de configuraciones del proyecto.

## Características principales

- Inferencia de imágenes desde la interfaz web mediante un endpoint FastAPI.
- Visualización de la imagen original y la imagen anotada con cajas y etiquetas.
- Exposición de detecciones con nombre de clase, confianza y coordenadas de bounding box.
- Gestión de configuraciones YAML para dataset, entrenamiento, flujo y modelo.
- Integración opcional con Prometheus para monitoreo de métricas del sistema.

## Estructura del proyecto

- [05-api](05-api): backend FastAPI con los endpoints de inferencia y configuración.
- [06-ui/smartvision-ui](06-ui/smartvision-ui): frontend React + Vite para interactuar con la aplicación.
- [03-src](03-src): módulos de entrenamiento, inferencia, monitoreo y utilidades.
- [01-config](01-config): archivos YAML de configuración.
- [04-models](04-models): pesos del modelo YOLO.
- [07-orchestration](07-orchestration): flujo de trabajo de Prefect para preparación, partición y entrenamiento.

## Requisitos

- Python 3.12+
- Node.js 18+
- npm o pnpm

## Instalación

1. Crear y activar un entorno virtual:

   ```powershell
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   ```

2. Instalar dependencias de Python:

   ```powershell
   pip install -e .
   ```

3. Instalar dependencias del frontend:

   ```powershell
   cd 06-ui/smartvision-ui
   npm install
   ```

## Ejecución

### Backend

```powershell
cd 05-api
uvicorn api:app --reload
```

La API quedará disponible en:
- http://localhost:8000/docs para la documentación interactiva de FastAPI.
- http://localhost:8000/health para revisar el estado del servicio.

### Frontend

```powershell
cd 06-ui/smartvision-ui
npm run dev
```

La interfaz quedará disponible en http://localhost:5173.

## Uso básico

1. Abrir el frontend en el navegador.
2. Ir a la sección de Inferencia.
3. Seleccionar una imagen desde el equipo.
4. Pulsar “Iniciar Inferencia” para enviar la imagen al backend.
5. Revisar la imagen anotada y las detecciones obtenidas.

## Configuración del modelo

El archivo [01-config/inference.yaml](01-config/inference.yaml) define:

- `model_path`: ruta al archivo del modelo.
- `confidence`: umbral de confianza para filtrar detecciones.
- `iou`: umbral IoU para NMS.
- `ttaenabled`: activación de test-time augmentation.

## Flujo de entrenamiento

El pipeline de entrenamiento se encuentra en [07-orchestration/flow.py](07-orchestration/flow.py) y se organiza con Prefect para:

1. Preparar los datos.
2. Separar el dataset en train/val.
3. Lanzar el entrenamiento del modelo.

## Monitoreo

La API puede iniciar un servidor Prometheus en el puerto 8001 para exponer métricas del sistema, siempre que las dependencias de monitoreo estén disponibles.

## Notas

- El proyecto está pensado como una base para experimentar con detección de objetos y servir inferencia como un producto mínimo viable.
- Si necesitas cambiar el modelo por defecto o ajustar umbrales, edita [01-config/inference.yaml](01-config/inference.yaml).
