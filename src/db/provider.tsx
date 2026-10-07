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

	React.useEffect(() => {
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

	return (
		<DatabaseContext.Provider value={{ isReady, error }}>
			{children}
		</DatabaseContext.Provider>
	);
}

export function useDatabase() {
	return React.useContext(DatabaseContext);
}
