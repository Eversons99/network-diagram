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

  const canAnimate = activeFlow.packetLabel.length > 0 && activeFlow.path.length > 1;

  useEffect(() => {
    window.localStorage.setItem("network-diagram-theme", theme);
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return (
    <main className="app-shell" data-theme={theme}>
      <section className="masthead">
        <div className="hero-card">
          <div className="hero-kicker-row">
            <p className="eyebrow">Intranet GPON Explained</p>
            <span className="hero-badge">Top-down view</span>
          </div>

          <h1>Topologia GPON com leitura vertical, camadas fixas e fluxos operacionais isolados</h1>
          <p className="hero-copy">
            A interface foi reorganizada para parecer um portal tecnico: camadas sempre estaveis, painel de contexto
            claro e um canvas que privilegia a leitura de cima para baixo.
          </p>

          <div className="hero-tags" aria-label="Principios do diagrama">
            <span className="hero-tag">Transit at top</span>
            <span className="hero-tag">Core centralizado</span>
            <span className="hero-tag">Servico lateral</span>
            <span className="hero-tag">Fluxos isolados</span>
          </div>
        </div>

        <div className="masthead-side">
          <div className="metric-card">
            <span>Fluxos</span>
            <strong className="tabular-nums">{flows.length}</strong>
            <small>Topologia e operacao</small>
          </div>

          <div className="metric-card">
            <span>Estado</span>
            <strong>{canAnimate && isAnimating ? "Animado" : "Estatico"}</strong>
            <small>{canAnimate ? "Pacote ativo no fluxo" : "Vista estrutural"}</small>
          </div>

          <div className="metric-card theme-card">
            <span>Tema</span>
            <button
              type="button"
              className="theme-toggle"
              onClick={() => setTheme((current) => (current === "light" ? "dark" : "light"))}
              aria-pressed={theme === "dark"}
            >
              {theme === "dark" ? "Modo escuro" : "Modo claro"}
            </button>
            <small>Contraste do portal e do canvas</small>
          </div>
        </div>
      </section>

      <section className="control-deck" aria-label="Selecao de fluxos">
        <div className="control-copy">
          <p className="eyebrow">Fluxo</p>
          <h2>Navegue pela topologia e depois entre no caminho operacional</h2>
          <p className="command-copy">
            A vista geral mantem a rede inteira organizada por camadas. Os fluxos isolados mostram apenas os
            participantes necessarios para cada operacao.
          </p>
        </div>

        <div className="control-actions">
          <div className="flow-selector-controls">
            <label className="flow-selector-label" htmlFor="flow-select">
              Fluxo disponivel
            </label>
            <select
              id="flow-select"
              className="flow-select"
              value={activeFlow.id}
              onChange={(event) => setActiveFlowId(event.target.value)}
            >
              {flows.map((flow) => (
                <option key={flow.id} value={flow.id}>
                  {flow.category} - {flow.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flow-selector-summary summary-card">
            <span className="flow-category">{activeFlow.category}</span>
            <strong>{activeFlow.name}</strong>
            <span>
              {activeFlow.source} {"->"} {activeFlow.destination}
            </span>
            <div className="flow-zone-list" aria-label="Camadas visiveis">
              {activeZones.map((zone) => (
                <span key={zone} className="flow-zone-chip">
                  {zone}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="workspace-grid">
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
            <p className="eyebrow">Escopo visivel</p>
            <div className="flow-zone-list">
              {activeZones.map((zone) => (
                <span key={zone} className="flow-zone-chip">
                  {zone}
                </span>
              ))}
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
