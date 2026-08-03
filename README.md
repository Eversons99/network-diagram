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

The full-topology views (`rede-completa` / `core-fisico-completo`) mirror the latest reference diagram
(`images_references/Current-network-updated.png`, and its draw.io export at `images_references/Current-network.drawio`):

- `COTIA_CORE_SW_01` fans out to a row of distribution switches, in this left-to-right order: `COTIA_DIST_SW_01`,
  `COTIA_DIST_SW_02`, `COTIA_DIST_SW_03`, `STACK_DELL_NODE01`, `THERMAS_DIST_SW_01`, `JANDIRA_DIST_SW_01`,
  `LUMEN_DIST_SW_01` — `STACK_DELL_NODE01` is deliberately centered directly under the core switch.
- `COTIA_DIST_SW_01` hosts the services branch: `CLUSTER (ANTIGO) SERVIDORES PVE/PBS`, `CDNs`, and
  `A10 (NODE1 e 2)` — it no longer terminates an OLT/ONT chain.
- `COTIA_DIST_SW_03` and `STACK_DELL_NODE01` both connect independently to the core, to each other, and down to
  `CLUSTER (NOVO) SERVIDORES PVE/PBS`.
- `NFWARE/CGNAT` connects directly and horizontally to the core switch.
- `JANDIRA_DIST_SW_01` has no OLT of its own; it only reaches access via `SANTANA_DIST_SW_01` and
  `ITAPEVI_DIST_SW_01`, each with their own OLT/ONT-ONU chain. `LUMEN_DIST_SW_01` is a dead end (no access chain).
- `INTERNET` renders as an actual cloud silhouette (`buildCloudPath` in `DiagramCanvas.tsx`), not a rectangle.

The 6 operational flows (provisioning, DHCP, PPPoE, TR069) only reference `dist01`, `dist02`, `olt`, `ont`,
`onu`, `cpe`, `tr069`, `ixc`, `bras`, `bras02`, `core`, `internet` — their hardcoded link/path coordinates are
independent of the topology-only devices above, so topology-only changes should never need to touch them.

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
- `src/components/DiagramCanvas.tsx`: SVG network rendering — device chassis/cloud rendering, link routing,
  zoom, pan, drag-to-reposition, and active path animation
- `src/components/DeviceGlyph.tsx`: renders the per-type equipment icon (`public/icons/cisco/*.png`) inside a device
- `src/data/network.ts`: devices, links, and flow definitions
- `src/types.ts`: shared type definitions
- `public/icons/cisco/`: equipment icon PNGs, pre-cropped to their own symmetric content bounds (see Editing Notes)
- `images_references/`: visual references used to guide the UI, including a draw.io export of the current topology
- `try-network-diagram/`: earlier prototype kept for reference only

## Device Appearance

Devices render as a dark hardware-style chassis (not a UI card): a colored accent stripe indicates category, a
network-equipment icon sits to the left, and the device name/type label sits to the right. Notes for anyone
touching this:

- Icon size is derived from box height in `DeviceNode` (`DiagramCanvas.tsx`), not hardcoded, so all devices get a
  consistently-sized icon automatically.
- The icon PNGs in `public/icons/cisco/` have an opaque white/gray fill baked in (not real transparency) and are
  pre-cropped so their drawn content has **symmetric** margin on all sides — this is required for the icon to
  look centered in its slot. If you ever replace or add an icon asset, crop it the same way (pad a fresh canvas
  around the ink bounding box, don't just clamp margins to the source canvas edges — clamping produces
  visibly off-center icons).
- The white background is stripped at render time via an SVG filter (`#icon-white-cutout`, defined in the diagram's
  `<defs>`) that derives real alpha transparency from luminance — do not try to "fix" this with CSS
  `filter: invert()`/`grayscale()` alone, that only recolors the background, it doesn't remove it.
- `INTERNET` is a special case: it renders as an actual cloud path (`buildCloudPath`), not the standard chassis.
- Devices can be dragged around the canvas at runtime for on-the-fly rearrangement; this is session-only state
  and is never written back to `network.ts`.

## Editing Notes

- For flow views, devices outside the selected path should remain hidden.
- For the complete-network view, hide subscriber CPEs such as ONT, ONU, and residential routers.
- In virtualization-only summaries, represent the physical host rather than exposing every VM unless the flow explicitly needs it.
- Run `npm run build` after topology, path, or UI changes.
