# algo — multi-runtime friction (recurring context)

The library targets four runtimes simultaneously: **Deno**, **browser via vite** (HTML notebooks under `.compo/*.html`), **Jupyter** (Deno kernel), and **Observable**. Notebook cells today often hardcode runtime-specific calls (`Deno.writeFile`, `npm:` imports, manual `{ verovio, VerovioToolkit }` passing to `jm.score`), which breaks when the same notebook is opened in a different environment.

**When the user reports errors from a notebook**, prefer lib-level abstractions over per-cell patches:

- Auto-resolve Verovio inside `jm.score(comp)` (detect env, load `npm:verovio` under Deno, CDN bundle in browser).
- Move file-IO and presentation behind `jm.env` (e.g. `jm.env.writeFile`, `jm.env.midi`) so cells stay runtime-agnostic.
- Aim for templates (`template.html`, `template.ipynb`) that contain only `import jm from "..."` — no per-runtime wiring.

The user is open to library-level changes that move complexity out of notebooks; that's the preferred fix shape.

## Memory pointer

- Project memory file: [project_runtime_friction.md](/home/essi/.claude/projects/-home-essi-Documents-git-algo/memory/project_runtime_friction.md)
