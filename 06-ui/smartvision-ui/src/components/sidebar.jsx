import { useState } from "react";
import "./sidebar.css";

import {
    BrainCircuit,
    ChevronDown,
    Database,
    Home,
    Menu,
    Settings,
    SportShoe,
    Wind
} from "lucide-react";

export default function Sidebar({ selectedPage, onNavigate }) {
  // Toggle the collapsed state of the navigation rail.
  const [collapsed, setCollapsed] = useState(false);
  // Controls whether the configuration submenu is expanded.
  const [settingsOpen, setSettingsOpen] = useState(false);

  const navigate = (page) => {
    setSettingsOpen(page === "settings" ? !settingsOpen : settingsOpen);
    onNavigate(page);
  };

  return (
    <aside className={collapsed ? "sidebar collapsed" : "sidebar"}>
      
      {/* BOTÓN */}
      <div className="sidebar-header">
        <button
          className="toggle-btn"
          onClick={() => setCollapsed(!collapsed)}
        >
          <Menu size={22} />
        </button>

        <h2 className="logo">
          {collapsed ? "SVH" : "SmartVisionHub"}
        </h2>
      </div>
      

      {/* MENÚ */}
      <nav>
        <ul>
          <li>
            <a
              href="#"
              className={selectedPage === "inicio" ? "active" : ""}
              onClick={(e) => {
                e.preventDefault();
                navigate("inicio");
              }}
            >
              <Home size={20} />
              {!collapsed && <span>Inicio</span>}
            </a>
          </li>

          <li>
            <a
              href="#"
              className={selectedPage === "inferencia" ? "active" : ""}
              onClick={(e) => {
                e.preventDefault();
                navigate("inferencia");
              }}
            >
              <BrainCircuit size={20} />
              {!collapsed && <span>Inferencia</span>}
            </a>
          </li>

          <li>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setSettingsOpen(!settingsOpen);
              }}
            >
              <Settings size={20} />
              {!collapsed && <span>Configuración</span>}
              {!collapsed && (
                <ChevronDown
                  size={16}
                  className={settingsOpen ? "submenu-toggle rotated" : "submenu-toggle"}
                />
              )}
            </a>

            <ul className={settingsOpen ? "submenu open" : "submenu"}>
              <li>
                <a
                  href="#"
                  className={selectedPage === "dataset" ? "active" : ""}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate("dataset");
                  }}
                >
                  <Database size={18} />
                  {!collapsed && <span>Dataset</span>}
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className={selectedPage === "flow" ? "active" : ""}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate("flow");
                  }}
                >
                  <Wind size={18} />
                  {!collapsed && <span>Flow</span>}
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className={selectedPage === "train" ? "active" : ""}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate("train");
                  }}
                >
                  <SportShoe size={18} />
                  {!collapsed && <span>Train</span>}
                </a>
              </li>
            </ul>
          </li>

        </ul>
      </nav>
    </aside>
  );
}