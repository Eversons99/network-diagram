import type { CSSProperties, MouseEvent as ReactMouseEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { devices, links } from "../data/network";
import type { Device, Flow, FlowRenderDevice, Link } from "../types";
import { DeviceGlyph } from "./DeviceGlyph";

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

const DEVICE_ICON_MARGIN = 6;
const DEFAULT_VIEWBOX = { minX: -150, minY: 0, width: 2010, height: 1920 };

const zoneLabelMap: Record<Device["zone"], string> = {
  transit: "Transit",
  servicos: "Serviços",
  core: "Core",
  distribuicao: "Distribuição",
  acesso: "Acesso",
  clientes: "Clientes",
};

const toneClassMap: Record<Flow["tone"], string> = {
  ixc: "tone-ixc",
  dhcp: "tone-dhcp",
  pppoe: "tone-pppoe",
  tr069: "tone-tr069",
  topologia: "tone-topologia",
};

function buildRoundedPath(points: Array<[number, number]>, radius = 14) {
  if (points.length < 3) {
    return `M ${points.map(([x, y]) => `${x},${y}`).join(" L ")}`;
  }

  let d = `M ${points[0][0]},${points[0][1]}`;

  for (let index = 1; index < points.length - 1; index += 1) {
    const [px, py] = points[index - 1];
    const [cx, cy] = points[index];
    const [nx, ny] = points[index + 1];

    const distPrev = Math.hypot(cx - px, cy - py) || 1;
    const distNext = Math.hypot(nx - cx, ny - cy) || 1;
    const r = Math.min(radius, distPrev / 2, distNext / 2);

    const beforeX = cx + ((px - cx) / distPrev) * r;
    const beforeY = cy + ((py - cy) / distPrev) * r;
    const afterX = cx + ((nx - cx) / distNext) * r;
    const afterY = cy + ((ny - cy) / distNext) * r;

    d += ` L ${beforeX},${beforeY} Q ${cx},${cy} ${afterX},${afterY}`;
  }

  const [lastX, lastY] = points[points.length - 1];
  d += ` L ${lastX},${lastY}`;

  return d;
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

function buildOffsetPath(points: Array<[number, number]>, originX: number, originY: number) {
  return `path('M ${points.map(([x, y], index) => `${index === 0 ? "" : "L "}${x - originX} ${y - originY}`).join(" ")}')`;
}

function packetStyle(path: Array<[number, number]>, isAnimating: boolean, originX: number, originY: number): CSSProperties {
  return {
    offsetPath: buildOffsetPath(path, originX, originY),
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

function deviceCenter(device: Device): [number, number] {
  return [device.x + device.width / 2, device.y + device.height / 2];
}

function adjustLinkPoints(link: Link, deviceMap: Map<string, Device>, movedIds?: Set<string>) {
  if (link.points.length < 2) {
    return link.points;
  }

  const adjustedPoints = [...link.points];
  const fromDevice = deviceMap.get(link.from);
  const toDevice = deviceMap.get(link.to);

  if (fromDevice) {
    if (movedIds?.has(link.from)) {
      adjustedPoints[0] = deviceCenter(fromDevice);
    }
    adjustedPoints[0] = clipPointToDeviceBorder(adjustedPoints[0], adjustedPoints[1], fromDevice);
  }

  if (toDevice) {
    const lastIndex = adjustedPoints.length - 1;
    if (movedIds?.has(link.to)) {
      adjustedPoints[lastIndex] = deviceCenter(toDevice);
    }
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

function buildTopologySegments(activeLinks: Link[], deviceMap: Map<string, Device>, movedIds: Set<string>) {
  const horizontalGroups = new Map<number, AxisInterval[]>();
  const verticalGroups = new Map<number, AxisInterval[]>();
  const diagonalSegments = new Map<string, RenderSegment>();

  activeLinks.forEach((link) => {
    const adjustedPoints = adjustLinkPoints(link, deviceMap, movedIds);

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
      return "Ponto de saída da rede para o upstream principal, concentrando a borda de Internet e a interligação com o backbone externo.";
    case "router":
      return `Elemento de roteamento responsável por ${device.role.toLowerCase()}, mantendo a continuidade do tráfego entre borda e core.`;
    case "switch":
      if (device.zone === "core") {
        return "Núcleo de comutação e agregação da malha principal, distribuindo o tráfego entre upstream, distribuição e acesso.";
      }
      return "Switch de distribuição que consolida enlaces do site e encaminha o tráfego para o próximo domínio da topologia.";
    case "server":
      return `Bloco de serviços que suporta ${device.role.toLowerCase()} e centraliza workloads operacionais do ambiente.`;
    case "ixc":
      return "Aplicação central de ERP e provisionamento, usada para automação operacional, integração e gestão de clientes.";
    case "olt":
      return `Equipamento GPON de acesso responsável por terminar as portas PON e entregar o serviço no domínio ${device.shortName.toLowerCase()}.`;
    case "ont":
      return "Terminal do assinante na ponta da fibra, responsável por encerrar a conexão óptica e apresentar a WAN de serviço.";
    case "onu":
      return "Unidade óptica no lado do cliente que faz a terminação de acesso e a ponte para o equipamento residencial.";
    case "cpe":
      return "Equipamento residencial do assinante, usado para autenticar, rotear e distribuir a conectividade entregue pela rede.";
    default:
      return device.role;
  }
}

function hydrateRenderDevice(renderDevice: FlowRenderDevice, deviceCatalog: Device[]) {
  const baseDevice = deviceCatalog.find((device) => device.id === renderDevice.baseDeviceId);

  if (!baseDevice) {
    return null;
  }

  return {
    ...baseDevice,
    id: renderDevice.id,
    x: renderDevice.x,
    y: renderDevice.y,
    width: renderDevice.width ?? baseDevice.width,
    height: renderDevice.height ?? baseDevice.height,
    name: renderDevice.name ?? baseDevice.name,
    shortName: renderDevice.shortName ?? baseDevice.shortName,
    role: renderDevice.role ?? baseDevice.role,
  };
}

function buildCloudPath(x: number, y: number, width: number, height: number) {
  const w = width;
  const h = height;

  return [
    `M ${x + w * 0.18} ${y + h}`,
    `C ${x + w * 0.02} ${y + h * 0.95} ${x - w * 0.03} ${y + h * 0.5} ${x + w * 0.16} ${y + h * 0.42}`,
    `C ${x + w * 0.15} ${y + h * 0.08} ${x + w * 0.46} ${y - h * 0.02} ${x + w * 0.58} ${y + h * 0.22}`,
    `C ${x + w * 0.67} ${y + h * 0.04} ${x + w * 0.97} ${y + h * 0.1} ${x + w * 0.92} ${y + h * 0.4}`,
    `C ${x + w * 1.1} ${y + h * 0.44} ${x + w * 1.05} ${y + h} ${x + w * 0.84} ${y + h}`,
    "Z",
  ].join(" ");
}

function wrapDeviceName(name: string, maxChars: number): string[] {
  const words = name.split(" ");
  const lines: string[] = [];
  let current = "";

  words.forEach((word) => {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  });

  if (current) {
    lines.push(current);
  }

  if (lines.length > 2) {
    return [lines[0], lines.slice(1).join(" ")];
  }

  return lines;
}

function DeviceNode({
  device,
  isTopology,
  isDragging,
  onHoverStart,
  onHoverEnd,
  onDragStart,
}: {
  device: Device;
  isTopology: boolean;
  isDragging: boolean;
  onHoverStart: (device: Device) => void;
  onHoverEnd: () => void;
  onDragStart: (device: Device, event: ReactMouseEvent<SVGGElement>) => void;
  }) {
    const stripeWidth = 4;
    const iconSize = device.height - DEVICE_ICON_MARGIN * 2;
    const iconX = device.x + stripeWidth + 4 + DEVICE_ICON_MARGIN;
    const iconY = device.y + (device.height - iconSize) / 2;
    const textX = iconX + iconSize + 10;
    const titleY = device.y + device.height / 2 - 4;
    const subtitleY = device.y + device.height / 2 + 13;
    const simpleRoleLabel = device.type === "cloud" ? "transit" : device.type;

    const availableTextWidth = device.x + device.width - textX - 8;
    const maxChars = Math.max(6, Math.floor(availableTextWidth / 6.3));
    const nameLines = wrapDeviceName(device.name, maxChars);
    const isWrapped = nameLines.length > 1;
    const wrappedTitleY = titleY - 6;
    const finalSubtitleY = isWrapped ? subtitleY + 10 : subtitleY;

    if (device.type === "cloud") {
      const cloudCenterX = device.x + device.width / 2;
      const cloudCenterY = device.y + device.height * 0.46;

      return (
        <g
          className={`device-node device-cloud is-active ${isTopology ? "is-topology" : ""} ${isDragging ? "is-dragging" : ""}`}
          onMouseEnter={() => onHoverStart(device)}
          onMouseLeave={onHoverEnd}
          onMouseDown={(event) => onDragStart(device, event)}
        >
          <path className="device-cloud-shadow" d={buildCloudPath(device.x + 4, device.y + 6, device.width, device.height)} />
          <path className="device-cloud-shape" d={buildCloudPath(device.x, device.y, device.width, device.height)} />
          <text className="device-title is-cloud" x={cloudCenterX} y={cloudCenterY}>
            {device.name}
          </text>
        </g>
      );
    }

    return (
      <g
        className={`device-node device-${device.type} is-active ${isTopology ? "is-topology" : ""} ${isDragging ? "is-dragging" : ""}`}
        onMouseEnter={() => onHoverStart(device)}
      onMouseLeave={onHoverEnd}
      onMouseDown={(event) => onDragStart(device, event)}
    >
      <rect className="device-frame-shadow" x={device.x + 4} y={device.y + 6} width={device.width} height={device.height} rx={7} />
      <rect className="device-chassis" x={device.x} y={device.y} width={device.width} height={device.height} rx={7} />
      <rect className="device-chassis-bevel" x={device.x + 1.5} y={device.y + 1.5} width={device.width - 3} height={Math.max(1, device.height / 2 - 3)} rx={5.5} />
      <rect className="device-accent-stripe" x={device.x} y={device.y} width={stripeWidth + 4} height={device.height} rx={4} />
      <DeviceGlyph type={device.type} x={iconX} y={iconY} width={iconSize} height={iconSize} pad={iconSize * 0.03} />
      {isWrapped ? (
        <text className="device-title is-left" x={textX} y={wrappedTitleY}>
          <tspan x={textX} dy={0}>{nameLines[0]}</tspan>
          <tspan x={textX} dy={12}>{nameLines[1]}</tspan>
        </text>
      ) : (
        <text className="device-title is-left" x={textX} y={titleY}>
          {device.name}
        </text>
      )}
      <text className="device-subtitle is-left" x={textX} y={finalSubtitleY}>
        {simpleRoleLabel}
      </text>
      </g>
    );
  }

function LinkShape({
  link,
  toneClass,
  isTopology,
  deviceMap,
  movedIds,
}: {
  link: Link;
  toneClass: string;
  isTopology: boolean;
  deviceMap: Map<string, Device>;
  movedIds: Set<string>;
}) {
  const adjustedPoints = adjustLinkPoints(link, deviceMap, movedIds);
  const path = buildRoundedPath(adjustedPoints);
  const fallbackPoint = adjustedPoints[Math.max(0, Math.floor(adjustedPoints.length / 2) - 1)];
  const labelX = link.labelX ?? fallbackPoint[0];
  const labelY = link.labelY ?? fallbackPoint[1] - 14;
  const anchor = link.labelAnchor ?? "middle";

  return (
    <g className={`link-group is-active ${isTopology ? "is-topology" : ""}`}>
      <path className="link-base" d={path} />
      {isTopology ? null : <path className={`link-highlight ${toneClass}`} d={path} />}
      {!isTopology && link.label ? (
        <text className="link-label" x={labelX} y={labelY} textAnchor={anchor}>
          {link.label}
        </text>
      ) : null}
    </g>
  );
}

function TopologyLinkLayer({
  activeLinks,
  deviceMap,
  movedIds,
}: {
  activeLinks: Link[];
  deviceMap: Map<string, Device>;
  movedIds: Set<string>;
}) {
  const topologySegments = buildTopologySegments(activeLinks, deviceMap, movedIds);

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
  const [pinnedDeviceId, setPinnedDeviceId] = useState<string | null>(null);
  const [draggingDeviceId, setDraggingDeviceId] = useState<string | null>(null);
  const [positionOverrides, setPositionOverrides] = useState<Record<string, { x: number; y: number }>>({});
  const frameRef = useRef<HTMLDivElement | null>(null);
  const panStateRef = useRef({ active: false, startX: 0, startY: 0, scrollLeft: 0, scrollTop: 0 });
  const dragStateRef = useRef<{ id: string; startX: number; startY: number; originX: number; originY: number; moved: boolean } | null>(null);
  const zoomRef = useRef(zoom);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  const activeDeviceIds = useMemo(() => new Set(flow.activeDevices), [flow.activeDevices]);
  const activeLinkIds = useMemo(() => new Set(flow.activeLinks), [flow.activeLinks]);
  const flowDevicePositions = flow.layout?.devicePositions;
  const flowLinkPoints = flow.layout?.linkPoints;
  const flowViewBox = flow.layout?.viewBox;
  const activeViewBox = flowViewBox ?? DEFAULT_VIEWBOX;
  const flowRenderDevices = flow.layout?.renderDevices;
  const flowRenderLinks = flow.layout?.renderLinks;
  const baseVisibleDevices = useMemo(() => {
    if (flowRenderDevices?.length) {
      return flowRenderDevices
        .map((renderDevice) => hydrateRenderDevice(renderDevice, devices))
        .filter((device): device is Device => device !== null);
    }

    return devices.filter((device) => activeDeviceIds.has(device.id));
  }, [activeDeviceIds, flowRenderDevices]);
  const visibleLinks = useMemo(
    () => {
      if (flowRenderLinks?.length) {
        return flowRenderLinks;
      }

      return links
        .filter((link) => activeLinkIds.has(link.id))
        .map((link) => {
          const points = flowLinkPoints?.[link.id];
          return points ? { ...link, points } : link;
        });
    },
    [activeLinkIds, flowLinkPoints, flowRenderLinks],
  );
  const movedIds = useMemo(() => new Set(Object.keys(positionOverrides)), [positionOverrides]);
  const visibleDevices = useMemo(
    () =>
      baseVisibleDevices.map((device) => {
        const flowPosition = flowDevicePositions?.[device.id];
        const override = positionOverrides[device.id];
        const baseDevice = flowPosition ? { ...device, x: flowPosition.x, y: flowPosition.y } : device;
        return override ? { ...baseDevice, x: override.x, y: override.y } : baseDevice;
      }),
    [baseVisibleDevices, flowDevicePositions, positionOverrides],
  );
  const visibleDeviceMap = useMemo(() => new Map(visibleDevices.map((device) => [device.id, device])), [visibleDevices]);
  const hoveredDevice = useMemo(
    () => visibleDevices.find((device) => device.id === hoveredDeviceId) ?? null,
    [hoveredDeviceId, visibleDevices],
  );
  const pinnedDevice = useMemo(
    () => visibleDevices.find((device) => device.id === pinnedDeviceId) ?? null,
    [pinnedDeviceId, visibleDevices],
  );
  const inspectDevice = pinnedDevice ?? hoveredDevice;
  const toneClass = toneClassMap[flow.tone];
  const isTopology = flow.tone === "topologia";
  const hoverCard = useMemo<HoveredDeviceState | null>(() => {
    if (!inspectDevice) {
      return null;
    }

    return {
      id: inspectDevice.id,
      x: inspectDevice.x + inspectDevice.width + 18,
      y: inspectDevice.y - 10,
      width: 286,
      height: 198,
    };
  }, [inspectDevice]);
  const zoneAnchors = useMemo(() => {
    if (!isTopology) {
      return [];
    }

    const anchorByZone = new Map<Device["zone"], Device>();

    visibleDevices.forEach((device) => {
      const current = anchorByZone.get(device.zone);
      if (!current || device.y < current.y || (device.y === current.y && device.x < current.x)) {
        anchorByZone.set(device.zone, device);
      }
    });

    return Array.from(anchorByZone.entries()).map(([zone, device]) => ({ zone, device }));
  }, [isTopology, visibleDevices]);

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

  useEffect(() => {
    function handleMove(event: MouseEvent) {
      const state = dragStateRef.current;
      if (!state) {
        return;
      }

      const zoomValue = zoomRef.current;
      const dx = (event.clientX - state.startX) / zoomValue;
      const dy = (event.clientY - state.startY) / zoomValue;

      if (!state.moved && Math.hypot(event.clientX - state.startX, event.clientY - state.startY) > 4) {
        state.moved = true;
      }

      setPositionOverrides((previous) => ({
        ...previous,
        [state.id]: { x: state.originX + dx, y: state.originY + dy },
      }));
    }

    function handleUp() {
      const state = dragStateRef.current;
      dragStateRef.current = null;
      setDraggingDeviceId(null);

      if (state && !state.moved) {
        setPinnedDeviceId((current) => (current === state.id ? null : state.id));
      }
    }

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, []);

  function handleDeviceDragStart(device: Device, event: ReactMouseEvent<SVGGElement>) {
    if (event.button !== 0) {
      return;
    }

    event.stopPropagation();
    event.preventDefault();

    dragStateRef.current = {
      id: device.id,
      startX: event.clientX,
      startY: event.clientY,
      originX: device.x,
      originY: device.y,
      moved: false,
    };
    setDraggingDeviceId(device.id);
  }

  function handleMouseDown(event: ReactMouseEvent<HTMLDivElement>) {
    setPinnedDeviceId(null);

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
    setPinnedDeviceId(null);
    setDraggingDeviceId(null);
    setPositionOverrides({});
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
          <svg
            viewBox={`${activeViewBox.minX} ${activeViewBox.minY} ${activeViewBox.width} ${activeViewBox.height}`}
            style={{ width: activeViewBox.width, height: activeViewBox.height }}
            role="img"
            aria-label={flow.name}
          >
            <defs>
              <filter id="icon-white-cutout" x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
                <feComponentTransfer>
                  <feFuncR type="table" tableValues="1 0" />
                  <feFuncG type="table" tableValues="1 0" />
                  <feFuncB type="table" tableValues="1 0" />
                </feComponentTransfer>
                <feColorMatrix type="luminanceToAlpha" />
                <feComponentTransfer>
                  <feFuncR type="table" tableValues="1 1" />
                  <feFuncG type="table" tableValues="1 1" />
                  <feFuncB type="table" tableValues="1 1" />
                </feComponentTransfer>
              </filter>
            </defs>
            {isTopology ? (
              <TopologyLinkLayer activeLinks={visibleLinks} deviceMap={visibleDeviceMap} movedIds={movedIds} />
            ) : (
              visibleLinks.map((link) => (
                <LinkShape
                  key={link.id}
                  link={link}
                  toneClass={toneClass}
                  isTopology={isTopology}
                  deviceMap={visibleDeviceMap}
                  movedIds={movedIds}
                />
              ))
            )}

            {zoneAnchors.map(({ zone, device }) => (
              <text key={zone} className="zone-label" x={device.x} y={device.y - 12}>
                {zoneLabelMap[zone]}
              </text>
            ))}

            {visibleDevices.map((device) => (
              <DeviceNode
                key={device.id}
                device={device}
                isTopology={isTopology}
                isDragging={draggingDeviceId === device.id}
                onHoverStart={(nextDevice) => setHoveredDeviceId(nextDevice.id)}
                onHoverEnd={() => setHoveredDeviceId((current) => (current === device.id ? null : current))}
                onDragStart={handleDeviceDragStart}
              />
            ))}
          </svg>

          {inspectDevice && hoverCard ? (
              <div
                className={`device-hover-card ${pinnedDevice ? "is-pinned" : ""}`}
                style={{
                  left: hoverCard.x * zoom,
                  top: hoverCard.y * zoom,
                width: hoverCard.width * zoom,
                  minHeight: hoverCard.height * zoom,
                }}
              >
                {pinnedDevice ? (
                  <button type="button" className="device-hover-close" onClick={() => setPinnedDeviceId(null)} aria-label="Fechar detalhes">
                    ×
                  </button>
                ) : null}
                <div className={`device-hover-accent device-${inspectDevice.type}`} />
                <p className="device-hover-eyebrow">{inspectDevice.type === "cloud" ? "Transit" : inspectDevice.type}</p>
                <strong className="device-hover-title">{inspectDevice.name}</strong>
                <span className="device-hover-shortname">{inspectDevice.shortName}</span>
                <p className="device-hover-copy">{buildDeviceDescription(inspectDevice)}</p>
              </div>
            ) : null}

          {flow.packetLabel && flow.path.length > 1 ? (
            <div
              className={`packet-overlay ${isAnimating ? "is-animating" : ""}`}
              style={packetStyle(flow.path, isAnimating, activeViewBox.minX, activeViewBox.minY)}
            >
              <span className={`packet ${toneClass}`}>{flow.packetLabel}</span>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
