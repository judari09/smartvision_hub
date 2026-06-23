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
  const [selectedPage, setSelectedPage] = useState("inicio");

  const renderPage = () => {
    switch (selectedPage) {
      case "inferencia":
        return (
          <InferencePage 
            imageSrc={heroImage}
            points={[{ x: 0.25, y: 0.3 }, { x: 0.75, y: 0.55 }]}
          />
        );
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
        {renderPage()}
      </main>
    </div>
  );
}

export default App
