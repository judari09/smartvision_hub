import { useState } from 'react';
import heroImage from "./assets/hero.png";
import ImageWidget from "./components/inference/imagewidget.jsx";
import InferenceConfigWidget from "./components/inference/inferenceconfigwidget.jsx";
import DatasetConfigForm from "./components/config/datasetconfigform.jsx";
import Sidebar from "./components/sidebar.jsx";
import './index.css';

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <ImageWidget
          imageSrc={heroImage}
          points={[{ x: 0.25, y: 0.3 }, { x: 0.75, y: 0.55 }]}
        />
        <InferenceConfigWidget />
        <DatasetConfigForm />
      </main>
    </div>
  );
}

export default App
