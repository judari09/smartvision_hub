import { ZoomIn, ZoomOut } from 'lucide-react';
import { useState } from "react";
import "./imagewidget.css";

export default function ImageWidget({ imageSrc, processedSrc = imageSrc, points = [] }) {
    const [expanded, setExpanded] = useState(false);

    const getPointStyle = (point) => {
        const left = typeof point.x === 'number'
          ? (point.x <= 1 ? point.x * 100 : point.x)
          : 0;
        const top = typeof point.y === 'number'
          ? (point.y <= 1 ? point.y * 100 : point.y)
          : 0;

        return {
            left: `${left}%`,
            top: `${top}%`,
        };
    };

    const getBoxStyle = (points) => {
        const xs = points.map((point) => (typeof point.x === 'number' ? (point.x <= 1 ? point.x * 100 : point.x) : 0));
        const ys = points.map((point) => (typeof point.y === 'number' ? (point.y <= 1 ? point.y * 100 : point.y) : 0));
        const left = Math.min(...xs);
        const top = Math.min(...ys);
        const width = Math.max(...xs) - left;
        const height = Math.max(...ys) - top;

        return {
            left: `${left}%`,
            top: `${top}%`,
            width: `${width}%`,
            height: `${height}%`,
        };
    };

    const drawBox = points.length === 4;

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
                            <img src={processedSrc} alt="processed" />
                            {points.length > 0 && (
                                <div className="image-overlay">
                                    <div className="image-box" style={getBoxStyle(points)} />
                                    }
                                </div>
                            )}
                        </div>
                </div>
            </div>
        </div>
  );
}