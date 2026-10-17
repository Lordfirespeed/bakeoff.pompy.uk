import { App } from "@otterhttp/app";

import { origin } from "@/config";
import { methodNotAllowed } from "@/middleware/method-not-allowed";
import { serveStaticJson } from "@/middleware/serve-static-json";

import type { Request, Response } from "@/types/middleware";

import { authApp } from "./auth";

export const routesApp = new App<Request, Response>();

routesApp
  .route("/")
  .all(methodNotAllowed(["GET"]))
  .get(
    serveStaticJson({
      auth_url: new URL("/api/auth", origin).href,
      you_url: new URL("/api/me", origin).href,
    }),
  );

routesApp.use("/auth", authApp);
