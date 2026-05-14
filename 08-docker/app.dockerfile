FROM python:3.12-slim

WORKDIR /app

COPY pyproject.toml .

RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir . 
COPY . .
EXPOSE 8000
EXPOSE 8001
EXPOSE 5000
EXPOSE 4200

# Crear script de inicio para ejecutar los 3 servicios
RUN echo '#!/bin/bash\n\
    prefect server start --host 0.0.0.0 --port 4200 &\n\
    sleep 5\n\
    mlflow ui --host 0.0.0.0 --backend-store-uri sqlite:///mlruns/mlflow.db --port 5000 &\n\
    sleep 5\n\
    uvicorn api:app --host 0.0.0.0 --port 8000 --app-dir /app/05-api\n\
    wait' > /usr/local/bin/start.sh && chmod +x /usr/local/bin/start.sh

ENTRYPOINT ["/usr/local/bin/start.sh"]