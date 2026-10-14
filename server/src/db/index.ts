import { dbConfig } from "@/config"
import { drizzle } from "drizzle-orm/node-postgres"

export const db = drizzle(dbConfig.url)
