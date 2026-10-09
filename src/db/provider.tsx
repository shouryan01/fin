import { AlertCircle, RefreshCw } from "lucide-react";
import * as React from "react";
import { initDatabase, isTauriEnvironment } from "./client";

interface DatabaseContextValue {
	isReady: boolean;
	error: Error | null;
}

const DatabaseContext = React.createContext<DatabaseContextValue>({
	isReady: false,
	error: null,
});

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
	const [isReady, setIsReady] = React.useState(false);
	const [error, setError] = React.useState<Error | null>(null);

	const init = React.useCallback(() => {
		setError(null);
		setIsReady(false);

		if (!isTauriEnvironment()) {
			setIsReady(true);
			return;
		}

		initDatabase()
			.then((res) => {
				if (process.env.NODE_ENV !== "production") {
					console.info(
						`[Database] SQLite connected. Found ${res.accountCount} accounts.`,
					);
				}
				setIsReady(true);
			})
			.catch((err) => {
				console.error("[Database] Initialization failed:", err);
				setError(err instanceof Error ? err : new Error(String(err)));
			});
	}, []);

	React.useEffect(() => {
		init();
	}, [init]);

	if (error) {
		return (
			<div className="flex min-h-screen w-full items-center justify-center p-6 bg-background text-foreground">
				<div className="max-w-md w-full rounded-xl border border-destructive/30 bg-destructive/5 p-6 shadow-sm space-y-4">
					<div className="flex items-center gap-3 text-destructive">
						<AlertCircle className="size-6 shrink-0" />
						<h2 className="text-base font-semibold">
							Database Failed to Initialize
						</h2>
					</div>
					<p className="text-sm text-muted-foreground break-words">
						{error.message}
					</p>
					<button
						type="button"
						onClick={init}
						className="inline-flex items-center justify-center gap-2 rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 transition-colors"
					>
						<RefreshCw className="size-4" />
						Retry Connection
					</button>
				</div>
			</div>
		);
	}

	return (
		<DatabaseContext.Provider value={{ isReady, error }}>
			{children}
		</DatabaseContext.Provider>
	);
}

export function useDatabase() {
	return React.useContext(DatabaseContext);
}
