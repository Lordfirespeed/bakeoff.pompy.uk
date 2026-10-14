import type { ConfigIn } from "@/config/schema"
import type { DeepPartial } from "@/types/deep-partial"

export default {
  origin: "https://bakeoff.pompy.uk",
  session: {
    cookie: {
      name: "__Secure-bakeoff-session",
      secure: true,
      /**
       * We have to use 'lax' because OAuth2 flow doesn't work with 'strict', it relies on
       * session cookies being sent when redirected back to the app from the authentication provider.
       *
       * We could try to do something clever:
       *  1. set sameSite "lax" on OAuth2 flow init
       *  2. upgrade to sameSite "strict" on OAuth2 flow callback
       *
       * The only problem with 'lax' is that it allows cross-site attacks.
       */
      sameSite: "lax",
      domain: ".durhack.com",
    },
  },
} satisfies DeepPartial<ConfigIn>
