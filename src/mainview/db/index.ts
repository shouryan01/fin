/** biome-ignore-all lint/style/noNonNullAssertion: process.env.DATABASE_URL is set by the environment */
import { drizzle } from "drizzle-orm/better-sqlite3";

import * as schema from "./schema.ts";

export const db = drizzle(process.env.DATABASE_URL!, { schema });
