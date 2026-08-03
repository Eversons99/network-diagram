import { useEffect, useMemo, useState } from "react";
import { DiagramCanvas } from "./components/DiagramCanvas";
import { devices, flows } from "./data/network";

type ThemeMode = "light" | "dark";

const zoneLabelMap = {
  transit: "Transit",
  servicos: "Servicos",
  core: "Core",
  distribuicao: "Distribuicao",
  acesso: "Acesso",
  clientes: "Clientes",
} as const;

export default function App() {
  const [activeFlowId, setActiveFlowId] = useState(flows[0].id);
  const [isAnimating, setIsAnimating] = useState(true);
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") {
      return "dark";
    }

    const storedTheme = window.localStorage.getItem("network-diagram-theme");
    return storedTheme === "light" ? "light" : "dark";
  });

  const activeFlow = useMemo(
    () => flows.find((flow) => flow.id === activeFlowId) ?? flows[0],
    [activeFlowId],
  );
  const activeZones = useMemo(() => {
    const zones = new Set(
      devices
        .filter((device) => activeFlow.activeDevices.includes(device.id))
        .map((device) => zoneLabelMap[device.zone]),
    );

    return Array.from(zones);
  }, [activeFlow.activeDevices]);

  const flowGroups = useMemo(() => {
    const groups: Array<{ category: string; flows: typeof flows }> = [];

    flows.forEach((flow) => {
      const group = groups.find((entry) => entry.category === flow.category);
      if (group) {
        group.flows.push(flow);
      } else {
        groups.push({ category: flow.category, flows: [flow] });
      }
    });

    return groups;
  }, []);

  const canAnimate = activeFlow.packetLabel.length > 0 && activeFlow.path.length > 1;

  useEffect(() => {
    window.localStorage.setItem("network-diagram-theme", theme);
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return (
    <main className="app-shell" data-theme={theme}>
      <header className="top-bar">
        <div className="brand">
          <strong>Intranet GPON</strong>
          <span>Explained</span>
        </div>

        <button
          type="button"
          role="switch"
          className={`theme-toggle ${theme === "dark" ? "is-dark" : "is-light"}`}
          onClick={() => setTheme((current) => (current === "light" ? "dark" : "light"))}
          aria-checked={theme === "dark"}
          aria-label={theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}
        >
          <span className="theme-toggle-knob">
            {theme === "dark" ? (
              <svg className="theme-toggle-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M12 3a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0V4a1 1 0 0 1 1-1Zm0 15a5 5 0 1 1 0-10 5 5 0 0 1 0 10Zm9-6a1 1 0 0 1-1 1h-1a1 1 0 1 1 0-2h1a1 1 0 0 1 1 1ZM4 13a1 1 0 0 1 0-2h1a1 1 0 0 1 0 2H4Zm14.36-6.36a1 1 0 0 1 0-1.41l.71-.71a1 1 0 1 1 1.41 1.41l-.71.71a1 1 0 0 1-1.41 0Zm-11.31 11.31a1 1 0 0 1 0-1.41l.71-.7a1 1 0 0 1 1.41 1.41l-.71.71a1 1 0 0 1-1.41 0Zm11.31 0a1 1 0 0 1-1.41 0l-.71-.71a1 1 0 1 1 1.41-1.41l.71.7a1 1 0 0 1 0 1.42ZM6.34 6.34a1 1 0 0 1-1.41 0l-.71-.71A1 1 0 1 1 5.63 4.2l.71.71a1 1 0 0 1 0 1.43ZM12 21a1 1 0 0 1-1-1v-1a1 1 0 1 1 2 0v1a1 1 0 0 1-1 1Z"
                />
              </svg>
            ) : (
              <svg className="theme-toggle-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M20.742 13.045a8.088 8.088 0 0 1-2.077.273c-4.492 0-8.13-3.638-8.13-8.13 0-1.401.36-2.72 1.007-3.868a.75.75 0 0 0-.826-1.108A10.086 10.086 0 0 0 3 10.088C3 15.55 7.45 20 12.912 20a10.086 10.086 0 0 0 9.876-7.876.75.75 0 0 0-1.107-.826 8.088 8.088 0 0 1-.939.747Z"
                />
              </svg>
            )}
          </span>
        </button>
      </header>

      <section className="workspace-grid">
        <nav className="flow-nav" aria-label="Fluxos disponiveis">
          {flowGroups.map((group) => (
            <div key={group.category} className="flow-nav-group">
              <p className="flow-nav-category">{group.category}</p>
              {group.flows.map((flow) => (
                <button
                  key={flow.id}
                  type="button"
                  className={`flow-nav-item tone-${flow.tone} ${flow.id === activeFlow.id ? "is-active" : ""}`}
                  onClick={() => setActiveFlowId(flow.id)}
                  aria-current={flow.id === activeFlow.id}
                >
                  <span className="flow-nav-dot" aria-hidden="true" />
                  {flow.name}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <DiagramCanvas flow={activeFlow} isAnimating={canAnimate && isAnimating} />

        <aside className="details-panel">
          <div className="details-card">
            <p className="eyebrow">Resumo</p>
            <h2>{activeFlow.name}</h2>
            <p className="summary">{activeFlow.summary}</p>
          </div>

          <div className="details-card details-grid">
            <div>
              <span className="meta-label">Origem</span>
              <strong>{activeFlow.source}</strong>
            </div>
            <div>
              <span className="meta-label">Destino</span>
              <strong>{activeFlow.destination}</strong>
            </div>
            <div>
              <span className="meta-label">Camadas</span>
              <strong className="tabular-nums">{activeZones.length}</strong>
            </div>
            <div>
              <span className="meta-label">Dispositivos</span>
              <strong className="tabular-nums">{activeFlow.activeDevices.length}</strong>
            </div>
            <div>
              <span className="meta-label">Enlaces</span>
              <strong className="tabular-nums">{activeFlow.activeLinks.length}</strong>
            </div>
          </div>

          <div className="details-card">
            <div className="details-heading">
              <p className="eyebrow">Animacao</p>
              <button
                type="button"
                className="inline-toggle"
                onClick={() => setIsAnimating((value) => !value)}
                aria-pressed={isAnimating}
                disabled={!canAnimate}
              >
                {canAnimate ? (isAnimating ? "Pausar fluxo" : "Animar fluxo") : "Sem animacao"}
              </button>
            </div>

            <ul className="details-list">
              {activeFlow.details.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
          </div>
        </aside>
      </section>
    </main>
  );
}
