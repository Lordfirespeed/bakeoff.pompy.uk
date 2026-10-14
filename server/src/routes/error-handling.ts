import type { NextFunction } from "@otterhttp/app"
import { ClientError, HttpError, HttpStatus, ServerError } from "@otterhttp/errors"
import { isStructuredError } from "@prisma/orm-postgres/utils/structured-error"
import { ZodError } from "zod/v4"


import { sendHttpErrorResponse, sendZodErrorResponse } from "@/lib/error-responses"
import type { Request, Response } from "@/types/middleware"

export function apiErrorHandler(error: Error, _request: Request, response: Response, next: NextFunction) {
  if (response.headersSent) {
    return next(error)
  }

  if (error instanceof HttpError) {
    return sendHttpErrorResponse(response, error)
  }

  if (error instanceof ZodError) {
    return sendZodErrorResponse(response, error)
  }

  if (isStructuredError(error)) {
    // handle prisma errors here ...
  }

  if (Object.hasOwn(error, "sqlState")) {
    console.error(error)

    const httpError = new ClientError("Database returned an error.", {
      statusCode: HttpStatus.InternalServerError,
    })
    return sendHttpErrorResponse(response, httpError)
  }

  console.error("Unexpected API error:")
  console.error(error.stack)
  return sendHttpErrorResponse(response, new ServerError())
}
