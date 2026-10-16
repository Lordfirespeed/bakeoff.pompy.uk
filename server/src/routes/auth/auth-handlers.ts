import { ClientError } from "@otterhttp/errors";

import { origin } from "@/config";
import { getSession } from "@/lib/session";
import type { Middleware, Request, Response } from "@/types/middleware";

export class AuthHandlers {
  static loginPageUrl = new URL("/login", origin).href;
  static defaultPostLoginRedirect = new URL("/vote", origin).href;

  validateIdentityProvider(): Middleware {
    return async (request, _response, next) => {
      const identityProvider = request.params.slug;
      if (identityProvider === "twitch") return next();

      throw new ClientError(
        `Identity provider '${identityProvider}' not recognised`,
        {
          exposeMessage: true,
          statusCode: 404,
          code: "ERR_IDENTITY_PROVIDER_NOT_FOUND",
        },
      );
    };
  }

  loginSuccess(): Middleware {
    return async (request: Request, response: Response) => {
      if (request.user == null) {
        return response.redirect(AuthHandlers.loginPageUrl);
      }

      const session = await getSession(request, response);
      if (session.redirectTo == null) {
        return await response.redirect(AuthHandlers.defaultPostLoginRedirect);
      }

      try {
        await response.redirect(session.redirectTo);
      } finally {
        session.redirectTo = undefined;
        await session.commit();
      }
      return;
    };
  }

  logout(): Middleware {
    return async (request, response) => {};
  }

  beginOAuth2Flow(): Middleware {
    return async (request, response) => {};
  }

  oauth2FlowCallback(): Middleware {
    return async (request, response) => {};
  }
}

export const authHandlers = new AuthHandlers();
