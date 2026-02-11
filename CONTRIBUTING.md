# Contributing

Thanks for your interest in contributing. This project is a monorepo; please read the repository layout in `README.md` before making changes.

We welcome contributions from members of the research community who are not primarily developers. Useful contributions include:

- Reproducible experiment scripts or demos (small, focused examples are ideal).
- Bug reports with minimal repro steps and expected vs actual behaviour.
- Notes on browser‑specific behaviour, timing quirks, or hardware differences.
- Documentation improvements (clarifying setup steps, data‑collection guidance, or timing assumptions).
- Test cases that capture real‑world experimental constraints.

## Development setup

- Install Node.js and npm.
- Run `npm install` at the repository root.

## Build and tests

- Build all packages: `npm run build`
- Run headed browser tests only: `npm run tests:headed`
- Format: `npm run format`
- Lint: `npm run lint`

## Pull requests

- Keep changes focused and small where possible.
- Include tests or a short manual test note for browser-facing changes.
- If you add new manual test pages under `packages/test-server/public`, update `packages/test-server/public/README.md`.

## Licensing

By contributing, you agree that your contributions will be licensed under the MIT License.
