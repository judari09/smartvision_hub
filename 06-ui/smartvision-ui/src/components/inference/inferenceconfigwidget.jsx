import { ChevronDown } from "lucide-react";
import { useState } from "react";
import "./inferenceconfigwidget.css";
export default function InferenceConfigWidget() {
    const [expanded, setExpanded] = useState(false);
    const [confValue, setConfValue] = useState(50);
    const [iouValue, setIouValue] = useState(50);
    const [ttaenabled, setTtaEnabled] = useState(false);
    return (
        <div className="inference-config-widget-container">
            <div className="inference-config-widget-header">
                <p>Inference Config</p>
                <a
                    href="#"
                    onClick={(e) => {
                        e.preventDefault();
                        setExpanded(!expanded);
                    }}
                    >
                    <ChevronDown
                        size={16}
                        className={expanded ? "submenu-toggle rotated" : "submenu-toggle"}
                    />
                </a>
            </div>
            <div className={`inference-config-widget-content ${expanded ? "expanded" : ""}`}>
                <div className="inference-confidence-slider">
                    <div className="slider-label-row">
                        <span>Confianza</span>
                        <span>{confValue}</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={confValue}
                        onChange={(e) => setConfValue(Number(e.target.value))}
                    />
                </div>
                <div className="inference-iou-slider">
                    <div className="slider-iou-row">
                        <span>IOU</span>
                        <span>{iouValue}</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={iouValue}
                        onChange={(e) => setIouValue(Number(e.target.value))}
                    />
                </div>
                <div className="inference-tta-toggle">
                    <button
                        className={`switch ${ttaenabled ? "active" : ""}`}
                        onClick={() => setTtaEnabled((prev) => !prev)}>
                        <span className="thumb"></span>
                    </button>
                    <p>Habilitar Test Time Augmentation</p>
                </div>
            </div>
        </div>
    );
}