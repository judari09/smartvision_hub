import "./inferencepage.css";

import ImageWidget from "./imagewidget.jsx";
import InferenceConfigWidget from "./inferenceconfigwidget.jsx";

export default function InferencePage({ imageSrc = "", points = [{ x: 0.25, y: 0.3 }, { x: 0.75, y: 0.55 }] }) {
    return (
        <div className="inference-page-container">
            <ImageWidget
                imageSrc={imageSrc}
                points={points}
            />
            <InferenceConfigWidget />
            <button className="inference-button">Iniciar Inferencia</button>
            
        </div>

    );
}

