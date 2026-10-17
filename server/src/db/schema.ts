import { defineRelations } from "drizzle-orm";
import {
  foreignKey,
  integer,
  json,
  pgTable,
  primaryKey,
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
    userId: integer("user_id").notNull(),
    identityProvider: string("identity_provider").notNull(),
    tokenType: string("token_type"),
    accessToken: string("access_token"),
    idToken: varchar("id_token", { length: 1024 }),
    refreshToken: string("refresh_token"),
    scope: string("scope"),
    accessExpiry: timestamp("access_expires_at", { withTimezone: false }),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.identityProvider] }),
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
    users: {
      tokenSets: r.many.tokenSets(),
      sessions: r.many.sessionRecords(),
    },
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
