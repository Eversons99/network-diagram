# Network Diagram

Interactive ISP network diagram built with Vite, React, and TypeScript.

The app focuses on two use cases:

- show a single operational flow at a time, rendering only the participating devices and links
- show an infrastructure-wide topology view for the main network

## Current Model

The active topology is defined in `src/data/network.ts` and currently covers:

- provisioning of ONT and ONU
- DHCP for the TR069 management WAN
- PPPoE authentication for ONT and ONU bridge scenarios
- ACS / TR069 communication
- complete network view with core infrastructure only

The virtualization area models `IXC` as a VM behind `Servidor de Virtualizacao / Proxmox`. In provisioning flows, the logical path is:

`IXC (VM) -> Servidor de Virtualizacao -> COTIA_DIST_SW_01 -> COTIA_CORE_SW_01 -> COTIA_DIST_SW_02 -> OLT_XPTO_01`

## Development

From the repository root:

```bash
npm install
npm run dev
```

Other useful commands:

```bash
npm run build
npm run preview
```

## Project Layout

- `src/App.tsx`: application shell and flow selector
- `src/components/DiagramCanvas.tsx`: SVG network rendering, zoom, pan, and active path animation
- `src/components/DeviceGlyph.tsx`: custom equipment icons
- `src/data/network.ts`: devices, links, and flow definitions
- `src/types.ts`: shared type definitions
- `images_references/`: visual references used to guide the UI
- `try-network-diagram/`: earlier prototype kept for reference only

## Editing Notes

- For flow views, devices outside the selected path should remain hidden.
- For the complete-network view, hide subscriber CPEs such as ONT, ONU, and residential routers.
- In virtualization-only summaries, represent the physical host rather than exposing every VM unless the flow explicitly needs it.
- Run `npm run build` after topology, path, or UI changes.
