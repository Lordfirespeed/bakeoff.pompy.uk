import { z } from "zod/v4";

export const listenOptionsSchema = z.object({
  host: z.string(),
  port: z.number().int().positive(),
});

export const cookieOptionsSchema = z.object({
  sameSite: z
    .union([z.literal("none"), z.literal("lax"), z.literal("strict")])
    .optional(),
  path: z.string().optional(),
  secure: z.boolean(),
  domain: z.string().optional(),
});

export const cookieSigningOptionsSchema = z.object({
  secret: z.string(),
});

export const sessionOptionsSchema = z.object({
  cookie: cookieOptionsSchema.extend({
    name: z.string().optional(),
  }),
});

export const dbOptionsSchema = z.object({
  url: z.url().transform((value) => new URL(value)),
});

export const oidcOptionsSchema = z.object({
  issuerSlug: z.string(),
  issuerUrl: z.url().transform((value) => new URL(value)),
  clientId: z.string(),
  clientSecret: z.string(),
});

export const configSchema = z.object({
  listen: listenOptionsSchema,
  origin: z.url().transform((value) => new URL(value)),
  session: sessionOptionsSchema,
  cookieSigning: cookieSigningOptionsSchema,
  db: dbOptionsSchema,
  oidc: oidcOptionsSchema,
});

export type Config = z.infer<typeof configSchema>;
export type ConfigIn = z.input<typeof configSchema>;
