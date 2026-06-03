# Knovana Chrome Extension

Chrome MV3 extension for capturing browser context into Knovana and querying the personal knowledge base from Chrome Side Panel.

## Development

See [DEV.md](DEV.md) for the full local development, build, and test workflow.

```powershell
pnpm install
pnpm dev
```

Load the generated `.output/chrome-mv3` directory in Chrome extension developer mode.

## Verification

```powershell
pnpm test:unit -- --run
pnpm format
pnpm lint
pnpm check
pnpm build
```
