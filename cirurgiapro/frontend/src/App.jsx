import { useState, useRef, useEffect } from 'react';
import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard.jsx';
import Procedimentos from './pages/Procedimentos.jsx';
import Calculo from './pages/Calculo.jsx';
import Historico from './pages/Historico.jsx';

const navItems = [
  { to: '/', label: 'Dashboard', icon: '▦', exact: true },
  { to: '/procedimentos', label: 'Procedimentos', icon: '◉' },
  { to: '/calculo', label: 'Novo Cálculo', icon: '⊕' },
  { to: '/historico', label: 'Histórico', icon: '◷' },
];

const pageTitles = {
  '/': 'Dashboard',
  '/procedimentos': 'Procedimentos',
  '/calculo': 'Novo Cálculo',
  '/historico': 'Histórico de Cálculos',
};

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const overlayRef = useRef();

  const pageTitle = pageTitles[location.pathname] || 'CirurgiaPro';

  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  return (
    <div className="app-layout">
      {/* Sidebar overlay */}
      <div
        ref={overlayRef}
        className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <h1>
            <span className="sidebar-cross">✚</span>
            CirurgiaPro
          </h1>
          <span>Gestão Cirúrgica</span>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">Menu</div>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span style={{ fontSize: '1.1rem', width: 18, textAlign: 'center' }}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          v1.0.0 · CirurgiaPro
        </div>
      </aside>

      {/* Main */}
      <div className="main-content">
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="hamburger" onClick={() => setSidebarOpen((v) => !v)} aria-label="Menu">
              <span /><span /><span />
            </button>
            <span className="topbar-title">{pageTitle}</span>
          </div>
          <span className="topbar-badge">🏥 Sistema Hospitalar</span>
        </header>

        <main className="page-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/procedimentos" element={<Procedimentos />} />
            <Route path="/calculo" element={<Calculo />} />
            <Route path="/historico" element={<Historico />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
