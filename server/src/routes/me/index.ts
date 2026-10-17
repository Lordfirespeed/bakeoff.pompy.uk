import { App } from "@otterhttp/app";

import { authenticate } from "@/middleware/authenticate";
import { forbiddenOrUnauthorised } from "@/middleware/forbidden-or-unauthorised";
import { methodNotAllowed } from "@/middleware/method-not-allowed";
import type { Request, Response } from "@/types/middleware";

import { meHandlers } from "./me-handlers";

export const meApp = new App<Request, Response>();

meApp
  .route("/")
  .all(methodNotAllowed(["GET"]))
  .all(authenticate())
  .get(meHandlers.getMe())
  .all(forbiddenOrUnauthorised());
