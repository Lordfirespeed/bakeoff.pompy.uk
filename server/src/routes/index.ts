import { App } from "@otterhttp/app"

import { origin } from "@/config"
import { methodNotAllowed } from "@/middleware/method-not-allowed"
import { serveStaticJson } from "@/middleware/serve-static-json"

import type { Request, Response } from "@/types/middleware"

export const routesApp = new App<Request, Response>()

routesApp
  .route("/")
  .all(methodNotAllowed(["GET"]))
  .get(
    serveStaticJson({
      you_url: new URL("/user", origin).href,
    })
  )
