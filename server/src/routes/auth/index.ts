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
      twitch_auth_url: new URL("/auth/twitch", origin).href,
    }),
  );

authApp
  .route("/:slug/")
  .all(methodNotAllowed(["GET"]))
  .get(async (request, response) => {
    console.log(request.params);
    response.sendStatus(200);
  });

authApp
  .route("/:slug/login")
  .all(methodNotAllowed(["GET"]))
  .get(authHandlers.beginOAuth2Flow());

authApp
  .route("/:slug/callback")
  .all(methodNotAllowed(["GET"]))
  .get(authHandlers.oauth2FlowCallback())
  .get(authHandlers.loginSuccess());

authApp
  .route("/logout")
  .all(methodNotAllowed(["GET"]))
  .all(authenticate)
  .get(authHandlers.logout());

export { authApp };
