import type { DeviceType } from "../types";

type DeviceGlyphProps = {
  type: DeviceType;
  x: number;
  y: number;
  width: number;
  height: number;
};

function Chassis3D({
  x,
  y,
  width,
  height,
  sideDepth = 16,
  topDepth = 8,
  radius = 8,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  sideDepth?: number;
  topDepth?: number;
  radius?: number;
}) {
  return (
    <g className="chassis-3d">
      <polygon
        className="glyph-top-face"
        points={`${x + 8},${y - topDepth} ${x + width + 6},${y - topDepth} ${x + width},${y} ${x},${y}`}
      />
      <polygon
        className="glyph-side-face"
        points={`${x + width},${y} ${x + width + sideDepth},${y + topDepth} ${x + width + sideDepth},${y + height + topDepth} ${x + width},${y + height}`}
      />
      <rect className="glyph-front-face" x={x} y={y} width={width} height={height} rx={radius} />
    </g>
  );
}

function RouterGlyph({ x, y, width, height }: Omit<DeviceGlyphProps, "type">) {
  const frontX = x + 28;
  const frontY = y + 18;
  const frontWidth = width - 54;
  const frontHeight = height - 34;
  const slotWidth = (frontWidth - 44) / 4;

  return (
    <g className="device-glyph router-glyph">
      <Chassis3D x={frontX} y={frontY} width={frontWidth} height={frontHeight} sideDepth={18} topDepth={8} radius={5} />
      {Array.from({ length: 4 }).map((_, column) => {
        const cardX = frontX + 10 + column * (slotWidth + 8);
        return (
          <g key={column}>
            <rect className="glyph-router-card" x={cardX} y={frontY + 10} width={slotWidth} height={frontHeight - 20} rx={2} />
            <rect className="glyph-router-card-cap" x={cardX + 2} y={frontY + 12} width={slotWidth - 4} height={7} rx={2} />
            {Array.from({ length: 5 }).map((__, row) => (
              <rect
                key={row}
                className="glyph-router-port"
                x={cardX + 3}
                y={frontY + 24 + row * 10}
                width={slotWidth - 6}
                height={5}
                rx={1}
              />
            ))}
          </g>
        );
      })}
      <rect className="glyph-router-control" x={frontX + 6} y={frontY + 8} width={8} height={frontHeight - 16} rx={2} />
      <circle className="glyph-router-led" cx={frontX + frontWidth + 8} cy={frontY + frontHeight - 18} r={3.5} />
    </g>
  );
}

function SwitchGlyph({ x, y, width, height }: Omit<DeviceGlyphProps, "type">) {
  const bodyX = x + 42;
  const bodyY = y + 20;
  const bodyWidth = width - 84;
  const bodyHeight = height - 40;
  const centerX = x + width / 2;
  const centerY = y + height / 2;

  return (
    <g className="device-glyph switch-glyph">
      <polygon
        className="glyph-switch-top"
        points={`${bodyX + 10},${bodyY - 8} ${bodyX + bodyWidth - 6},${bodyY - 8} ${bodyX + bodyWidth},${bodyY} ${bodyX},${bodyY}`}
      />
      <polygon
        className="glyph-switch-side"
        points={`${bodyX + bodyWidth},${bodyY} ${bodyX + bodyWidth + 12},${bodyY + 8} ${bodyX + bodyWidth + 12},${bodyY + bodyHeight + 8} ${bodyX + bodyWidth},${bodyY + bodyHeight}`}
      />
      <rect className="glyph-switch-front" x={bodyX} y={bodyY} width={bodyWidth} height={bodyHeight} rx={6} />
      <circle className="glyph-switch-core" cx={centerX} cy={centerY} r={11} />
      <circle className="glyph-switch-center" cx={centerX} cy={centerY} r={4.5} />
      <path className="glyph-switch-mark" d={`M ${centerX} ${centerY - 24} V ${centerY - 10}`} />
      <path className="glyph-switch-mark" d={`M ${centerX} ${centerY + 10} V ${centerY + 24}`} />
      <path className="glyph-switch-mark" d={`M ${centerX - 24} ${centerY} H ${centerX - 10}`} />
      <path className="glyph-switch-mark" d={`M ${centerX + 10} ${centerY} H ${centerX + 24}`} />
      <path className="glyph-switch-mark" d={`M ${centerX - 17} ${centerY - 17} L ${centerX - 8} ${centerY - 8}`} />
      <path className="glyph-switch-mark" d={`M ${centerX + 17} ${centerY - 17} L ${centerX + 8} ${centerY - 8}`} />
      <path className="glyph-switch-mark" d={`M ${centerX - 17} ${centerY + 17} L ${centerX - 8} ${centerY + 8}`} />
      <path className="glyph-switch-mark" d={`M ${centerX + 17} ${centerY + 17} L ${centerX + 8} ${centerY + 8}`} />
    </g>
  );
}

function OltGlyph({ x, y, width, height }: Omit<DeviceGlyphProps, "type">) {
  const frontX = x + 10;
  const frontY = y + 12;
  const frontWidth = width - 24;
  const frontHeight = height - 24;
  const slotWidth = (frontWidth - 54) / 5;

  return (
    <g className="device-glyph olt-glyph">
      <polygon
        className="glyph-olt-side"
        points={`${frontX + frontWidth},${frontY} ${frontX + frontWidth + 14},${frontY + 10} ${frontX + frontWidth + 14},${frontY + frontHeight + 10} ${frontX + frontWidth},${frontY + frontHeight}`}
      />
      <rect className="glyph-olt-front" x={frontX} y={frontY} width={frontWidth} height={frontHeight} rx={4} />
      <rect className="glyph-olt-top" x={frontX + 8} y={frontY - 6} width={frontWidth - 16} height={6} rx={2} />
      {Array.from({ length: 5 }).map((_, column) => {
        const slotX = frontX + 12 + column * (slotWidth + 8);
        return (
          <g key={column}>
            <rect className="glyph-olt-slot" x={slotX} y={frontY + 8} width={slotWidth} height={frontHeight - 18} rx={2} />
            <rect className="glyph-olt-slot-head" x={slotX + 2} y={frontY + 12} width={slotWidth - 4} height={6} rx={2} />
            {Array.from({ length: 6 }).map((__, row) => (
              <rect
                key={row}
                className="glyph-olt-slot-port"
                x={slotX + 3}
                y={frontY + 24 + row * 8}
                width={slotWidth - 6}
                height={4.5}
                rx={1}
              />
            ))}
          </g>
        );
      })}
    </g>
  );
}

function CustomerBox({
  x,
  y,
  width,
  height,
  showWifi,
  lights,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  showWifi: boolean;
  lights: number;
}) {
  const boxX = x + 18;
  const boxY = y + 34;
  const boxWidth = width - 36;
  const boxHeight = height - 48;
  const centerX = x + width / 2;

  return (
    <g className="device-glyph customer-glyph">
      <ellipse className="glyph-customer-shadow" cx={centerX + 4} cy={boxY + boxHeight + 8} rx={boxWidth * 0.42} ry={6} />
      <rect className="glyph-customer-body" x={boxX} y={boxY} width={boxWidth} height={boxHeight} rx={9} />
      <rect className="glyph-customer-topline" x={boxX + 8} y={boxY + 8} width={boxWidth - 16} height={5} rx={2} />
      <rect className="glyph-customer-base" x={boxX + 12} y={boxY + boxHeight - 10} width={boxWidth - 24} height={4} rx={2} />
      {Array.from({ length: lights }).map((_, index) => (
        <circle key={index} className="glyph-customer-led" cx={boxX + 18 + index * 14} cy={boxY + boxHeight - 18} r={2.7} />
      ))}
      {showWifi ? (
        <>
          <path className="glyph-customer-wifi" d={`M ${centerX - 18} ${boxY - 4} q 18 -14 36 0`} />
          <path className="glyph-customer-wifi" d={`M ${centerX - 28} ${boxY + 6} q 28 -22 56 0`} />
        </>
      ) : null}
    </g>
  );
}

function OntGlyph(props: Omit<DeviceGlyphProps, "type">) {
  return <CustomerBox {...props} showWifi={false} lights={4} />;
}

function OnuGlyph(props: Omit<DeviceGlyphProps, "type">) {
  return <CustomerBox {...props} showWifi={false} lights={3} />;
}

function CpeGlyph(props: Omit<DeviceGlyphProps, "type">) {
  return <CustomerBox {...props} showWifi={true} lights={3} />;
}

function ServerGlyph({ x, y, width, height }: Omit<DeviceGlyphProps, "type">) {
  const rackX = x + 32;
  const rackY = y + 12;
  const rackWidth = width - 64;
  const rackHeight = height - 24;

  return (
    <g className="device-glyph server-glyph">
      <ellipse className="glyph-customer-shadow" cx={rackX + rackWidth / 2 + 4} cy={rackY + rackHeight + 8} rx={rackWidth * 0.42} ry={7} />
      {Array.from({ length: 3 }).map((_, row) => {
        const unitY = rackY + row * 28;
        return (
          <g key={row}>
            <rect className="glyph-server-unit" x={rackX} y={unitY} width={rackWidth} height={24} rx={5} />
            <rect className="glyph-server-highlight" x={rackX + 6} y={unitY + 4} width={rackWidth - 12} height={5} rx={2} />
            <circle className="glyph-router-led" cx={rackX + rackWidth - 18} cy={unitY + 12} r={2.7} />
            <circle className="glyph-server-warm" cx={rackX + rackWidth - 28} cy={unitY + 12} r={2.5} />
          </g>
        );
      })}
    </g>
  );
}

function IxcGlyph({ x, y, width, height }: Omit<DeviceGlyphProps, "type">) {
  const rackX = x + 26;
  const rackY = y + 14;
  const rackWidth = width - 52;
  const rackHeight = height - 28;
  const leftWidth = rackWidth * 0.34;

  return (
    <g className="device-glyph ixc-glyph">
      <ellipse className="glyph-customer-shadow" cx={rackX + rackWidth / 2 + 4} cy={rackY + rackHeight + 8} rx={rackWidth * 0.44} ry={7} />
      <rect className="glyph-ixc-rack" x={rackX} y={rackY} width={leftWidth} height={rackHeight} rx={7} />
      {Array.from({ length: 3 }).map((_, row) => (
        <rect key={row} className="glyph-ixc-bay" x={rackX + 7} y={rackY + 10 + row * 18} width={leftWidth - 14} height={11} rx={2} />
      ))}
      <rect className="glyph-ixc-card" x={rackX + leftWidth + 10} y={rackY + 8} width={rackWidth - leftWidth - 10} height={rackHeight - 16} rx={7} />
      <text className="glyph-service-text" x={rackX + leftWidth + 10 + (rackWidth - leftWidth - 10) / 2} y={rackY + rackHeight / 2 + 7}>
        IXC
      </text>
    </g>
  );
}

export function DeviceGlyph(props: DeviceGlyphProps) {
  if (props.type === "ixc") {
    return <IxcGlyph {...props} />;
  }
  if (props.type === "ont") {
    return <OntGlyph {...props} />;
  }
  if (props.type === "onu") {
    return <OnuGlyph {...props} />;
  }
  if (props.type === "olt") {
    return <OltGlyph {...props} />;
  }
  if (props.type === "cpe") {
    return <CpeGlyph {...props} />;
  }
  if (props.type === "switch") {
    return <SwitchGlyph {...props} />;
  }
  if (props.type === "router") {
    return <RouterGlyph {...props} />;
  }
  return <ServerGlyph {...props} />;
}
