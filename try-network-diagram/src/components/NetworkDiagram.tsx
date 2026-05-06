import type { CSSProperties, MouseEvent as ReactMouseEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { DeviceIcon } from "./DeviceIcon";
import { devices, links } from "../data/network";
import type { Device, DiagramZone, Flow, Link } from "../types";

type NetworkDiagramProps = {
  flow: Flow;
  isAnimating: boolean;
};

const toneColors = {
  ixc: "#f97316",
  dhcp: "#facc15",
  tr069: "#22c55e",
  base: "#60a5fa",
};

function buildPolyline(points: Array<[number, number]>) {
  return points.map(([x, y]) => `${x},${y}`).join(" ");
}

function packetStyle(flow: Flow, isAnimating: boolean): CSSProperties {
  const activePath = flow.path;
  const path = activePath.map(([x, y]) => `${x}px ${y}px`).join(", ");

  return {
    offsetPath: `path('M ${activePath.map(([x, y], index) => `${index === 0 ? "" : "L "}${x} ${y}`).join(" ")}')`,
    offsetRotate: "0deg",
    animationPlayState: isAnimating ? "running" : "paused",
    color: toneColors[flow.tone],
    ...(path ? {} : {}),
  };
}

function DeviceShape({ device, active }: { device: Device; active: boolean }) {
  const commonClass = `device ${device.type} ${active ? "active" : "inactive"}`;
  const labelX = device.x + device.width / 2 + (device.labelOffsetX ?? 0);
  const labelY = device.y + device.height + (device.labelOffsetY ?? 22);
  const roleOffsetY = device.roleOffsetY ?? 18;

  return (
    <g className={commonClass}>
      <rect className="device-frame" x={device.x} y={device.y} width={device.width} height={device.height} rx={18} />
      <DeviceIcon type={device.type} active={active} x={device.x} y={device.y} width={device.width} height={device.height} />
      <text className="label-title" x={labelX} y={labelY}>{device.name}</text>
      <text className="label-subtitle" x={labelX} y={labelY + roleOffsetY}>{device.role}</text>
    </g>
  );
}

function LinkLayer({ link, active, tone }: { link: Link; active: boolean; tone: Flow["tone"] }) {
  const activePoints = link.points;
  const polyline = buildPolyline(activePoints);
  const fallbackPoint = activePoints[Math.max(0, Math.floor(activePoints.length / 2) - 1)];
  const labelX = link.labelX ?? fallbackPoint[0] + 8;
  const labelY = link.labelY ?? fallbackPoint[1] - 12;
  const labelAnchor = link.labelAnchor ?? "start";
  const label = link.label;

  return (
    <g>
      <polyline className={`link-base ${active ? "is-active-context" : "is-inactive-context"}`} points={polyline} />
      {active ? <polyline className={`link-active tone-${tone} is-l2`} points={polyline} /> : null}
      {label && active ? (
        <text className="link-label" x={labelX} y={labelY} textAnchor={labelAnchor}>
          {label}
        </text>
      ) : null}
    </g>
  );
}

const zoneConfig: Record<DiagramZone, { title: string; minWidth: number; minHeight: number; paddingX: number; paddingY: number }> = {
  provisionamento: { title: "Provisionamento", minWidth: 340, minHeight: 170, paddingX: 48, paddingY: 40 },
  transporte: { title: "Transporte / Core", minWidth: 980, minHeight: 210, paddingX: 64, paddingY: 48 },
  servidores: { title: "Ambiente de Servidores", minWidth: 460, minHeight: 180, paddingX: 52, paddingY: 42 },
};

const zoneOrder: DiagramZone[] = ["provisionamento", "transporte", "servidores"];
const verticalZoneGap = 64;
const horizontalServerGap = 72;

function getZoneBounds(zone: DiagramZone, zoneDevices: Device[]) {
  const config = zoneConfig[zone];

  if (zoneDevices.length === 0) {
    return null;
  }

  const minX = Math.min(...zoneDevices.map((device) => device.x));
  const minY = Math.min(...zoneDevices.map((device) => device.y));
  const maxX = Math.max(...zoneDevices.map((device) => device.x + device.width));
  const maxY = Math.max(...zoneDevices.map((device) => device.y + device.height + (device.labelOffsetY ?? 22) + (device.roleOffsetY ?? 18) + 28));

  const width = Math.max(config.minWidth, maxX - minX + config.paddingX * 2);
  const height = Math.max(config.minHeight, maxY - minY + config.paddingY * 2);
  const x = Math.max(24, minX - config.paddingX);
  const y = Math.max(24, minY - config.paddingY);

  return {
    x,
    y,
    width,
    height,
    labelX: x + 28,
    labelY: y + 34,
    title: config.title,
  };
}

function resolveZoneLayout(visibleDevices: Device[], activeZones: DiagramZone[]) {
  const boundsMap = new Map<DiagramZone, ReturnType<typeof getZoneBounds>>();

  zoneOrder.forEach((zone) => {
    if (!activeZones.includes(zone)) {
      return;
    }

    const zoneBounds = getZoneBounds(zone, visibleDevices.filter((device) => device.zone === zone));
    if (zoneBounds) {
      boundsMap.set(zone, zoneBounds);
    }
  });

  const provisionamento = boundsMap.get("provisionamento");
  const transporte = boundsMap.get("transporte");
  const servidores = boundsMap.get("servidores");

  if (provisionamento && transporte) {
    const bottom = provisionamento.y + provisionamento.height;
    const minTransportY = bottom + verticalZoneGap;
    if (transporte.y < minTransportY) {
      transporte.y = minTransportY;
      transporte.labelY = transporte.y + 34;
    }
  }

  if (transporte && servidores) {
    const transportRight = transporte.x + transporte.width;
    const minServerX = transportRight - Math.min(180, servidores.width / 3);
    if (servidores.x < minServerX) {
      servidores.x = minServerX;
      servidores.labelX = servidores.x + 28;
    }

    const transportBottom = transporte.y + transporte.height;
    const minServerY = transportBottom + verticalZoneGap;
    if (servidores.y < minServerY) {
      servidores.y = minServerY;
      servidores.labelY = servidores.y + 34;
    }
  }

  if (provisionamento && servidores) {
    const provisionBottom = provisionamento.y + provisionamento.height;
    if (servidores.y < provisionBottom + verticalZoneGap) {
      servidores.y = provisionBottom + verticalZoneGap;
      servidores.labelY = servidores.y + 34;
    }

    const provisionRight = provisionamento.x + provisionamento.width;
    if (servidores.x < provisionRight + horizontalServerGap) {
      servidores.x = provisionRight + horizontalServerGap;
      servidores.labelX = servidores.x + 28;
    }
  }

  return zoneOrder
    .map((zone) => boundsMap.get(zone))
    .filter((zone): zone is NonNullable<typeof zone> => Boolean(zone));
}

export function NetworkDiagram({ flow, isAnimating }: NetworkDiagramProps) {
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const panStateRef = useRef({ active: false, startX: 0, startY: 0, scrollLeft: 0, scrollTop: 0 });
  const activeLinks = useMemo(() => new Set(flow.activeLinks), [flow.activeLinks]);
  const activeDevices = useMemo(() => new Set(flow.activeDevices), [flow.activeDevices]);
  const visibleLinks = useMemo(() => links.filter((link) => activeLinks.has(link.id)), [activeLinks]);
  const visibleDevices = useMemo(() => devices.filter((device) => activeDevices.has(device.id)), [activeDevices]);
  const visibleZones = useMemo(() => resolveZoneLayout(visibleDevices, flow.zones), [flow.zones, visibleDevices]);

  useEffect(() => {
    function handleMouseMove(event: MouseEvent) {
      const state = panStateRef.current;
      const frame = frameRef.current;
      if (!state.active || !frame) {
        return;
      }

      frame.scrollLeft = state.scrollLeft - (event.clientX - state.startX);
      frame.scrollTop = state.scrollTop - (event.clientY - state.startY);
    }

    function handleMouseUp() {
      if (!panStateRef.current.active) {
        return;
      }

      panStateRef.current = { active: false, startX: 0, startY: 0, scrollLeft: 0, scrollTop: 0 };
      setIsPanning(false);
    }

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
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
    <section className="panel diagram-panel">
      <div className="panel-heading diagram-heading">
        <div>
          <p className="eyebrow">Diagrama Operacional</p>
          <h2>Mapa do diagrama selecionado</h2>
        </div>
        <div className="diagram-badges">
          <div className="zoom-controls">
            <button
              type="button"
              className="zoom-button"
              onClick={() => setZoom((value) => Math.max(0.7, Number((value - 0.1).toFixed(2))))}
              aria-label="Reduzir zoom"
            >
              -
            </button>
            <button type="button" className="zoom-button zoom-reset" onClick={() => setZoom(1)}>
              Reset
            </button>
            <button
              type="button"
              className="zoom-button"
              onClick={() => setZoom((value) => Math.min(1.9, Number((value + 0.1).toFixed(2))))}
              aria-label="Aumentar zoom"
            >
              +
            </button>
          </div>
          <span className="status-pill hint-pill tabular-nums">Zoom {Math.round(zoom * 100)}%</span>
          <span className="status-pill hint-pill">Arraste com botao esquerdo</span>
          <span className={`status-pill tone-${flow.tone}`}>{flow.category}</span>
        </div>
      </div>

      <div
        ref={frameRef}
        className={`diagram-frame ${isPanning ? "is-panning" : ""}`}
        onMouseDown={handleMouseDown}
        onContextMenu={(event) => event.preventDefault()}
      >
        <div className="diagram-canvas" style={{ transform: `scale(${zoom})` }}>
          <svg viewBox="0 0 2040 980" role="img" aria-label={flow.name}>
            <defs>
              <filter id="nodeGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="0" stdDeviation="9" floodColor="#60a5fa" floodOpacity="0.42" />
              </filter>
            </defs>

            {visibleZones.map((zone) => {
              return (
                <g key={zone.title}>
                  <rect className="zone-box" x={zone.x} y={zone.y} width={zone.width} height={zone.height} rx="22" />
                  <text className="zone-title" x={zone.labelX} y={zone.labelY}>{zone.title}</text>
                </g>
              );
            })}

            {visibleLinks.map((link) => (
              <LinkLayer key={link.id} link={link} active={activeLinks.has(link.id)} tone={flow.tone} />
            ))}

            {visibleDevices.map((device) => (
              <DeviceShape key={device.id} device={device} active={activeDevices.has(device.id)} />
            ))}
          </svg>

          {flow.packetLabel ? (
            <div className={`packet-overlay ${isAnimating ? "is-animating" : ""}`} style={packetStyle(flow, isAnimating)}>
              <span className={`packet tone-${flow.tone}`}>{flow.packetLabel}</span>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
