import { useMemo, useState } from "react";
import { DiagramCanvas } from "./components/DiagramCanvas";
import { flows } from "./data/network";

export default function App() {
  const [activeFlowId, setActiveFlowId] = useState(flows[0].id);
  const [isAnimating, setIsAnimating] = useState(true);

  const activeFlow = useMemo(
    () => flows.find((flow) => flow.id === activeFlowId) ?? flows[0],
    [activeFlowId],
  );

  const canAnimate = activeFlow.packetLabel.length > 0 && activeFlow.path.length > 1;

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="topbar-copy">
          <p className="eyebrow">ISP Network Diagram</p>
          <h1>Topologia tecnica com fluxo operacional isolado</h1>
          <p className="hero-copy">
            O mapa preserva a leitura da rede principal e destaca apenas os participantes do fluxo ativo, com animacao
            sutil e linguagem visual de diagrama tecnico.
          </p>
        </div>

        <div className="topbar-metrics">
          <div className="metric-card">
            <span>Fluxos</span>
            <strong className="tabular-nums">{flows.length}</strong>
          </div>
          <div className="metric-card">
            <span>Estado</span>
            <strong>{canAnimate && isAnimating ? "Animado" : "Estatico"}</strong>
          </div>
        </div>
      </header>

      <section className="flow-selector-card" aria-label="Selecao de fluxos">
        <div>
          <p className="eyebrow">Fluxo</p>
          <h2>Selecione o diagrama que deseja visualizar</h2>
        </div>

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

        <div className="flow-selector-summary">
          <span className="flow-category">{activeFlow.category}</span>
          <strong>{activeFlow.name}</strong>
          <span>
            {activeFlow.source} {"->"} {activeFlow.destination}
          </span>
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
