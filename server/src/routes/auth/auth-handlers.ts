import assert from "node:assert/strict";
import { ClientError } from "@otterhttp/errors";
import * as client from "openid-client";

import { origin } from "@/config";
import { issuerConfigs } from "@/lib/identity-provider-client";
import { getSession } from "@/lib/session";
import { isString } from "@/lib/type-guards";
import type { Middleware, Request, Response } from "@/types/middleware";

export class AuthHandlers {
  static loginPageUrl = new URL("/login", origin).href;
  static defaultPostLoginRedirect = new URL("/vote", origin).href;

  validateIdentityProvider(): Middleware {
    return async (request, _response, next) => {
      const identityProviderSlug = request.params.slug;
      if (isString(identityProviderSlug) && issuerConfigs.has(identityProviderSlug)) return next();

      throw new ClientError(
        `Identity provider '${identityProviderSlug}' not recognised`,
        {
          exposeMessage: true,
          statusCode: 404,
          code: "ERR_IDENTITY_PROVIDER_NOT_FOUND",
        },
      );
    };
  }

  getIdentityProviderConfig(request: Request, _response: Response): client.Configuration {
    const identityProviderSlug = request.params.slug;
    assert(identityProviderSlug != null)
    const identityProvider = issuerConfigs.get(identityProviderSlug)
    assert(identityProvider != null)
    return identityProvider
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
        await response.redirect(origin.href);
        return;
      }

      const session = await getSession(request, response);
      session.userId = undefined;
      session.identityProvider = undefined;
      await session.commit();

      if (request.userTokenSet?.idToken == null) {
        await response.redirect(origin.href);
        return;
      }

      // the identity provider is known based off the tokenSet
      const issuerConfig = issuerConfigs.get(request.userTokenSet.identityProvider)
      assert(issuerConfig != null)
      const endSessionUrl = client.buildEndSessionUrl(issuerConfig, {
        id_token_hint: request.userTokenSet?.idToken,
        post_logout_redirect_uri: origin.href,
      });
      await response.redirect(endSessionUrl.href);
      return;
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
