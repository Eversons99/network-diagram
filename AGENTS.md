# Repository Guidelines

## Project Structure & Module Organization

The primary application now lives at the repository root. Use `src/` for all active code:

- `src/App.tsx`: top-level shell — slim top bar, left sidebar nav for flows (grouped by `category`, no
  `<select>` anymore), and the right details panel.
- `src/components/DiagramCanvas.tsx`: diagram renderer — device chassis/cloud shapes, link routing, zoom/pan/drag,
  click-to-pin device inspector, zone labels.
- `src/components/DeviceGlyph.tsx`: renders the per-type icon from `public/icons/cisco/`.
- `src/data/network.ts`: source of truth for devices, links, and flows.
- `src/types.ts`: shared diagram/domain types.
- `public/icons/cisco/`: equipment icon PNGs, pre-cropped to symmetric content bounds — see Diagram Rules.
- `images_references/`: visual references for topology style and equipment look, including a draw.io export.
- `try-network-diagram/`: legacy prototype kept only as historical reference.

Do not edit `dist/` manually; it is build output.

## Build, Test, and Development Commands

Run commands from the repository root:

- `npm install`: install dependencies.
- `npm run dev`: start the Vite development server.
- `npm run build`: run TypeScript checks and create the production bundle.
- `npm run preview`: serve the built app locally.

Use `npm run build` as the minimum validation step before closing any change.

## Coding Style & Naming Conventions

Follow the existing style: TypeScript, React function components, 2-space indentation, semicolons, and double quotes. Use `PascalCase` for component files, `camelCase` for variables/functions, and `kebab-case` for flow IDs such as `provisionamento-ont`.

Keep topology and flow behavior centralized in `src/data/network.ts`. Prefer editing the model there instead of hardcoding routing or labels inside components.

## Diagram Rules

- In flow views, show only devices and links that participate in the selected flow.
- In full-network views, show only infrastructure intentionally included by the flow definition.
- Treat `Servidor de Virtualizacao` as the physical host; only expose VMs such as `IXC` in flows that need them.
- `provisionamento-ont` (and any similarly-modeled secondary flow) follows an Ida/Volta convention: define the
  outbound (`Ida`) path once — `ONT/ONU -> OLT -> COTIA_DIST_SW_02 -> COTIA_CORE_SW_01 -> COTIA_CORE_BRAS_01 ->
  COTIA_CORE_SW_01 -> COTIA_DIST_SW_01 -> SERVIDORES -> IXC/RADIUS` — and treat the return trip as the same
  `activeDevices`/`activeLinks` in reverse. There are no directional arrows on links, so a single flow definition
  already represents both directions; don't build a second "Volta" flow unless the user explicitly wants a
  separate reverse-only animation. Note `core` is intentionally visited twice in the `path` array (once toward
  BRAS, once toward the distribution/server side) with a small coordinate offset between passes so the animated
  packet's loop through core stays legible.
- Keep zone spacing readable: `Acesso GPON`, `Transporte e Core`, and `Ambiente de Servicos` should not feel crowded.
- The topology-only device set (`rede-completa` / `core-fisico-completo`) must match
  `images_references/Current-network-updated.png` (draw.io export: `images_references/Current-network.drawio`):
  distribution row order is `dist01, dist02, dist03, stackdell, thermas, jandira, lumen` with `stackdell` centered
  under `core`; `dist01` hosts `cluster-antigo` / `cdns` / `a10` (no OLT); `dist03` + `stackdell` both link to
  `core` and to `cluster-novo`; `jandira` has no direct OLT, only via `santana` / `itapevi`; `lumen` is a dead end.
- The 6 operational flows only reference `dist01`, `dist02`, `olt`, `ont`, `onu`, `cpe`, `tr069`, `ixc`, `bras`,
  `bras02`, `core`, `internet` — topology-only devices (CDNs, A10, Cluster Antigo/Novo, Stack Dell, dist03,
  Santana/Itapevi, Lumen) are never referenced there. Keep it that way: it means topology repositioning never
  needs to touch the operational flows' hand-authored link/path coordinates.
- Device appearance is a hardware chassis (icon + accent stripe + label), not a UI card — see `README.md`
  "Device Appearance" before changing `DeviceNode` styling or icon assets. In particular: icon PNGs must stay
  cropped with symmetric margin around their content (never clamp margins to the source canvas edge — it
  produces visibly off-center icons), and the white background removal relies on the `#icon-white-cutout` SVG
  filter, not a CSS color filter.
- `INTERNET` renders as a cloud path (`buildCloudPath`), not the standard chassis — keep its connector touching
  the shape's actual bottom curve, not just the bounding box.
- Topology views show small zone labels (text only) instead of dashed zone-boundary boxes, because our zones
  interleave spatially (services devices share rows with access/distribution devices). Don't add full zone
  bounding boxes without first confirming the layout has changed to give each zone a clean, non-overlapping band.
- The page layout is a 3-column CSS grid (`.workspace-grid`: nav 220px / canvas / details 336px) that collapses
  to one column below 1180px. If you change container widths, re-check that breakpoint at a normal laptop width
  (~1400px) — a stale breakpoint here previously collapsed the 3-column layout on almost every real screen size.
- The theme control is a toggle switch (`.theme-toggle` + `.theme-toggle-knob`), not a text button — preserve the
  track/knob structure if you touch it, don't revert to a labeled pill button.

## Testing Guidelines

There is no dedicated test framework yet. Validate changes with:

- `npm run build`
- manual browser checks for flow selection, hidden/visible devices, labels, zoom, pan, and animation state
- after any device/link coordinate change, a quick programmatic collision check (bounding-box overlap between
  all `.device-chassis` rects in the active flow) catches accidental overlaps faster than eyeballing the canvas
- after any icon asset or `DeviceNode` styling change, visually confirm the icon still fills its slot evenly and
  the white background stays removed — this has regressed twice from filter changes that looked correct in code

## Commit & Pull Request Guidelines

Use short imperative commit messages, for example: `Adjust IXC virtualization path`. Check `git log` for the
established style before writing a new one.

Pull requests should include a concise summary, affected flows, manual verification notes, and screenshots or recordings for visible diagram changes.
