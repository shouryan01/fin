import type { ElectrobunConfig } from "electrobun";

export default {
	app: {
		name: "fin",
		identifier: "fin.shouryannikam.dev",
		version: "0.0.1",
	},
	build: {
		// Vite builds to dist/, we copy from there
		copy: {
			"dist/index.html": "views/mainview/index.html",
			"dist/assets": "views/mainview/assets",
		},
		// Ignore Vite output in watch mode — HMR handles view rebuilds separately
		watchIgnore: ["dist/**"],
		mac: {
			bundleCEF: false,
			icons: "assets/icon.iconset",
		},
		linux: {
			bundleCEF: false,
			icon: "assets/icons/icon.png",
		},
		win: {
			bundleCEF: false,
			icon: "assets/icons/icon.png",
		},
	},
} satisfies ElectrobunConfig;
