import { Pause, Play } from "lucide-react";
import type { Flow } from "../types";

type FlowDetailsProps = {
  flow: Flow;
  isAnimating: boolean;
  showAnimationControl: boolean;
  onToggleAnimation: () => void;
};

export function FlowDetails({ flow, isAnimating, showAnimationControl, onToggleAnimation }: FlowDetailsProps) {
  return (
    <aside className="panel details-panel">
      <div className="panel-heading">
        <p className="eyebrow">Detalhes Tecnicos</p>
        <h2>Dados do diagrama</h2>
      </div>

      <p className="detail-title">{flow.name}</p>

      <p className="summary">{flow.summary}</p>

      <dl className="meta-grid">
        <div>
          <dt>Origem</dt>
          <dd>{flow.source}</dd>
        </div>
        <div>
          <dt>Destino</dt>
          <dd>{flow.destination}</dd>
        </div>
        <div>
          <dt>Camada destacada</dt>
          <dd>{flow.layer}</dd>
        </div>
        <div>
          <dt>Dispositivos ativos</dt>
          <dd className="tabular-nums value-emphasis">{flow.activeDevices.length}</dd>
        </div>
        <div>
          <dt>Enlaces ativos</dt>
          <dd className="tabular-nums value-emphasis">{flow.activeLinks.length}</dd>
        </div>
        {showAnimationControl ? (
          <div>
            <dt>Animacao</dt>
            <dd>
              <button
                type="button"
                className={`inline-button ${isAnimating ? "is-active" : ""}`}
                onClick={onToggleAnimation}
                aria-pressed={isAnimating}
              >
                <span className="button-icon-stack" aria-hidden="true">
                  <Pause className="button-icon button-icon-pause" size={16} strokeWidth={2.2} />
                  <Play className="button-icon button-icon-play" size={16} strokeWidth={2.2} />
                </span>
                <span className="inline-button-label">
                  {isAnimating ? "Pausar fluxo" : "Animar fluxo"}
                </span>
              </button>
            </dd>
          </div>
        ) : null}
      </dl>

      <div className="detail-block">
        <h3>Observacoes</h3>
        <ul>
          {flow.details.map((detail) => (
            <li key={detail}>{detail}</li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
