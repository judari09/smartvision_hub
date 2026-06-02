import { useState } from 'react';
import heroImage from "./assets/hero.png";
import ImageWidget from "./components/imagewidget.jsx";
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
      </main>
    </div>
  );
}

export default App
