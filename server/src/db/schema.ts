import { defineRelations } from "drizzle-orm";
import { integer, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

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

export const relations = defineRelations({ users, tokenSets }, (r) => ({
  tokenSets: {
    user: r.one.users({
      from: r.tokenSets.userId,
      to: r.users.id,
    }),
  },
}));
