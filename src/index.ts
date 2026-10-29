import path from "node:path";
import type { Options as LegacyOptions } from "@vitejs/plugin-legacy";
import legacyPlugin from "@vitejs/plugin-legacy";
import type { Plugin, ResolvedConfig } from "vite";
import { rewriteSvelteKitClientEntries } from "./rewrite.js";

const PLUGIN_NAME = "vite-plugin-sveltekit-legacy";

export interface SvelteKitLegacyOptions
	extends Pick<
		LegacyOptions,
		Extract<
			keyof LegacyOptions,
			| "additionalModernPolyfills"
			| "assumptions"
			| "modernTargets"
			| "modernPolyfills"
		>
	> {
	outDir?: string;
	failOnMissingPolyfills?: boolean;
	renderLegacyChunks?: false;
	renderModernChunks?: true;
	targets?: never;
	polyfills?: never;
	additionalLegacyPolyfills?: never;
	externalSystemJS?: never;
}

export default function legacy(options: SvelteKitLegacyOptions = {}): Plugin[] {
	validateOptions(options);

	const {
		outDir = ".svelte-kit",
		failOnMissingPolyfills = true,
		modernPolyfills = true,
		...legacyOptions
	} = options;

	return [
		...legacyPlugin({
			// Automatic detection remains the default; an explicit list lets callers
			// choose which compatibility repairs belong in their supported baseline.
			modernPolyfills,
			...legacyOptions,
			renderLegacyChunks: false,
			renderModernChunks: true,
		}),
		createEntryWrapperPlugin({ outDir, failOnMissingPolyfills }),
	];
}

function createEntryWrapperPlugin(options: {
	outDir: string;
	failOnMissingPolyfills: boolean;
}): Plugin {
	let config: ResolvedConfig;

	return {
		name: `${PLUGIN_NAME}:wrap-sveltekit-entries`,
		apply: "build",
		enforce: "post",
		configResolved(resolved) {
			config = resolved;
		},
		writeBundle() {
			// Older Vite builds expose only the resolved config. Environment builds
			// share that config across SSR/client, so use the active environment.
			const environment = (
				this as unknown as {
					environment?: { name: string; config: ResolvedConfig };
				}
			).environment;
			if (environment ? environment.name !== "client" : config.build.ssr) {
				return;
			}
			const clientConfig = environment?.config ?? config;

			const clientOutDir = getClientOutDir(clientConfig, options.outDir);
			const result = rewriteSvelteKitClientEntries({
				clientOutDir,
				failOnMissingPolyfills: options.failOnMissingPolyfills,
			});

			if (
				result.polyfillFile &&
				result.wrappedFiles.length === 0 &&
				options.failOnMissingPolyfills
			) {
				throw new Error(
					`[${PLUGIN_NAME}] Found ${result.polyfillFile}, but no SvelteKit client entry files were wrapped.`,
				);
			}
		},
	};
}

function validateOptions(options: SvelteKitLegacyOptions) {
	const unsafeOptions = options as LegacyOptions;

	if (unsafeOptions.renderLegacyChunks === true) {
		throw new Error(
			`[${PLUGIN_NAME}] renderLegacyChunks: true is not supported. Use modern polyfills only.`,
		);
	}

	if (unsafeOptions.renderModernChunks === false) {
		throw new Error(
			`[${PLUGIN_NAME}] renderModernChunks: false is not supported.`,
		);
	}

	for (const optionName of [
		"targets",
		"polyfills",
		"additionalLegacyPolyfills",
		"externalSystemJS",
	] as const) {
		if (optionName in unsafeOptions) {
			throw new Error(
				`[${PLUGIN_NAME}] ${optionName} is not supported because this plugin only configures modern polyfills.`,
			);
		}
	}
}

function getClientOutDir(config: ResolvedConfig, outDir: string) {
	const configuredOutDir = path.resolve(config.root, config.build.outDir);

	if (configuredOutDir.endsWith(path.join("output", "client"))) {
		return configuredOutDir;
	}

	return path.resolve(config.root, outDir, "output", "client");
}
