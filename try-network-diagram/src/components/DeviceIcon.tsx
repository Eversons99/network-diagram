import type { DeviceType } from "../types";

type DeviceIconProps = {
  type: DeviceType;
  active: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
};

function OntGlyph({ x, y, width, height }: Omit<DeviceIconProps, "type" | "active">) {
  const centerX = x + width / 2;
  const centerY = y + height / 2;

  return (
    <g>
      <rect x={x + 16} y={y + 20} width={width - 32} height={height - 38} rx={18} />
      <rect x={x + 30} y={y + 32} width={width - 60} height={10} rx={5} />
      <circle cx={centerX - 42} cy={centerY - 4} r={4.5} />
      <circle cx={centerX - 18} cy={centerY - 4} r={4.5} />
      <circle cx={centerX + 6} cy={centerY - 4} r={4.5} />
      <path d={`M ${centerX - 48} ${centerY + 18} H ${centerX + 48}`} />
      <path d={`M ${centerX + 34} ${centerY - 18} q 12 10 0 20`} />
    </g>
  );
}

function OnuGlyph({ x, y, width, height }: Omit<DeviceIconProps, "type" | "active">) {
  const centerX = x + width / 2;
  const centerY = y + height / 2;

  return (
    <g>
      <rect x={x + 18} y={y + 24} width={width - 36} height={height - 42} rx={14} />
      <rect x={x + 34} y={y + 36} width={width - 68} height={8} rx={4} />
      <path d={`M ${centerX - 34} ${centerY + 8} H ${centerX + 34}`} />
      <path d={`M ${centerX - 22} ${centerY - 12} H ${centerX + 22}`} />
      <circle cx={centerX - 30} cy={centerY - 10} r={4.5} />
      <circle cx={centerX - 10} cy={centerY - 10} r={4.5} />
      <circle cx={centerX + 10} cy={centerY - 10} r={4.5} />
      <path d={`M ${centerX + 26} ${centerY - 16} q 10 8 0 16`} />
    </g>
  );
}

function OltGlyph({ x, y, width, height }: Omit<DeviceIconProps, "type" | "active">) {
  const left = x + 10;
  const top = y + 14;
  const innerWidth = width - 20;
  const innerHeight = height - 24;

  return (
    <g>
      <rect x={left} y={top} width={innerWidth} height={innerHeight} rx={10} />
      <rect x={left + 14} y={top + 14} width={innerWidth - 28} height={8} rx={4} />
      <rect x={left + 14} y={top + 32} width={innerWidth - 28} height={8} rx={4} />
      <rect x={left + 14} y={top + 50} width={innerWidth - 28} height={8} rx={4} />
      <circle cx={left + 32} cy={top + innerHeight - 14} r={4} />
      <circle cx={left + 54} cy={top + innerHeight - 14} r={4} />
      <circle cx={left + 76} cy={top + innerHeight - 14} r={4} />
      <circle cx={left + 98} cy={top + innerHeight - 14} r={4} />
      <circle cx={left + 120} cy={top + innerHeight - 14} r={4} />
      <circle cx={left + 142} cy={top + innerHeight - 14} r={4} />
      <path d={`M ${left + innerWidth - 70} ${top + innerHeight - 14} h 46`} />
    </g>
  );
}

function IxcGlyph({ x, y, width, height }: Omit<DeviceIconProps, "type" | "active">) {
  const centerX = x + width / 2;
  const centerY = y + height / 2;

  return (
    <g>
      <rect x={x + 12} y={y + 16} width={width - 24} height={height - 30} rx={10} />
      <rect x={x + 26} y={y + 28} width={width - 52} height={10} rx={5} />
      <path d={`M ${centerX - 44} ${centerY - 2} H ${centerX + 44}`} />
      <path d={`M ${centerX - 44} ${centerY + 18} H ${centerX + 44}`} />
      <path d={`M ${centerX - 18} ${centerY - 20} V ${centerY + 30}`} />
      <path d={`M ${centerX + 18} ${centerY - 20} V ${centerY + 30}`} />
    </g>
  );
}

function CpeGlyph({ x, y, width, height }: Omit<DeviceIconProps, "type" | "active">) {
  const centerX = x + width / 2;
  const centerY = y + height / 2;

  return (
    <g>
      <rect x={x + 18} y={y + 24} width={width - 36} height={height - 42} rx={16} />
      <path d={`M ${centerX - 28} ${centerY + 14} H ${centerX + 28}`} />
      <path d={`M ${centerX - 2} ${centerY - 16} V ${centerY - 34}`} />
      <path d={`M ${centerX - 24} ${centerY - 14} q 22 -18 44 0`} />
      <path d={`M ${centerX - 36} ${centerY - 2} q 36 -28 72 0`} />
      <circle cx={centerX - 38} cy={centerY + 2} r={3.5} />
      <circle cx={centerX - 18} cy={centerY + 2} r={3.5} />
      <circle cx={centerX + 2} cy={centerY + 2} r={3.5} />
      <circle cx={centerX} cy={centerY + 24} r={5} />
    </g>
  );
}

function SwitchGlyph({ x, y, width, height }: Omit<DeviceIconProps, "type" | "active">) {
  const left = x + 14;
  const top = y + 24;
  const innerWidth = width - 28;

  return (
    <g>
      <rect x={left} y={top} width={innerWidth} height={height - 44} rx={8} />
      <rect x={left + 16} y={top + 12} width={innerWidth - 32} height={8} rx={4} />
      <path d={`M ${left + 16} ${top + 30} H ${left + innerWidth - 16}`} />
      {Array.from({ length: 8 }).map((_, index) => {
        const portX = left + 20 + index * 22;
        return <rect key={portX} x={portX} y={top + 42} width={12} height={9} rx={2} />;
      })}
    </g>
  );
}

function RouterGlyph({ x, y, width, height }: Omit<DeviceIconProps, "type" | "active">) {
  const centerX = x + width / 2;
  const centerY = y + height / 2;

  return (
    <g>
      <ellipse cx={centerX} cy={centerY} rx={Math.max(48, width / 2 - 18)} ry={Math.max(28, height / 2 - 18)} />
      <path d={`M ${centerX - 38} ${centerY} H ${centerX + 38}`} />
      <path d={`M ${centerX} ${centerY - 22} V ${centerY + 22}`} />
      <path d={`M ${centerX - 22} ${centerY - 18} L ${centerX + 22} ${centerY + 18}`} />
      <path d={`M ${centerX + 22} ${centerY - 18} L ${centerX - 22} ${centerY + 18}`} />
    </g>
  );
}

function ServerGlyph({ x, y, width, height }: Omit<DeviceIconProps, "type" | "active">) {
  const left = x + 18;
  const top = y + 18;
  const innerWidth = width - 36;

  return (
    <g>
      <rect x={left} y={top} width={innerWidth} height={height - 36} rx={8} />
      <path d={`M ${left + 12} ${top + 22} H ${left + innerWidth - 12}`} />
      <path d={`M ${left + 12} ${top + 44} H ${left + innerWidth - 12}`} />
      <path d={`M ${left + 12} ${top + 66} H ${left + innerWidth - 12}`} />
      <circle cx={left + 20} cy={top + 12} r={3.5} />
      <circle cx={left + 34} cy={top + 12} r={3.5} />
    </g>
  );
}

export function DeviceIcon({ type, active, x, y, width, height }: DeviceIconProps) {
  if (type === "ont") {
    return <OntGlyph x={x} y={y} width={width} height={height} />;
  }

  if (type === "onu") {
    return <OnuGlyph x={x} y={y} width={width} height={height} />;
  }

  if (type === "olt") {
    return <OltGlyph x={x} y={y} width={width} height={height} />;
  }

  if (type === "ixc") {
    return <IxcGlyph x={x} y={y} width={width} height={height} />;
  }

  if (type === "cpe") {
    return <CpeGlyph x={x} y={y} width={width} height={height} />;
  }

  if (type === "switch") {
    return <SwitchGlyph x={x} y={y} width={width} height={height} />;
  }

  if (type === "router") {
    return <RouterGlyph x={x} y={y} width={width} height={height} />;
  }

  if (type === "server") {
    return <ServerGlyph x={x} y={y} width={width} height={height} />;
  }

  return <IxcGlyph x={x} y={y} width={width} height={height} />;
}
