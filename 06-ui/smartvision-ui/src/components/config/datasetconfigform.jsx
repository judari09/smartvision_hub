import { useState } from "react";
import "./datasetconfigform.css";

export default function DatasetConfigForm() {
    const [datasetPath, setDatasetPath] = useState("");
    const [classesText, setClassesText] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");

        try {
            // Parsear clases del formato "0:class\n1:class" a dict {0: class, 1: class}
            const classesDict = {};
            const lines = classesText
                .split("\n")
                .map((line) => line.trim())
                .filter((line) => line);

            for (const line of lines) {
                const [id, className] = line.split(":").map((s) => s.trim());
                if (id && className) {
                    classesDict[id] = className;
                }
            }

            // Crear payload según el formato esperado por la API
            const config = {
                path: datasetPath,
                train: "data/dataset/train",
                val: "data/dataset/val",
                names: classesDict,
            };

            const response = await fetch("http://localhost:8000/config/dataset", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(config),
            });

            if (!response.ok) {
                throw new Error(`Error: ${response.statusText}`);
            }

            setMessage("✓ Configuración guardada correctamente");
            setDatasetPath("");
            setClassesText("");
        } catch (error) {
            setMessage(`✗ Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="dataset-config-form-container">
            <div className="dataset-config-form-header">
                <h2>Dataset Config</h2>
                <div className="dataset-config-form-content">
                    <p>Configuración del dataset, define las rutas a tu dataset y las clases a entrenar</p>
                </div>
            </div>
            <form className="dataset-config-form" onSubmit={handleSubmit}>
                <ul>
                    <li>
                        <label htmlFor="datasetPath">Ruta del Dataset:</label>
                        <input
                            type="text"
                            id="datasetPath"
                            name="datasetPath"
                            placeholder="/ruta/a/tu/dataset"
                            value={datasetPath}
                            onChange={(e) => setDatasetPath(e.target.value)}
                            required
                        />
                    </li>
                    <li>
                        <label htmlFor="classes">Clases a Entrenar (formato id:clase, una por línea):</label>
                        <textarea
                            id="classes"
                            name="classes"
                            placeholder="0:person&#10;1:dog&#10;2:cat"
                            value={classesText}
                            onChange={(e) => setClassesText(e.target.value)}
                            required
                        />
                    </li>
                </ul>
                <button type="submit" className="dataset-config-form-button" disabled={loading}>
                    {loading ? "Guardando..." : "Guardar Configuración"}
                </button>
                {message && <div className={`message ${message.startsWith("✓") ? "success" : "error"}`}>{message}</div>}
            </form>
        </div>
    );
}