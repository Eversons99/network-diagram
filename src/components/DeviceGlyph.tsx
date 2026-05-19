import type { DeviceType } from "../types";

type DeviceGlyphProps = {
  type: DeviceType;
  x: number;
  y: number;
  width: number;
  height: number;
};

type CiscoAsset = {
  src: string;
  padX?: number;
  padY?: number;
};

const ciscoAssetMap: Record<DeviceType, CiscoAsset> = {
  router: { src: "/icons/cisco/router.png", padX: 18, padY: 14 },
  switch: { src: "/icons/cisco/switch.png", padX: 18, padY: 12 },
  server: { src: "/icons/cisco/server.png", padX: 26, padY: 10 },
  cloud: { src: "/icons/cisco/cloud.png", padX: 4, padY: 10 },
  olt: { src: "/icons/cisco/olt.png", padX: 16, padY: 18 },
  ont: { src: "/icons/cisco/ont.png", padX: 20, padY: 20 },
  onu: { src: "/icons/cisco/onu.png", padX: 20, padY: 22 },
  cpe: { src: "/icons/cisco/cpe.png", padX: 18, padY: 18 },
  ixc: { src: "/icons/cisco/ixc.png", padX: 26, padY: 10 },
};

export function DeviceGlyph({ type, x, y, width, height }: DeviceGlyphProps) {
  const asset = ciscoAssetMap[type];
  const padX = asset.padX ?? 0;
  const padY = asset.padY ?? 0;

  return (
    <image
      className="device-glyph-image"
      href={asset.src}
      x={x + padX}
      y={y + padY}
      width={Math.max(1, width - padX * 2)}
      height={Math.max(1, height - padY * 2)}
      preserveAspectRatio="xMidYMid meet"
    />
  );
}
