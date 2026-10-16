import { defineRelations } from "drizzle-orm";
import {
  integer,
  json,
  pgTable,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

const string = () => varchar({ length: 255 });

export const users = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  preferred_username: string().notNull(),
  email: string().notNull().unique(),
});

export const tokenSets = pgTable("tokenSets", {
  userId: integer().primaryKey(),
  tokenType: string(),
  accessToken: string(),
  idToken: string(),
  refreshToken: string(),
  scope: string(),
  accessExpiry: timestamp({ withTimezone: false }),
  sessionState: string(),
});

export const sessionRecords = pgTable("sessionRecords", {
  id: string(),
  userId: integer(),
  data: json().notNull(),
  expiresAt: timestamp(),
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp()
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

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
