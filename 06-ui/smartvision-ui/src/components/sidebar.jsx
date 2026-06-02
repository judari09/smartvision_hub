import { useState } from "react";
import "./sidebar.css";

import {
  ChevronDown,
  Home,
  LogOut,
  Menu,
  Settings,
  Users,
  BrainCircuit,
  SportShoe,
  Database,
  Wind
} from "lucide-react";

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

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
            <a href="#">
              <Home size={20} />
              {!collapsed && <span>Inicio</span>}
            </a>
          </li>

          <li>
            <a href="#">
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
              {!collapsed && <span>Configuracion</span>}
              {!collapsed && (
                <ChevronDown
                  size={16}
                  className={settingsOpen ? "submenu-toggle rotated" : "submenu-toggle"}
                />
              )}
            </a>

            <ul className={settingsOpen ? "submenu open" : "submenu"}>
              <li>
                <a href="#">
                  <Database size={18} />
                  {!collapsed && <span>Dataset</span>}
                </a>
              </li>
              <li>
                <a href="#">
                  <Wind size={18} />
                  {!collapsed && <span>Flow</span>}
                </a>
              </li>
              <li>
                <a href="#">
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