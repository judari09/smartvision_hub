import { useState } from "react";
import "./trainconfigform.css";

export default function TrainConfigForm() {
    // Train Configuration
    const [model, setModel] = useState("yolo11n.pt");
    const [data, setData] = useState("01-config/dataset.yaml");
    const [epochs, setEpochs] = useState(15);
    const [patience, setPatience] = useState(30);
    const [batch, setBatch] = useState(16);
    const [imgsz, setImgsz] = useState(640);
    const [device, setDevice] = useState(0);
    const [workers, setWorkers] = useState(8);
    const [optimizer, setOptimizer] = useState("AdamW");
    const [lr0, setLr0] = useState(0.001);
    const [lrf, setLrf] = useState(0.01);
    const [momentum, setMomentum] = useState(0.937);
    const [weightDecay, setWeightDecay] = useState(0.0005);
    const [warmupEpochs, setWarmupEpochs] = useState(3);
    
    // Augmentation
    const [degrees, setDegrees] = useState(5.0);
    const [translate, setTranslate] = useState(0.1);
    const [scale, setScale] = useState(0.6);
    const [shear, setShear] = useState(2.0);
    const [perspective, setPerspective] = useState(0.0005);
    const [fliplr, setFliplr] = useState(0.5);
    const [flipud, setFlipud] = useState(0.0);
    const [mosaic, setMosaic] = useState(0.8);
    const [mixup, setMixup] = useState(0.1);
    const [copyPaste, setCopyPaste] = useState(0.0);
    const [hsvH, setHsvH] = useState(0.015);
    const [hsvS, setHsvS] = useState(0.7);
    const [hsvV, setHsvV] = useState(0.4);
    
    // Training Output
    const [project, setProject] = useState("vehicles_detection");
    const [name, setName] = useState("yolo11n_run");
    const [existOk, setExistOk] = useState(false);
    const [savePeriod, setSavePeriod] = useState(10);
    const [plots, setPlots] = useState(true);
    const [val, setVal] = useState(true);
    const [verbose, setVerbose] = useState(true);
    
    // MLflow Configuration
    const [backendStoreUri, setBackendStoreUri] = useState("sqlite:///mlflow.db");
    const [experimentName, setExperimentName] = useState("license-plate-detection");
    const [runName, setRunName] = useState("yolo11n_run");
    const [nameRegistry, setNameRegistry] = useState("vehicle_detection");
    const [mlflowModel, setMlflowModel] = useState("yolo11n.pt");
    const [mlflowDataset, setMlflowDataset] = useState("placas-colombia-v1");
    const [mlflowFramework, setMlflowFramework] = useState("ultralytics");
    const [mlflowAugmentation, setMlflowAugmentation] = useState("albumentations-severe");

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");

        try {
            const config = {
                train: {
                    model,
                    data,
                    epochs: parseInt(epochs),
                    patience: parseInt(patience),
                    batch: parseInt(batch),
                    imgsz: parseInt(imgsz),
                    device: parseInt(device),
                    workers: parseInt(workers),
                    optimizer,
                    lr0: parseFloat(lr0),
                    lrf: parseFloat(lrf),
                    momentum: parseFloat(momentum),
                    weight_decay: parseFloat(weightDecay),
                    warmup_epochs: parseInt(warmupEpochs),
                    degrees: parseFloat(degrees),
                    translate: parseFloat(translate),
                    scale: parseFloat(scale),
                    shear: parseFloat(shear),
                    perspective: parseFloat(perspective),
                    fliplr: parseFloat(fliplr),
                    flipud: parseFloat(flipud),
                    mosaic: parseFloat(mosaic),
                    mixup: parseFloat(mixup),
                    copy_paste: parseFloat(copyPaste),
                    hsv_h: parseFloat(hsvH),
                    hsv_s: parseFloat(hsvS),
                    hsv_v: parseFloat(hsvV),
                    project,
                    name,
                    exist_ok: existOk,
                    save_period: parseInt(savePeriod),
                    plots,
                    val,
                    verbose,
                },
                mlflow: {
                    backend_store_uri: backendStoreUri,
                    experiment_name: experimentName,
                    run_name: runName,
                    name_registry: nameRegistry,
                    tags: {
                        model: mlflowModel,
                        dataset: mlflowDataset,
                        framework: mlflowFramework,
                        augmentation: mlflowAugmentation,
                    },
                },
            };
            console.log("Config:", config);
            setMessage("✓ Configuración guardada");
        } catch (error) {
            setMessage("Error al guardar la configuración");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="train-config-form-container">
            <div className="train-config-form-header">
                <h2>Train Config</h2>
                <div className="train-config-form-content">
                    <p>Configuración para el entrenamiento del modelo YOLO con parámetros de aumentación y tracking con MLflow</p>
                </div>
            </div>
            <form className="train-config-form" onSubmit={handleSubmit}>
                <ul>
                    <h3>Configuración del Modelo</h3>
                    <li>
                        <label htmlFor="model">Modelo YOLO</label>
                        <input type="text" id="model" value={model} onChange={(e) => setModel(e.target.value)} required />
                    </li>
                    <li>
                        <label htmlFor="data">Ruta del archivo de dataset (YAML)</label>
                        <input type="text" id="data" value={data} onChange={(e) => setData(e.target.value)} required />
                    </li>

                    <h3>Parámetros de Entrenamiento</h3>
                    <li>
                        <label htmlFor="epochs">Épocas</label>
                        <input type="number" id="epochs" value={epochs} onChange={(e) => setEpochs(e.target.value)} required />
                    </li>
                    <li>
                        <label htmlFor="patience">Paciencia (Early Stopping)</label>
                        <input type="number" id="patience" value={patience} onChange={(e) => setPatience(e.target.value)} required />
                    </li>
                    <li>
                        <label htmlFor="batch">Tamaño de Batch</label>
                        <input type="number" id="batch" value={batch} onChange={(e) => setBatch(e.target.value)} required />
                    </li>
                    <li>
                        <label htmlFor="imgsz">Tamaño de Imagen</label>
                        <input type="number" id="imgsz" value={imgsz} onChange={(e) => setImgsz(e.target.value)} required />
                    </li>
                    <li>
                        <label htmlFor="device">Dispositivo GPU</label>
                        <input type="number" id="device" value={device} onChange={(e) => setDevice(e.target.value)} required />
                    </li>
                    <li>
                        <label htmlFor="workers">Workers (Procesos Paralelos)</label>
                        <input type="number" id="workers" value={workers} onChange={(e) => setWorkers(e.target.value)} required />
                    </li>

                    <h3>Optimizador y Tasa de Aprendizaje</h3>
                    <li>
                        <label htmlFor="optimizer">Optimizador</label>
                        <select id="optimizer" value={optimizer} onChange={(e) => setOptimizer(e.target.value)} required>
                            <option>SGD</option>
                            <option>Adam</option>
                            <option>AdamW</option>
                        </select>
                    </li>
                    <li>
                        <label htmlFor="lr0">Tasa de Aprendizaje Inicial (lr0)</label>
                        <input type="number" id="lr0" step="0.0001" value={lr0} onChange={(e) => setLr0(e.target.value)} required />
                    </li>
                    <li>
                        <label htmlFor="lrf">Tasa de Aprendizaje Final (lrf)</label>
                        <input type="number" id="lrf" step="0.0001" value={lrf} onChange={(e) => setLrf(e.target.value)} required />
                    </li>
                    <li>
                        <label htmlFor="momentum">Momentum</label>
                        <input type="number" id="momentum" step="0.001" value={momentum} onChange={(e) => setMomentum(e.target.value)} required />
                    </li>
                    <li>
                        <label htmlFor="weightDecay">Weight Decay</label>
                        <input type="number" id="weightDecay" step="0.0001" value={weightDecay} onChange={(e) => setWeightDecay(e.target.value)} required />
                    </li>
                    <li>
                        <label htmlFor="warmupEpochs">Épocas de Calentamiento</label>
                        <input type="number" id="warmupEpochs" value={warmupEpochs} onChange={(e) => setWarmupEpochs(e.target.value)} required />
                    </li>

                    <h3>Augmentación de Datos</h3>
                    <li>
                        <label htmlFor="degrees">Rotación (grados)</label>
                        <input type="number" id="degrees" step="0.1" value={degrees} onChange={(e) => setDegrees(e.target.value)} required />
                    </li>
                    <li>
                        <label htmlFor="translate">Traslación</label>
                        <input type="number" id="translate" step="0.01" value={translate} onChange={(e) => setTranslate(e.target.value)} required />
                    </li>
                    <li>
                        <label htmlFor="scale">Escala</label>
                        <input type="number" id="scale" step="0.01" value={scale} onChange={(e) => setScale(e.target.value)} required />
                    </li>
                    <li>
                        <label htmlFor="shear">Sesgo (Shear)</label>
                        <input type="number" id="shear" step="0.1" value={shear} onChange={(e) => setShear(e.target.value)} required />
                    </li>
                    <li>
                        <label htmlFor="perspective">Perspectiva</label>
                        <input type="number" id="perspective" step="0.0001" value={perspective} onChange={(e) => setPerspective(e.target.value)} required />
                    </li>
                    <li>
                        <label htmlFor="fliplr">Volteo Horizontal (FlipLR)</label>
                        <input type="number" id="fliplr" step="0.01" value={fliplr} onChange={(e) => setFliplr(e.target.value)} required />
                    </li>
                    <li>
                        <label htmlFor="flipud">Volteo Vertical (FlipUD)</label>
                        <input type="number" id="flipud" step="0.01" value={flipud} onChange={(e) => setFlipud(e.target.value)} required />
                    </li>
                    <li>
                        <label htmlFor="mosaic">Mosaic</label>
                        <input type="number" id="mosaic" step="0.01" value={mosaic} onChange={(e) => setMosaic(e.target.value)} required />
                    </li>
                    <li>
                        <label htmlFor="mixup">Mixup</label>
                        <input type="number" id="mixup" step="0.01" value={mixup} onChange={(e) => setMixup(e.target.value)} required />
                    </li>
                    <li>
                        <label htmlFor="copyPaste">Copy-Paste</label>
                        <input type="number" id="copyPaste" step="0.01" value={copyPaste} onChange={(e) => setCopyPaste(e.target.value)} required />
                    </li>
                    <li>
                        <label htmlFor="hsvH">HSV Hue</label>
                        <input type="number" id="hsvH" step="0.001" value={hsvH} onChange={(e) => setHsvH(e.target.value)} required />
                    </li>
                    <li>
                        <label htmlFor="hsvS">HSV Saturation</label>
                        <input type="number" id="hsvS" step="0.01" value={hsvS} onChange={(e) => setHsvS(e.target.value)} required />
                    </li>
                    <li>
                        <label htmlFor="hsvV">HSV Value</label>
                        <input type="number" id="hsvV" step="0.01" value={hsvV} onChange={(e) => setHsvV(e.target.value)} required />
                    </li>

                    <h3>Salida y Guardado</h3>
                    <li>
                        <label htmlFor="project">Nombre del Proyecto</label>
                        <input type="text" id="project" value={project} onChange={(e) => setProject(e.target.value)} required />
                    </li>
                    <li>
                        <label htmlFor="name">Nombre de la Ejecución</label>
                        <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                    </li>
                    <li>
                        <label htmlFor="existOk">Permitir Sobreescribir Resultados Existentes</label>
                        <input type="checkbox" id="existOk" checked={existOk} onChange={(e) => setExistOk(e.target.checked)} />
                    </li>
                    <li>
                        <label htmlFor="savePeriod">Período de Guardado (epochs)</label>
                        <input type="number" id="savePeriod" value={savePeriod} onChange={(e) => setSavePeriod(e.target.value)} required />
                    </li>
                    <li>
                        <label htmlFor="plots">Generar Gráficos</label>
                        <input type="checkbox" id="plots" checked={plots} onChange={(e) => setPlots(e.target.checked)} />
                    </li>
                    <li>
                        <label htmlFor="val">Validación</label>
                        <input type="checkbox" id="val" checked={val} onChange={(e) => setVal(e.target.checked)} />
                    </li>
                    <li>
                        <label htmlFor="verbose">Modo Verbose</label>
                        <input type="checkbox" id="verbose" checked={verbose} onChange={(e) => setVerbose(e.target.checked)} />
                    </li>

                    <h3>Configuración de MLflow</h3>
                    <li>
                        <label htmlFor="backendStoreUri">Backend Store URI</label>
                        <input type="text" id="backendStoreUri" value={backendStoreUri} onChange={(e) => setBackendStoreUri(e.target.value)} required />
                    </li>
                    <li>
                        <label htmlFor="experimentName">Nombre del Experimento</label>
                        <input type="text" id="experimentName" value={experimentName} onChange={(e) => setExperimentName(e.target.value)} required />
                    </li>
                    <li>
                        <label htmlFor="runName">Nombre de la Ejecución MLflow</label>
                        <input type="text" id="runName" value={runName} onChange={(e) => setRunName(e.target.value)} required />
                    </li>
                    <li>
                        <label htmlFor="nameRegistry">Registro de Nombre</label>
                        <input type="text" id="nameRegistry" value={nameRegistry} onChange={(e) => setNameRegistry(e.target.value)} required />
                    </li>

                    <h3>Tags de MLflow</h3>
                    <li>
                        <label htmlFor="mlflowModel">Modelo</label>
                        <input type="text" id="mlflowModel" value={mlflowModel} onChange={(e) => setMlflowModel(e.target.value)} required />
                    </li>
                    <li>
                        <label htmlFor="mlflowDataset">Dataset</label>
                        <input type="text" id="mlflowDataset" value={mlflowDataset} onChange={(e) => setMlflowDataset(e.target.value)} required />
                    </li>
                    <li>
                        <label htmlFor="mlflowFramework">Framework</label>
                        <input type="text" id="mlflowFramework" value={mlflowFramework} onChange={(e) => setMlflowFramework(e.target.value)} required />
                    </li>
                    <li>
                        <label htmlFor="mlflowAugmentation">Augmentación</label>
                        <input type="text" id="mlflowAugmentation" value={mlflowAugmentation} onChange={(e) => setMlflowAugmentation(e.target.value)} required />
                    </li>
                </ul>
                <button type="submit" className="train-config-form-button" disabled={loading}>
                    {loading ? "Guardando..." : "Guardar Configuración"}
                </button>
                <button typr="submit" className="start-train-config-form-button" disabled={loading}>
                    {loading ? "Iniciando..." : "Iniciar Entrenamiento"}
                </button>
                {message && <div className={`message ${message.startsWith("✓") ? "success" : "error"}`}>{message}</div>}
            </form>
        </div>
    );
}