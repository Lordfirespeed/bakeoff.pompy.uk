import { drizzle } from "drizzle-orm/node-postgres";
import { dbConfig } from "@/config";

import { relations } from "./schema";

export const db = drizzle(dbConfig.url, { relations });
