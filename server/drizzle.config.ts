import { defineConfig } from "drizzle-kit"
import { dbConfig } from "@/config"

export default defineConfig({
  out: "./drizzle",
  schema: "./src/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: dbConfig.url,
  },
})
