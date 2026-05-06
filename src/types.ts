export type DeviceType = "ixc" | "ont" | "onu" | "olt" | "switch" | "router" | "server" | "cpe";

export type DiagramZone = "provisionamento" | "acesso" | "core" | "servicos";

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

export type Flow = {
  id: string;
  name: string;
  category: string;
  tone: FlowTone;
  source: string;
  destination: string;
  summary: string;
  details: string[];
  activeDevices: string[];
  activeLinks: string[];
  packetLabel: string;
  path: Array<[number, number]>;
};
