import { drizzle as drizzleFactory } from "drizzle-orm/node-postgres";
import { dbConfig } from "@/config";

import { relations, sessionRecords, tokenSets, users } from "./schema";

export { sessionRecords, tokenSets, users };
export const drizzle = drizzleFactory(dbConfig.url.href, { relations });
