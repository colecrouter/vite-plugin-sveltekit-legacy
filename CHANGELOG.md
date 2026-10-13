# Changelog

## 0.1.1

- Support SvelteKit 3 environment builds: rewrite only the client environment, using its output configuration rather than shared SSR configuration.
- Preserve SvelteKit 2 and older Vite build behavior.
- Add build lifecycle regressions and production-build CI fixtures for SvelteKit 2 / Vite 6 and SvelteKit 3 / Vite 8.
- Keep option types compatible with older plugin-legacy versions that do not expose Babel assumptions.
- Repair the dependency lockfile so clean installs succeed.
