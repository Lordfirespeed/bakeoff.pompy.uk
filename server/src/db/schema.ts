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

export const bakers = pgTable(
  "bakers",
  {
    userId: integer("user_id").primaryKey(),
    bakerName: string("baker_name").notNull().unique(),
    bakerUrl: string("baker_url").notNull(),
    bakerImageUrl: string("baker_image_url").notNull(),
    bakerDescription: varchar("baker_description", { length: 2048 }).notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "baker_user_fk",
    }),
  ],
);
export type Baker = typeof bakers.$inferSelect;

export const bakes = pgTable(
  "bakes",
  {
    id: integer("bake_id").primaryKey().generatedAlwaysAsIdentity(),
    bakeTitle: string("bake_title").notNull(),
    bakerId: integer("baker_id").notNull(),
    bakeImageUrl: string("bake_image_url").notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.bakerId],
      foreignColumns: [bakers.userId],
      name: "bake_baker_fk",
    }),
  ],
);
export type Bake = typeof bakes.$inferSelect;

export const votes = pgTable("votes", {
  userId: integer("user_id").primaryKey(),
  bakeRanking: integer("bake_ranking").array().notNull(),
});
export type Vote = typeof votes.$inferSelect;

export const relations = defineRelations(
  {
    users,
    tokenSets,
    sessionRecords,
    bakers,
    bakes,
    votes,
  },
  (r) => ({
    users: {
      tokenSets: r.many.tokenSets(),
      sessions: r.many.sessionRecords(),
      bakerProfile: r.one.bakers(),
      vote: r.one.votes(),
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
    bakers: {
      user: r.one.users({
        from: r.bakers.userId,
        to: r.users.id,
      }),
      bakes: r.many.bakes(),
    },
    bakes: {
      baker: r.one.bakers({
        from: r.bakes.bakerId,
        to: r.bakers.userId,
      }),
    },
    votes: {
      voter: r.one.users({
        from: r.votes.userId,
        to: r.users.id,
      }),
    },
  }),
);
