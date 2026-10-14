import type { ConfigIn } from "@/config/schema"

export default {
  listen: {
    host: "127.0.0.1",
    port: 4000,
  },
  origin: "http://bakeoff.pompy-dev.uk",
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
    url: "postgresql://bakeoff:bakeoff@localhost:5432/bakeoff?schema=public"
  }
} satisfies ConfigIn
