# Repository Guidelines

## Project Structure & Module Organization

The primary application now lives at the repository root. Use `src/` for all active code:

- `src/App.tsx`: top-level shell, flow selection, and detail panels.
- `src/components/`: diagram renderer and device glyphs.
- `src/data/network.ts`: source of truth for devices, links, and flows.
- `src/types.ts`: shared diagram/domain types.
- `images_references/`: visual references for topology style and equipment look.
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
- Preserve the logical path `IXC (VM) -> Servidor de Virtualizacao -> COTIA_DIST_SW_01 -> COTIA_CORE_SW_01 -> COTIA_DIST_SW_02 -> OLT`.
- Keep zone spacing readable: `Acesso GPON`, `Transporte e Core`, and `Ambiente de Servicos` should not feel crowded.

## Testing Guidelines

There is no dedicated test framework yet. Validate changes with:

- `npm run build`
- manual browser checks for flow selection, hidden/visible devices, labels, zoom, pan, and animation state

## Commit & Pull Request Guidelines

Git history is not available in this workspace, so use short imperative commit messages, for example: `Adjust IXC virtualization path`.

Pull requests should include a concise summary, affected flows, manual verification notes, and screenshots or recordings for visible diagram changes.
