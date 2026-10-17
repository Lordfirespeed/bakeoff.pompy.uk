import { App } from "@otterhttp/app";

import { origin } from "@/config";
import { authenticate } from "@/middleware/authenticate";
import { methodNotAllowed } from "@/middleware/method-not-allowed";
import { serveStaticJson } from "@/middleware/serve-static-json";
import type { Request, Response } from "@/types/middleware";

import { authHandlers } from "./auth-handlers";

const authApp = new App<Request, Response>();

authApp
  .route("/")
  .all(methodNotAllowed(["GET"]))
  .get(
    serveStaticJson({
      twitch_auth_url: new URL("/api/auth/twitch", origin).href,
      logout_url: new URL("/api/auth/logout", origin).href,
    }),
  );

authApp
  .route("/logout")
  .all(methodNotAllowed(["GET"]))
  .all(authenticate())
  .get(authHandlers.logout());


authApp
  .route("/:slug/")
  .all(methodNotAllowed(["GET"]))
  .all(authHandlers.validateIdentityProvider())
  .get(async (request, response) => {
    response.json({
      login_url: new URL(`${request.pathnameWithoutTrailingSlash}/login`, origin).href,
      callback_url: new URL(`${request.pathnameWithoutTrailingSlash}/callback`, origin).href,
    })
  });

authApp
  .route("/:slug/login")
  .all(methodNotAllowed(["GET"]))
  .all(authHandlers.validateIdentityProvider())
  .get(authHandlers.beginOAuth2Flow());

authApp
  .route("/:slug/callback")
  .all(methodNotAllowed(["GET"]))
  .all(authHandlers.validateIdentityProvider())
  .get(authHandlers.oauth2FlowCallback())
  .get(authHandlers.loginSuccess());

export { authApp };
