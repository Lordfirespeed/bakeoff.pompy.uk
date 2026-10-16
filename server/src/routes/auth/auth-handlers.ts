import assert from "node:assert/strict";
import { ClientError } from "@otterhttp/errors";
import * as client from "openid-client";

import { origin } from "@/config";
import { getSession } from "@/lib/session";
import type { Middleware, Request, Response } from "@/types/middleware";
import {issuerConfig} from "@/lib/identity-provider-client";

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
    return async (request, response) => {
      if (request.user == null) {
        await response.redirect(origin.href)
        return
      }

      const session = await getSession(request, response)
      session.userId = undefined
      session.identityProvider = undefined
      await session.commit()

      if (request.userTokenSet?.idToken == null) {
        await response.redirect(origin.href)
        return
      }

      // the identity provider is known based off the tokenSet
      const endSessionUrl = client.buildEndSessionUrl(issuerConfig, {
        id_token_hint: request.userTokenSet?.idToken,
        post_logout_redirect_uri: origin.href,
      })
      await response.redirect(endSessionUrl.href)
      return
    };
  }

  beginOAuth2Flow(): Middleware {
    return async (request, response) => {};
  }

  oauth2FlowCallback(): Middleware {
    return async (request, response) => {};
  }
}

export const authHandlers = new AuthHandlers();
