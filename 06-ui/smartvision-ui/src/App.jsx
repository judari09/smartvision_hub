import { useState } from 'react';
import heroImage from "./assets/hero.png";
import DatasetConfigForm from "./components/config/datasetconfigform.jsx";
import FlowConfigForm from "./components/config/flowconfigform.jsx";
import TrainConfigForm from "./components/config/trainconfigform.jsx";
import InferencePage from "./components/inference/inferencepage.jsx";
import Sidebar from "./components/sidebar.jsx";
import Welcome from "./components/welcome.jsx";
import './index.css';

function App() {
  // Current view selected in the main shell.
  const [selectedPage, setSelectedPage] = useState("inicio");
  // Image currently used by the inference workflow.
  const [inferenceImage, setInferenceImage] = useState(heroImage);

  // Store a selected local image and expose it to the inference page.
  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const imageUrl = URL.createObjectURL(file);
    setInferenceImage(imageUrl);
  };

  const renderPage = () => {
    switch (selectedPage) {
      case "inferencia":
        return <InferencePage imageSrc={inferenceImage} />;
      case "dataset":
        return <DatasetConfigForm />;
      case "flow":
        return <FlowConfigForm />;
      case "train":
        return <TrainConfigForm />;
      default:
        return <Welcome />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar selectedPage={selectedPage} onNavigate={setSelectedPage} />
      <main className="main-content">
        {selectedPage === "inferencia" && (
          <div className="inference-image-upload-row">
            <label htmlFor="inference-image-input">Cambiar imagen:</label>
            <label htmlFor="inference-image-input" className="button secondary-button">
              Seleccionar imagen
            </label>
            <input
              id="inference-image-input"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: "none" }}
            />
          </div>
        )}
        {renderPage()}
      </main>
    </div>
  );
}

export default App
