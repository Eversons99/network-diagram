import type { Flow } from "../types";

type FlowSelectorProps = {
  flows: Flow[];
  activeFlowId: string;
  onSelect: (flowId: string) => void;
};

export function FlowSelector({ flows, activeFlowId, onSelect }: FlowSelectorProps) {
  return (
    <section className="panel selector-panel">
      <div className="panel-heading">
        <p className="eyebrow">Tipos de Comunicacao</p>
        <h2>Selecione o diagrama</h2>
      </div>

      <div className="flow-list">
        {flows.map((flow) => {
          const isActive = flow.id === activeFlowId;

          return (
            <button
              key={flow.id}
              type="button"
              className={`flow-card ${isActive ? "is-active" : ""}`}
              onClick={() => onSelect(flow.id)}
              aria-pressed={isActive}
            >
              <span className={`flow-chip tone-${flow.tone}`}>{flow.category}</span>
              <strong>{flow.name}</strong>
              <span>
                {flow.source} {"->"} {flow.destination}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
