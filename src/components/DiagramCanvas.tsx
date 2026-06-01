import type { CSSProperties, MouseEvent as ReactMouseEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { devices, links } from "../data/network";
import type { Device, Flow, Link } from "../types";

type DiagramCanvasProps = {
  flow: Flow;
  isAnimating: boolean;
};

type HoveredDeviceState = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
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

type RenderSegment = {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

type AxisInterval = {
  start: number;
  end: number;
};

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

function isInsideDevice(point: [number, number], device: Device) {
  const [x, y] = point;
  return x > device.x && x < device.x + device.width && y > device.y && y < device.y + device.height;
}

function clipPointToDeviceBorder(point: [number, number], nextPoint: [number, number], device: Device): [number, number] {
  if (!isInsideDevice(point, device)) {
    return point;
  }

  const [x1, y1] = point;
  const [x2, y2] = nextPoint;
  const dx = x2 - x1;
  const dy = y2 - y1;

  if (dx === 0 && dy === 0) {
    return point;
  }

  const candidates: number[] = [];

  if (dx !== 0) {
    const leftT = (device.x - x1) / dx;
    const rightT = (device.x + device.width - x1) / dx;
    candidates.push(leftT, rightT);
  }

  if (dy !== 0) {
    const topT = (device.y - y1) / dy;
    const bottomT = (device.y + device.height - y1) / dy;
    candidates.push(topT, bottomT);
  }

  const validT = candidates
    .filter((value) => value >= 0 && value <= 1)
    .sort((a, b) => a - b)
    .find((value) => {
      const candidateX = x1 + dx * value;
      const candidateY = y1 + dy * value;
      return (
        candidateX >= device.x - 0.5 &&
        candidateX <= device.x + device.width + 0.5 &&
        candidateY >= device.y - 0.5 &&
        candidateY <= device.y + device.height + 0.5
      );
    });

  if (validT === undefined) {
    return point;
  }

  return [x1 + dx * validT, y1 + dy * validT];
}

function adjustLinkPoints(link: Link, deviceMap: Map<string, Device>) {
  if (link.points.length < 2) {
    return link.points;
  }

  const adjustedPoints = [...link.points];
  const fromDevice = deviceMap.get(link.from);
  const toDevice = deviceMap.get(link.to);

  if (fromDevice) {
    adjustedPoints[0] = clipPointToDeviceBorder(adjustedPoints[0], adjustedPoints[1], fromDevice);
  }

  if (toDevice) {
    const lastIndex = adjustedPoints.length - 1;
    adjustedPoints[lastIndex] = clipPointToDeviceBorder(adjustedPoints[lastIndex], adjustedPoints[lastIndex - 1], toDevice);
  }

  return adjustedPoints;
}

function addAxisInterval(groups: Map<number, AxisInterval[]>, fixedPosition: number, start: number, end: number) {
  if (start === end) {
    return;
  }

  const interval = { start: Math.min(start, end), end: Math.max(start, end) };
  const group = groups.get(fixedPosition) ?? [];
  group.push(interval);
  groups.set(fixedPosition, group);
}

function mergeAxisIntervals(groups: Map<number, AxisInterval[]>, orientation: "horizontal" | "vertical") {
  const segments: RenderSegment[] = [];

  groups.forEach((intervals, fixedPosition) => {
    const sortedIntervals = [...intervals].sort((a, b) => a.start - b.start || a.end - b.end);
    const mergedIntervals: AxisInterval[] = [];

    sortedIntervals.forEach((interval) => {
      const previous = mergedIntervals[mergedIntervals.length - 1];

      if (!previous || interval.start > previous.end) {
        mergedIntervals.push({ ...interval });
        return;
      }

      previous.end = Math.max(previous.end, interval.end);
    });

    mergedIntervals.forEach((interval) => {
      if (orientation === "horizontal") {
        segments.push({
          id: `h-${fixedPosition}-${interval.start}-${interval.end}`,
          x1: interval.start,
          y1: fixedPosition,
          x2: interval.end,
          y2: fixedPosition,
        });
        return;
      }

      segments.push({
        id: `v-${fixedPosition}-${interval.start}-${interval.end}`,
        x1: fixedPosition,
        y1: interval.start,
        x2: fixedPosition,
        y2: interval.end,
      });
    });
  });

  return segments;
}

function buildDiagonalSegmentKey(start: [number, number], end: [number, number]) {
  const startKey = `${start[0]},${start[1]}`;
  const endKey = `${end[0]},${end[1]}`;
  return startKey < endKey ? `${startKey}-${endKey}` : `${endKey}-${startKey}`;
}

function buildTopologySegments(activeLinks: Link[], deviceMap: Map<string, Device>) {
  const horizontalGroups = new Map<number, AxisInterval[]>();
  const verticalGroups = new Map<number, AxisInterval[]>();
  const diagonalSegments = new Map<string, RenderSegment>();

  activeLinks.forEach((link) => {
    const adjustedPoints = adjustLinkPoints(link, deviceMap);

    adjustedPoints.forEach((point, index) => {
      if (index === adjustedPoints.length - 1) {
        return;
      }

      const nextPoint = adjustedPoints[index + 1];

      if (point[0] === nextPoint[0]) {
        addAxisInterval(verticalGroups, point[0], point[1], nextPoint[1]);
        return;
      }

      if (point[1] === nextPoint[1]) {
        addAxisInterval(horizontalGroups, point[1], point[0], nextPoint[0]);
        return;
      }

      const id = buildDiagonalSegmentKey(point, nextPoint);
      diagonalSegments.set(id, {
        id: `d-${id}`,
        x1: point[0],
        y1: point[1],
        x2: nextPoint[0],
        y2: nextPoint[1],
      });
    });
  });

  return [
    ...mergeAxisIntervals(horizontalGroups, "horizontal"),
    ...mergeAxisIntervals(verticalGroups, "vertical"),
    ...diagonalSegments.values(),
  ];
}

function buildDeviceDescription(device: Device) {
  switch (device.type) {
    case "cloud":
      return "Ponto de saida da rede para o upstream principal, concentrando a borda de Internet e a interligacao com o backbone externo.";
    case "router":
      return `Elemento de roteamento responsavel por ${device.role.toLowerCase()}, mantendo a continuidade do trafego entre borda e core.`;
    case "switch":
      if (device.zone === "core") {
        return "Nucleo de comutacao e agregacao da malha principal, distribuindo o trafego entre upstream, distribuicao e acesso.";
      }
      return "Switch de distribuicao que consolida enlaces do site e encaminha o trafego para o proximo dominio da topologia.";
    case "server":
      return `Bloco de servicos que suporta ${device.role.toLowerCase()} e centraliza workloads operacionais do ambiente.`;
    case "ixc":
      return "Aplicacao central de ERP e provisionamento, usada para automacao operacional, integracao e gestao de clientes.";
    case "olt":
      return `Equipamento GPON de acesso responsavel por terminar as portas PON e entregar o servico no dominio ${device.shortName.toLowerCase()}.`;
    case "ont":
      return "Terminal do assinante na ponta da fibra, responsavel por encerrar a conexao optica e apresentar a WAN de servico.";
    case "onu":
      return "Unidade optica no lado do cliente que faz a terminacao de acesso e a ponte para o equipamento residencial.";
    case "cpe":
      return "Equipamento residencial do assinante, usado para autenticar, rotear e distribuir a conectividade entregue pela rede.";
    default:
      return device.role;
  }
}

function DeviceNode({
  device,
  isTopology,
  onHoverStart,
  onHoverEnd,
}: {
  device: Device;
  isTopology: boolean;
  onHoverStart: (device: Device) => void;
  onHoverEnd: () => void;
  }) {
    const labelX = device.x + device.width / 2;
    const topBarHeight = 12;
    const titleY = device.y + topBarHeight + 19;
    const subtitleY = device.y + topBarHeight + 35;
    const simpleRoleLabel = device.type === "cloud" ? "transit" : device.type;

    return (
      <g
        className={`device-node device-${device.type} is-active ${isTopology ? "is-topology" : ""}`}
        onMouseEnter={() => onHoverStart(device)}
      onMouseLeave={onHoverEnd}
    >
      <rect className="device-frame-shadow" x={device.x + 4} y={device.y + 6} width={device.width} height={device.height} rx={12} />
      <rect className="device-frame" x={device.x} y={device.y} width={device.width} height={device.height} rx={12} />
      <rect className="device-frame-topbar" x={device.x} y={device.y} width={device.width} height={topBarHeight} rx={12} />
      <rect className="device-frame-topbar-mask" x={device.x} y={device.y + topBarHeight - 4} width={device.width} height="8" />
      <line className="device-divider" x1={device.x + 14} y1={device.y + topBarHeight + 42} x2={device.x + device.width - 14} y2={device.y + topBarHeight + 42} />
      <text className="device-title is-inline" x={labelX} y={titleY}>
        {device.name}
      </text>
      <text className="device-subtitle is-inline" x={labelX} y={subtitleY}>
        {simpleRoleLabel}
      </text>
      </g>
    );
  }

function LinkShape({ link, toneClass, isTopology, deviceMap }: { link: Link; toneClass: string; isTopology: boolean; deviceMap: Map<string, Device> }) {
  const adjustedPoints = adjustLinkPoints(link, deviceMap);
  const points = buildPolyline(adjustedPoints);
  const fallbackPoint = adjustedPoints[Math.max(0, Math.floor(adjustedPoints.length / 2) - 1)];
  const labelX = link.labelX ?? fallbackPoint[0];
  const labelY = link.labelY ?? fallbackPoint[1] - 14;
  const anchor = link.labelAnchor ?? "middle";

  return (
    <g className={`link-group is-active ${isTopology ? "is-topology" : ""}`}>
      <polyline className="link-base" points={points} />
      {isTopology ? null : <polyline className={`link-highlight ${toneClass}`} points={points} />}
      {!isTopology && link.label ? (
        <text className="link-label" x={labelX} y={labelY} textAnchor={anchor}>
          {link.label}
        </text>
      ) : null}
    </g>
  );
}

function TopologyLinkLayer({ activeLinks, deviceMap }: { activeLinks: Link[]; deviceMap: Map<string, Device> }) {
  const topologySegments = buildTopologySegments(activeLinks, deviceMap);

  return (
    <g className="link-group is-active is-topology">
      {topologySegments.map((segment) => (
        <line
          key={segment.id}
          className="link-base"
          x1={segment.x1}
          y1={segment.y1}
          x2={segment.x2}
          y2={segment.y2}
        />
      ))}
    </g>
  );
}

export function DiagramCanvas({ flow, isAnimating }: DiagramCanvasProps) {
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [hoveredDeviceId, setHoveredDeviceId] = useState<string | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const panStateRef = useRef({ active: false, startX: 0, startY: 0, scrollLeft: 0, scrollTop: 0 });

  const activeDeviceIds = useMemo(() => new Set(flow.activeDevices), [flow.activeDevices]);
  const activeLinkIds = useMemo(() => new Set(flow.activeLinks), [flow.activeLinks]);
  const visibleDevices = useMemo(() => devices.filter((device) => activeDeviceIds.has(device.id)), [activeDeviceIds]);
  const visibleLinks = useMemo(() => links.filter((link) => activeLinkIds.has(link.id)), [activeLinkIds]);
  const visibleDeviceMap = useMemo(() => new Map(visibleDevices.map((device) => [device.id, device])), [visibleDevices]);
  const hoveredDevice = useMemo(
    () => visibleDevices.find((device) => device.id === hoveredDeviceId) ?? null,
    [hoveredDeviceId, visibleDevices],
  );
  const toneClass = toneClassMap[flow.tone];
  const isTopology = flow.tone === "topologia";
  const hoverCard = useMemo<HoveredDeviceState | null>(() => {
    if (!hoveredDevice) {
      return null;
    }

    return {
      id: hoveredDevice.id,
      x: hoveredDevice.x + hoveredDevice.width + 18,
      y: hoveredDevice.y - 10,
      width: 286,
      height: 198,
    };
  }, [hoveredDevice]);

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

  useEffect(() => {
    setHoveredDeviceId(null);
  }, [flow.id]);

  return (
    <section className="diagram-panel">
      <div className="diagram-toolbar">
        <div>
          <p className="eyebrow">Operational map</p>
          <h2>Canvas top-down</h2>
        </div>

        <div className="diagram-toolbar-actions">
          <div className="zoom-group" role="group" aria-label="Controles de zoom">
            <button type="button" className="toolbar-button" onClick={() => setZoom((value) => Math.max(0.7, Number((value - 0.1).toFixed(2))))}>
              -
            </button>
            <button type="button" className="toolbar-button toolbar-button-wide" onClick={() => setZoom(1)}>
              Reset
            </button>
            <button type="button" className="toolbar-button" onClick={() => setZoom((value) => Math.min(1.55, Number((value + 0.1).toFixed(2))))}>
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
          <svg viewBox="0 0 1860 1920" role="img" aria-label={flow.name}>
            {isTopology ? (
              <TopologyLinkLayer activeLinks={visibleLinks} deviceMap={visibleDeviceMap} />
            ) : (
              visibleLinks.map((link) => (
                <LinkShape key={link.id} link={link} toneClass={toneClass} isTopology={isTopology} deviceMap={visibleDeviceMap} />
              ))
            )}

            {visibleDevices.map((device) => (
              <DeviceNode
                key={device.id}
                device={device}
                isTopology={isTopology}
                onHoverStart={(nextDevice) => setHoveredDeviceId(nextDevice.id)}
                onHoverEnd={() => setHoveredDeviceId((current) => (current === device.id ? null : current))}
              />
            ))}
          </svg>

          {hoveredDevice && hoverCard ? (
              <div
                className="device-hover-card"
                style={{
                  left: hoverCard.x * zoom,
                  top: hoverCard.y * zoom,
                width: hoverCard.width * zoom,
                  minHeight: hoverCard.height * zoom,
                }}
              >
                <div className={`device-hover-accent device-${hoveredDevice.type}`} />
                <p className="device-hover-eyebrow">{hoveredDevice.type === "cloud" ? "Transit" : hoveredDevice.type}</p>
                <strong className="device-hover-title">{hoveredDevice.name}</strong>
                <span className="device-hover-shortname">{hoveredDevice.shortName}</span>
                <p className="device-hover-copy">{buildDeviceDescription(hoveredDevice)}</p>
              </div>
            ) : null}

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
