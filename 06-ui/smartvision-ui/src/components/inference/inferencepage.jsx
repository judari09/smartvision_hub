import { useEffect, useState } from "react";
import "./inferencepage.css";

import ImageWidget from "./imagewidget.jsx";
import InferenceConfigWidget from "./inferenceconfigwidget.jsx";

export default function InferencePage({ imageSrc = "" }) {
    // UI state for the inference workflow.
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [result, setResult] = useState(null);
    const [processedImage, setProcessedImage] = useState(imageSrc);
    const [detections, setDetections] = useState([]);

    useEffect(() => {
        setProcessedImage(imageSrc);
        setDetections([]);
        setResult(null);
    }, [imageSrc]);

    // Send the selected image to the backend and store the annotated response.
    const handleInference = async () => {
        if (!imageSrc) {
            setError("No hay una imagen disponible para inferir.");
            return;
        }

        try {
            setLoading(true);
            setError("");
            setResult(null);
            setDetections([]);

            const imageResponse = await fetch(imageSrc);
            if (!imageResponse.ok) {
                throw new Error("No se pudo cargar la imagen para inferencia.");
            }

            const imageBlob = await imageResponse.blob();
            const file = new File([imageBlob], "inference-image.png", {
                type: imageBlob.type || "image/png",
            });

            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch("http://localhost:8000/infer", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || "No se pudo completar la inferencia.");
            }

            const data = await response.json();
            setResult(data);
            setDetections(Array.isArray(data?.detections) ? data.detections : []);
            setProcessedImage(data?.annotated_image || imageSrc);
        } catch (err) {
            setError(err.message || "Error al ejecutar la inferencia.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="inference-page-container">
            <ImageWidget
                imageSrc={imageSrc}
                processedSrc={processedImage}
            />
            <InferenceConfigWidget />
            <button className="inference-button" onClick={handleInference} disabled={loading}>
                {loading ? "Ejecutando..." : "Iniciar Inferencia"}
            </button>
            {error && <p className="inference-status error">{error}</p>}
            {result && (
                <div className="inference-status">
                    <p>Detecciones obtenidas: {detections.length}</p>
                    {detections.slice(0, 5).map((detection, index) => (
                        <p key={`info-${index}`}>
                            {detection.class_name ?? `Clase ${detection.class ?? index + 1}`} · {(detection.confidence * 100).toFixed(0)}%
                        </p>
                    ))}
                </div>
            )}
        </div>
    );
}

