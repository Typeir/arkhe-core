# @arkhe/core

Arkhé's framework-free core: part attributes, labels, icon names, field ids, progress and status rules, the announcer, focus return, and the stylesheet. The React and Svelte ports are built on it.

## Entries

| Import                  | What it is                                                                              |
| ----------------------- | --------------------------------------------------------------------------------------- |
| `@arkhe/core`           | Shared logic for the ports                                                              |
| `@arkhe/core/fx`        | The canvas skeleton effect. The ports load it on demand; apps rarely import it directly |
| `@arkhe/core/arkhe.css` | The stylesheet, inside `@layer arkhe`                                                   |
| `@arkhe/core/styles/*`  | SCSS sources: tokens, mixins, component styles                                          |

## Source

This repo is split from the Arkhé monorepo with `git subtree`. Changes go to the monorepo. The `release/core` branch carries the built `dist`; `split/core` carries only the sources.

```bash
npm install
npm run build   # tsc + sass → dist/
```
