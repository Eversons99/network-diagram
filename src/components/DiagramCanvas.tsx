import type { CSSProperties, MouseEvent as ReactMouseEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { devices, links } from "../data/network";
import type { Device, DiagramZone, Flow, Link } from "../types";
import { DeviceGlyph } from "./DeviceGlyph";

type DiagramCanvasProps = {
  flow: Flow;
  isAnimating: boolean;
};

const zoneMeta: Record<DiagramZone, { label: string; x: number; y: number; width: number; height: number }> = {
  provisionamento: { label: "Provisionamento", x: 32, y: 48, width: 280, height: 228 },
  acesso: { label: "Acesso GPON", x: 32, y: 392, width: 596, height: 468 },
  core: { label: "Transporte e Core", x: 716, y: 132, width: 932, height: 470 },
  servicos: { label: "Ambiente de Servicos", x: 1028, y: 704, width: 620, height: 196 },
};

const toneClassMap: Record<Flow["tone"], string> = {
  ixc: "tone-ixc",
  dhcp: "tone-dhcp",
  pppoe: "tone-pppoe",
  tr069: "tone-tr069",
  topologia: "tone-topologia",
};

function buildPolyline(points: Array<[number, number]>) {
  return points.map(([x, y]) => `${x},${y}`).join(" ");
}

function buildOffsetPath(points: Array<[number, number]>) {
  return `path('M ${points.map(([x, y], index) => `${index === 0 ? "" : "L "}${x} ${y}`).join(" ")}')`;
}

function packetStyle(path: Array<[number, number]>, isAnimating: boolean): CSSProperties {
  return {
    offsetPath: buildOffsetPath(path),
    offsetRotate: "0deg",
    animationPlayState: isAnimating ? "running" : "paused",
  };
}

function DeviceNode({ device }: { device: Device }) {
  const labelX = device.x + device.width / 2;
  const labelY = device.y + device.height + 24;

  return (
    <g className="device-node is-active">
      <rect className="device-frame" x={device.x} y={device.y} width={device.width} height={device.height} rx={20} />
      <DeviceGlyph type={device.type} x={device.x} y={device.y} width={device.width} height={device.height} />
      <text className="device-title" x={labelX} y={labelY}>
        {device.name}
      </text>
      <text className="device-subtitle" x={labelX} y={labelY + 18}>
        {device.role}
      </text>
    </g>
  );
}

function LinkShape({ link, toneClass }: { link: Link; toneClass: string }) {
  const points = buildPolyline(link.points);
  const fallbackPoint = link.points[Math.max(0, Math.floor(link.points.length / 2) - 1)];
  const labelX = link.labelX ?? fallbackPoint[0];
  const labelY = link.labelY ?? fallbackPoint[1] - 14;
  const anchor = link.labelAnchor ?? "middle";

  return (
    <g className="link-group is-active">
      <polyline className="link-base" points={points} />
      <polyline className={`link-highlight ${toneClass}`} points={points} />
      {link.label ? (
        <text className="link-label" x={labelX} y={labelY} textAnchor={anchor}>
          {link.label}
        </text>
      ) : null}
    </g>
  );
}

export function DiagramCanvas({ flow, isAnimating }: DiagramCanvasProps) {
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const panStateRef = useRef({ active: false, startX: 0, startY: 0, scrollLeft: 0, scrollTop: 0 });

  const activeDeviceIds = useMemo(() => new Set(flow.activeDevices), [flow.activeDevices]);
  const activeLinkIds = useMemo(() => new Set(flow.activeLinks), [flow.activeLinks]);
  const visibleDevices = useMemo(() => devices.filter((device) => activeDeviceIds.has(device.id)), [activeDeviceIds]);
  const visibleLinks = useMemo(() => links.filter((link) => activeLinkIds.has(link.id)), [activeLinkIds]);
  const visibleZones = useMemo(() => {
    const zoneIds = new Set(visibleDevices.map((device) => device.zone));
    return Object.entries(zoneMeta).filter(([zoneId]) => zoneIds.has(zoneId as DiagramZone));
  }, [visibleDevices]);
  const toneClass = toneClassMap[flow.tone];

  useEffect(() => {
    function handleMove(event: MouseEvent) {
      const frame = frameRef.current;
      const state = panStateRef.current;
      if (!frame || !state.active) {
        return;
      }

      frame.scrollLeft = state.scrollLeft - (event.clientX - state.startX);
      frame.scrollTop = state.scrollTop - (event.clientY - state.startY);
    }

    function handleUp() {
      if (!panStateRef.current.active) {
        return;
      }

      panStateRef.current = { active: false, startX: 0, startY: 0, scrollLeft: 0, scrollTop: 0 };
      setIsPanning(false);
    }

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, []);

  function handleMouseDown(event: ReactMouseEvent<HTMLDivElement>) {
    if (event.button !== 0 || !frameRef.current) {
      return;
    }

    const frame = frameRef.current;
    panStateRef.current = {
      active: true,
      startX: event.clientX,
      startY: event.clientY,
      scrollLeft: frame.scrollLeft,
      scrollTop: frame.scrollTop,
    };
    setIsPanning(true);
    event.preventDefault();
  }

  return (
    <section className="diagram-panel">
      <div className="diagram-toolbar">
        <div>
          <p className="eyebrow">Mapa Operacional</p>
          <h2>Fluxo selecionado</h2>
        </div>

        <div className="diagram-toolbar-actions">
          <div className="zoom-group" role="group" aria-label="Controles de zoom">
            <button type="button" className="toolbar-button" onClick={() => setZoom((value) => Math.max(0.7, Number((value - 0.1).toFixed(2))))}>
              -
            </button>
            <button type="button" className="toolbar-button toolbar-button-wide" onClick={() => setZoom(1)}>
              Reset
            </button>
            <button type="button" className="toolbar-button" onClick={() => setZoom((value) => Math.min(1.6, Number((value + 0.1).toFixed(2))))}>
              +
            </button>
          </div>

          <span className="toolbar-pill tabular-nums">Zoom {Math.round(zoom * 100)}%</span>
          <span className={`toolbar-pill ${toneClass}`}>{flow.category}</span>
        </div>
      </div>

      <div
        ref={frameRef}
        className={`diagram-frame ${isPanning ? "is-panning" : ""}`}
        onMouseDown={handleMouseDown}
        onContextMenu={(event) => event.preventDefault()}
      >
        <div className="diagram-surface" style={{ transform: `scale(${zoom})` }}>
          <svg viewBox="0 0 1680 940" role="img" aria-label={flow.name}>
            {visibleZones.map(([, zone]) => (
              <g key={zone.label}>
                <rect className="zone-box" x={zone.x} y={zone.y} width={zone.width} height={zone.height} rx="26" />
                <text className="zone-label" x={zone.x + 24} y={zone.y + 32}>
                  {zone.label}
                </text>
              </g>
            ))}

            {visibleLinks.map((link) => (
              <LinkShape key={link.id} link={link} toneClass={toneClass} />
            ))}

            {visibleDevices.map((device) => (
              <DeviceNode key={device.id} device={device} />
            ))}
          </svg>

          {flow.packetLabel && flow.path.length > 1 ? (
            <div className={`packet-overlay ${isAnimating ? "is-animating" : ""}`} style={packetStyle(flow.path, isAnimating)}>
              <span className={`packet ${toneClass}`}>{flow.packetLabel}</span>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
