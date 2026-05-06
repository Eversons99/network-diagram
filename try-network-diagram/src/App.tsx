import { useState } from "react";
import { FlowDetails } from "./components/FlowDetails";
import { FlowSelector } from "./components/FlowSelector";
import { Legend } from "./components/Legend";
import { NetworkDiagram } from "./components/NetworkDiagram";
import { flows } from "./data/network";

export default function App() {
  const [activeFlowId, setActiveFlowId] = useState(flows[0].id);
  const [isAnimating, setIsAnimating] = useState(true);

  const activeFlow = flows.find((flow) => flow.id === activeFlowId) ?? flows[0];
  const canAnimate = activeFlow.packetLabel.length > 0;

  return (
    <main className="app-shell">
      <header className="hero hero-panel panel">
        <div>
          <p className="eyebrow">ISP Network Diagram</p>
          <h1>Diagramas de redes para provisionamento e comunicacao</h1>
          <p className="hero-copy">
            Visualizacao operacional inspirada em diagramas de redes, com selecao direta do tipo de comunicacao e
            destaque do caminho entre acesso GPON, switching, BRAS e servidores da infraestrutura.
          </p>
        </div>
        <Legend />
      </header>

      <section className="app-grid">
        <FlowSelector flows={flows} activeFlowId={activeFlow.id} onSelect={setActiveFlowId} />
        <NetworkDiagram flow={activeFlow} isAnimating={canAnimate && isAnimating} />
        <FlowDetails
          flow={activeFlow}
          isAnimating={canAnimate && isAnimating}
          showAnimationControl={canAnimate}
          onToggleAnimation={() => setIsAnimating((current) => !current)}
        />
      </section>
    </main>
  );
}
