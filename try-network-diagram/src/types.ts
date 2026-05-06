export type DeviceType = "ixc" | "ont" | "onu" | "olt" | "switch" | "router" | "server" | "cpe";

export type LayerMode = "auto" | "l2" | "l3";

export type LinkLayer = "l2" | "l3" | "logical";

export type Device = {
  id: string;
  name: string;
  shortName: string;
  role: string;
  type: DeviceType;
  zone?: DiagramZone;
  x: number;
  y: number;
  width: number;
  height: number;
  labelOffsetX?: number;
  labelOffsetY?: number;
  roleOffsetY?: number;
};

export type Link = {
  id: string;
  from: string;
  to: string;
  points: Array<[number, number]>;
  layer: LinkLayer;
  label?: string;
  labelX?: number;
  labelY?: number;
  labelAnchor?: "start" | "middle" | "end";
  l3Path?: Array<[number, number]>;
  l3Label?: string;
  l3LabelX?: number;
  l3LabelY?: number;
  l3LabelAnchor?: "start" | "middle" | "end";
};

export type FlowTone = "ixc" | "dhcp" | "tr069" | "base";

export type DiagramZone = "provisionamento" | "transporte" | "servidores";

export type Flow = {
  id: string;
  name: string;
  category: string;
  tone: FlowTone;
  source: string;
  destination: string;
  layer: string;
  summary: string;
  details: string[];
  zones: DiagramZone[];
  activeDevices: string[];
  activeLinks: string[];
  l3Devices?: string[];
  l3Links?: string[];
  defaultLayerMode?: Exclude<LayerMode, "auto">;
  packetLabel: string;
  path: Array<[number, number]>;
  l3Path?: Array<[number, number]>;
};
