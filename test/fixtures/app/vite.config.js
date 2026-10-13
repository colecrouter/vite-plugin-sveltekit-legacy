import { sveltekit } from "@sveltejs/kit/vite";
import legacy from "../../../dist/index.js";
export default {
	plugins: [sveltekit(), legacy({ modernTargets: ["Safari 16.4"] })],
};
