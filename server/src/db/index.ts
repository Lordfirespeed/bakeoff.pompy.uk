import { drizzle as drizzleFactory } from "drizzle-orm/node-postgres";
import { dbConfig } from "@/config";

import { relations } from "./schema";

export const drizzle = drizzleFactory(dbConfig.url, { relations });
