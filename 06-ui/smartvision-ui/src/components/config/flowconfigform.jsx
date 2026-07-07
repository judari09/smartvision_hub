import { useEffect, useState } from "react";
import "./flowconfigform.css";

export default function FlowConfigForm() {
    const [pInputDir, setPInputDir] = useState("");
    const [pOutputDir, setPOutDir] = useState("");
    const [pImagesDir, setPImagesDir] = useState("");
    const [pClassesText, setPClassesText] = useState("");
    const [pDefaultClassId, setPDefaultClassId] = useState("");
    const [pPolygon4ptAsBbox, setPPolygon4ptAsBbox] = useState(false);

    const [sImagesDir, setSImagesDir] = useState("");
    const [sLabelsDir, setSLabelsDir] = useState("");
    const [sTrainDir, setSTrainDir] = useState("");
    const [sValDir, setSValDir] = useState("");
    const [sSplitRatio, setSSplitRatio] = useState("");

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const [initialLoading, setInitialLoading] = useState(true);

    const formatClassMapToText = (classMap) => {
        if (!classMap) return "";
        return Object.entries(classMap)
            .map(([k, v]) => `${k}:${v}`)
            .join("\n");
    };

    useEffect(() => {
        const loadConfig = async () => {
            try {
                setInitialLoading(true);
                const res = await fetch("http://localhost:8000/config/flow");
                if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
                const data = await res.json();
                const prep = data.prepare || {};
                const split = data.split || {};
                setPInputDir(prep.input_dir || "");
                setPOutDir(prep.output_dir || "");
                setPImagesDir(prep.images_dir || "");
                setPClassesText(formatClassMapToText(prep.class_map));
                setPDefaultClassId(prep.default_class_id ?? "");
                setPPolygon4ptAsBbox(Boolean(prep.polygon_4pt_as_bbox));

                setSImagesDir(split.images || "");
                setSLabelsDir(split.labels || "");
                setSTrainDir(split.train || "");
                setSValDir(split.val || "");
                setSSplitRatio(split.split_ratio ?? "");
            } catch (err) {
                setMessage(`✗ Error cargando configuración: ${err.message}`);
            } finally {
                setInitialLoading(false);
            }
        };

        loadConfig();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");

        try {
            const config = {
                prepare: {
                    input_dir: pInputDir,
                    output_dir: pOutputDir,
                    images_dir: pImagesDir,
                    class_map: pClassesText
                        .split("\n")
                        .map((l) => l.trim())
                        .filter(Boolean)
                        .reduce((acc, line) => {
                            const [k, v] = line.split(":").map((s) => s.trim());
                            if (k && v !== undefined) acc[k] = isNaN(Number(v)) ? v : Number(v);
                            return acc;
                        }, {}),
                    default_class_id: pDefaultClassId === "" ? null : Number(pDefaultClassId),
                    polygon_4pt_as_bbox: Boolean(pPolygon4ptAsBbox),
                },
                split: {
                    images: sImagesDir,
                    labels: sLabelsDir,
                    train: sTrainDir,
                    val: sValDir,
                    split_ratio: parseFloat(sSplitRatio),
                },
            };

            const res = await fetch("http://localhost:8000/config/flow", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(config),
            });
            if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
            setMessage("✓ Configuración guardada");
        } catch (error) {
            setMessage("Error al guardar la configuración");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flow-config-form-container">
            <div className="flow-config-form-header">
                <h2>Flow Config</h2>
                <div className="flow-config-form-content">
                    <p>Configuración del flujo, define los parametros para el uso del pipeline de preparacion con prefect</p>
                </div>
            </div>
            <form className="flow-config-form" onSubmit={handleSubmit}>
                <ul>
                    <h3>Preparación</h3>
                    <p>Parametros de fase de preparacion, conversion de etiquetas de formato json labelme a formato YOLO txt</p>
                    <li>
                        <label htmlFor="input_dir">Carpeta de entrada de los datos crudos (imagenes+etiquetasJSON)</label>
                        <input
                            type="text"
                            id="input_dir"
                            name="input_dir"
                            placeholder="data/raw"
                            value={pInputDir}
                            onChange={(e) => setPInputDir(e.target.value)}
                            required
                        />
                    </li>
                    <li>
                        <label htmlFor="output_dir">Carpeta de salida de los datos preparados en formato para ultralytics</label>
                        <input
                            type="text"
                            id="output_dir"
                            name="output_dir"
                            placeholder="data/yolo_txt"
                            value={pOutputDir}
                            onChange={(e) => setPOutDir(e.target.value)}
                            required
                        />
                    </li>
                    <li>
                        <label htmlFor="images_dir">Carpeta de las imagenes crudas a procesar</label>
                        <input
                            type="text"
                            id="images_dir"
                            name="images_dir"
                            placeholder="images_prueba"
                            value={pImagesDir}
                            onChange={(e) => setPImagesDir(e.target.value)}
                            required
                        />
                    </li>
                    <li>
                        <label htmlFor="class_map">Clases a Entrenar (formato clase:id, una por línea):</label>
                        <textarea
                            id="classes"
                            name="classes"
                            placeholder="person:0&#10;dog:1&#10;cat:2"
                            value={pClassesText}
                            onChange={(e) => setPClassesText(e.target.value)}
                            required
                        />
                    </li>
                    <li>
                        <label htmlFor="default_class_id">id de la clase por defecto o en caso de ver etiquetas no rastreadas en los archivos json</label>
                        <input
                            type="text"
                            id="default_class_id"
                            name="default_class_id"
                            placeholder="0"
                            value={pDefaultClassId}
                            onChange={(e) => setPDefaultClassId(e.target.value)}
                            required
                        />
                    </li>
                    <li>
                        <label htmlFor="polygon_4pt_as_bbox">Bandera para convertir polygonos de 4pts a bbox</label>
                        <input
                            type="checkbox"
                            id="polygon_4pt_as_bbox"
                            name="polygon_4pt_as_bbox"
                            checked={pPolygon4ptAsBbox}
                            onChange={(e) => setPPolygon4ptAsBbox(e.target.checked)}
                        />
                    </li>
                    <h3>Split</h3>
                    <p>Parametros de fase de split, division de dataset en carpetas train/test/val</p>
                    <li>
                        <label htmlFor="split_images_dir">Ruta de las imagenes a dividir en train/test/val</label>
                        <input
                            type="text"
                            id="split_images_dir"
                            name="split_images_dir"
                            placeholder="images_to_split"
                            value={sImagesDir}
                            onChange={(e) => setSImagesDir(e.target.value)}
                            required
                        />
                    </li>
                    <li>
                        <label htmlFor="labels_dir">Ruta de las etiquetas en formato YOLO convertidas en la fase anterior</label>
                        <input
                            type="text"
                            id="labels_dir"
                            name="labels_dir"
                            placeholder="labels_to_split/yolo_txt"
                            value={sLabelsDir}
                            onChange={(e) => setSLabelsDir(e.target.value)}
                            required
                        />
                    </li>
                    <li>
                        <label htmlFor="train_dir">Ruta de la carpeta de entrenamiento del dataset</label>
                        <input
                            type="text"
                            id="train_dir"
                            name="train_dir"
                            placeholder="data/dataset/train"
                            value={sTrainDir}
                            onChange={(e) => setSTrainDir(e.target.value)}
                            required
                        />
                    </li>
                    <li>
                        <label htmlFor="val_dir">Ruta de la carpeta de validacion del dataset</label>
                        <input
                            type="text"
                            id="val_dir"
                            name="val_dir"
                            placeholder="data/dataset/val"
                            value={sValDir}
                            onChange={(e) => setSValDir(e.target.value)}
                            required
                        />
                    </li>
                    <li>
                        <label htmlFor="split_ratio">porcentaje del dataset que se usara para validacion</label>
                        <input
                            type="text"
                            id="split_ratio"
                            name="split_ratio"
                            placeholder="0.2"
                            value={sSplitRatio}
                            onChange={(e) => setSSplitRatio(e.target.value)}
                            required
                        />
                    </li>
                </ul>
                <button type="submit" className="flow-config-form-button" disabled={loading}>
                    {loading ? "Guardando..." : "Guardar Configuración"}
                </button>
                {message && <div className={`message ${message.startsWith("✓") ? "success" : "error"}`}>{message}</div>}
            </form>
        </div>
    );
}