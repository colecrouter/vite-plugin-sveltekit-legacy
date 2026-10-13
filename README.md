# vite-plugin-sveltekit-legacy

Modern polyfill ordering for SvelteKit builds using `@vitejs/plugin-legacy`.

This plugin wraps SvelteKit's emitted client entry modules so the generated `vite/legacy-polyfills` chunk runs before SvelteKit starts. It intentionally supports modern polyfills only, and rejects full `nomodule` legacy bundle mode.

## Compatibility

Supports SvelteKit `^2.70.3 || ^3.0.0`. These lower bounds are production-build tested; earlier Kit 2 versions are not claimed without verification. CI builds real SvelteKit 2 / Vite 6 and SvelteKit 3 / Vite 8 applications and checks the emitted entry imports. Vite 5–8 peer compatibility is checked separately. In environment builds, only the `client` environment is rewritten; SSR and custom server environments are skipped.

## Usage

```sh
npm install -D vite-plugin-sveltekit-legacy @vitejs/plugin-legacy terser
```

```ts
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";
import legacy from "vite-plugin-sveltekit-legacy";

export default defineConfig({
  plugins: [
    sveltekit(),
    legacy({
      modernTargets: ["defaults", "not IE 11"],
    }),
  ],
});
```

## Unsupported Options

- `renderLegacyChunks: true`
- `renderModernChunks: false`
- `targets`
- `polyfills`
- `additionalLegacyPolyfills`
- `externalSystemJS`
- `modernPolyfills`
- SvelteKit `output.bundleStrategy: "inline"`

## FAQ

### Why is this needed instead of using `@vitejs/plugin-legacy` directly?

`@vitejs/plugin-legacy` can emit a modern polyfill chunk for Vite builds, but SvelteKit owns the final HTML bootstrap that starts the client app. In SvelteKit builds, the emitted `vite/legacy-polyfills` chunk is not automatically guaranteed to run before SvelteKit's client entry modules.

This plugin keeps `@vitejs/plugin-legacy` responsible for generating the polyfills, then rewrites SvelteKit's emitted client entry assets so they import the polyfill chunk first. The runtime import points at `/legacy-polyfills.js`, a stable non-immutable copy of the generated modern polyfills, so SvelteKit's immutable entry URLs do not change when only the polyfill chunk hash changes.

### Does this support IE11 or full legacy chunks?

No. This plugin only handles modern polyfills from `@vitejs/plugin-legacy`.

Full `nomodule` legacy support needs more than a single Vite plugin can reliably provide for SvelteKit. It involves legacy entry assets, legacy polyfills, SystemJS bootstrapping, fallback script ordering, and framework-owned HTML output. The historical SvelteKit legacy-support PR describes this as server-side HTML script injection based on the Vite manifest because Vite's HTML injection is not preserved by SvelteKit output ([sveltejs/kit#6265 comment](https://github.com/sveltejs/kit/pull/6265#issuecomment-1373821833)).

### Does this rewrite HTML?

No. It rewrites emitted SvelteKit client entry assets in place after the client build has finished. Existing HTML, SvelteKit manifests, prerendered output, and adapter output paths are left alone.

### What happens if modern polyfills are missing?

This plugin enables `@vitejs/plugin-legacy` modern polyfills internally. If `vite/legacy-polyfills` is still not emitted, the build fails by default. You can opt out with `failOnMissingPolyfills: false`.
