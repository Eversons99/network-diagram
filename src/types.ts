export type DeviceType = "ixc" | "ont" | "onu" | "olt" | "switch" | "router" | "server" | "cpe" | "cloud";

export type DiagramZone = "transit" | "servicos" | "core" | "distribuicao" | "acesso" | "clientes";

export type FlowTone = "ixc" | "dhcp" | "pppoe" | "tr069" | "topologia";

export type Device = {
  id: string;
  name: string;
  shortName: string;
  role: string;
  type: DeviceType;
  zone: DiagramZone;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type Link = {
  id: string;
  from: string;
  to: string;
  points: Array<[number, number]>;
  label?: string;
  labelX?: number;
  labelY?: number;
  labelAnchor?: "start" | "middle" | "end";
};

export type FlowRenderDevice = {
  id: string;
  baseDeviceId: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  name?: string;
  shortName?: string;
  role?: string;
};

export type FlowLayout = {
  devicePositions?: Record<string, { x: number; y: number }>;
  linkPoints?: Record<string, Array<[number, number]>>;
  viewBox?: { minX: number; minY: number; width: number; height: number };
  renderDevices?: FlowRenderDevice[];
  renderLinks?: Link[];
};

export type Flow = {
  id: string;
  name: string;
  category: string;
  tone: FlowTone;
  source: string;
  destination: string;
  summary: string;
  route?: string[];
  details: string[];
  activeDevices: string[];
  activeLinks: string[];
  packetLabel: string;
  path: Array<[number, number]>;
  layout?: FlowLayout;
};
