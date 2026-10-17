import type { ConfigIn } from "@/config/schema";

export default {
  listen: {
    host: "127.0.0.1",
    port: 4000,
  },
  origin: "https://bakeoff.pompy-dev.uk",
  session: {
    cookie: {
      name: "bakeoff-session",
      domain: "bakeoff.pompy-dev.uk",
      secure: false,
      path: "/",
      sameSite: "lax",
    },
  },
  cookieSigning: {
    secret: "cookie_signing_secret",
  },
  db: {
    url: "postgresql://bakeoff:bakeoff@localhost:5432/bakeoff?schema=public",
  },
  oidc: {
    issuerSlug: "twitch",
    issuerUrl: "https://id.twitch.tv/oauth2",
    clientId: "not-a-real-client-id",
    clientSecret: "not-a-real-client-secret",
    scopes: ["openid", "user:read:email"],
  },
  bakeoff: {
    adminUsernames: new Set(["pompyhq", "lordfirespeed"]),
    bakerUsernames: new Set([
      "eziverse",
      "theunfittingkey",
      "galdurprice",
      "elliednc",
      "bubblypeachie",
      "annadalehaven",
      "lavendorra",
      "velsiraptor",
      "nate_the_pathfinder",
      "elisasnows",
      "erinsfunnybusiness",
    ]),
    judgeUsernames: new Set(["pompyhq"]),
  },
} satisfies ConfigIn;
