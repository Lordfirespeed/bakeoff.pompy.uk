import { defineRelations } from "drizzle-orm";
import {
  foreignKey,
  integer,
  json,
  pgTable,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

const string = (name: string) => varchar(name, { length: 255 });

export const users = pgTable("users", {
  id: integer("user_id").primaryKey().generatedAlwaysAsIdentity(),
  username: string("username").notNull(),
  email: string("email").notNull().unique(),
});
export type User = typeof users.$inferSelect;

export const tokenSets = pgTable(
  "token_sets",
  {
    userId: integer("user_id").primaryKey(),
    tokenType: string("token_type"),
    accessToken: string("access_token"),
    idToken: string("id_token"),
    refreshToken: string("refresh_token"),
    scope: string("scope"),
    accessExpiry: timestamp("access_expires_at", { withTimezone: false }),
    sessionState: string("session_state"),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "token_set_user_fk",
    }),
  ],
);
export type TokenSet = typeof tokenSets.$inferSelect;

export const sessionRecords = pgTable(
  "session_records",
  {
    id: string("session_record_id").primaryKey(),
    userId: integer("user_id"),
    data: json("data").notNull(),
    expiresAt: timestamp("expires_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "session_record_user_fk",
    }),
  ],
);
export type SessionRecord = typeof sessionRecords.$inferSelect;

export const relations = defineRelations(
  {
    users,
    tokenSets,
    sessionRecords,
  },
  (r) => ({
    tokenSets: {
      user: r.one.users({
        from: r.tokenSets.userId,
        to: r.users.id,
      }),
    },
    sessionRecords: {
      user: r.one.users({
        from: r.sessionRecords.userId,
        to: r.users.id,
      }),
    },
  }),
);
