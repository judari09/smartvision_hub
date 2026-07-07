import { ZoomIn, ZoomOut } from 'lucide-react';
import { useRef, useState } from "react";
import "./imagewidget.css";

export default function ImageWidget({ imageSrc, processedSrc = imageSrc, boxes = [], points = [] }) {
    const [expanded, setExpanded] = useState(false);
    const imageRef = useRef(null);

    const getBoxStyle = (box) => {
        const bbox = Array.isArray(box?.bbox) ? box.bbox : null;
        const imageElement = imageRef.current;
        if (!bbox || bbox.length < 4 || !imageElement) {
            return {};
        }

        const rect = imageElement.getBoundingClientRect();
        const width = rect.width || imageElement.clientWidth || imageElement.naturalWidth || 1;
        const height = rect.height || imageElement.clientHeight || imageElement.naturalHeight || 1;

        const [x1, y1, x2, y2] = bbox;
        const left = (Math.min(x1, x2) / width) * 100;
        const top = (Math.min(y1, y2) / height) * 100;
        const boxWidth = (Math.abs(x2 - x1) / width) * 100;
        const boxHeight = (Math.abs(y2 - y1) / height) * 100;

        return {
            left: `${left}%`,
            top: `${top}%`,
            width: `${boxWidth}%`,
            height: `${boxHeight}%`,
        };
    };

    return (
        <div className="imagewidget-container">
            <div className="imagewidget-header">
                <p>Imagewidget</p>
                <button
                type="button"
                className="imagewidget-toggle"
                onClick={() => setExpanded((prev) => !prev)}
                >
                {expanded ? <ZoomOut size={18} /> : <ZoomIn size={18} />}
                </button>
            </div>

            <div className={`image-widget ${expanded ? "expanded" : ""}`}>
                <div className="image-card">
                    <div className="image-card-label">raw</div>
                    <img src={imageSrc} alt="raw" />
                </div>

                <div className="image-card">
                        <div className="image-card-label">processed</div>
                        <div className="processed-overlay-wrapper">
                            <img ref={imageRef} src={processedSrc} alt="processed" />
                            {(boxes.length > 0 || points.length > 0) && (
                                <div className="image-overlay">
                                    {boxes.map((box, index) => (
                                        <div key={box.key ?? `${index}`} className="image-box" style={getBoxStyle(box)}>
                                            <span className="image-box-label">
                                                {box.label ?? `det ${index + 1}`}
                                                {typeof box.confidence === "number" ? ` · ${(box.confidence * 100).toFixed(0)}%` : ""}
                                            </span>
                                        </div>
                                    ))}
                                    {boxes.length === 0 && points.length > 0 && (
                                        <div className="image-box" style={getBoxStyle(points)} />
                                    )}
                                </div>
                            )}
                        </div>
                </div>
            </div>
        </div>
    );
}