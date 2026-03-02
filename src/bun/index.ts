import { ApplicationMenu, BrowserWindow, Updater, Screen } from "electrobun/bun";

const DEV_SERVER_PORT = 5173;
const DEV_SERVER_URL = `http://localhost:${DEV_SERVER_PORT}`;

// Check if Vite dev server is running for HMR
async function getMainViewUrl(): Promise<string> {
	const channel = await Updater.localInfo.channel();
	if (channel === "dev") {
		try {
			await fetch(DEV_SERVER_URL, { method: "HEAD" });
			console.log(`HMR enabled: Using Vite dev server at ${DEV_SERVER_URL}`);
			return DEV_SERVER_URL;
		} catch {
			console.log(
				"Vite dev server not running. Run 'bun run dev:hmr' for HMR support.",
			);
		}
	}
	return "views://mainview/index.html";
}

// Create the main application window
const url = await getMainViewUrl();
const primaryDisplay = Screen.getPrimaryDisplay();
const initialFrame = {
	x: primaryDisplay.workArea.x,
	y: primaryDisplay.workArea.y,
	width: primaryDisplay.workArea.width,
	height: primaryDisplay.workArea.height,
};

ApplicationMenu.setApplicationMenu([
	{
		submenu: [{ label: "Quit", role: "quit", accelerator: "q" }],
	}
]);

const mainWindow = new BrowserWindow({
	title: "fin",
	url,
	frame: initialFrame,
	styleMask: {
		Borderless: true,
		Titled: false,
		Closable: true,
		Miniaturizable: true,
		Resizable: true,
		UnifiedTitleAndToolbar: true,
		FullScreen: false,
	},
	titleBarStyle: "hiddenInset",
});

console.log("React Tailwind Vite app started!");
