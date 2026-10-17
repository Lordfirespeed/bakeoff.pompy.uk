import assert from "node:assert/strict";
import { ClientError } from "@otterhttp/errors";
import * as client from "openid-client";
import z from "zod/v4";
import { origin } from "@/config";
import { drizzle, tokenSets, users } from "@/db";
import { adaptTokenResponseToDatabase } from "@/lib/adapt-token-response";
import { issuers } from "@/lib/identity-provider-client";
import { type BakeoffSession, getSession } from "@/lib/session";
import { isBoolean, isString } from "@/lib/type-guards";
import type { Middleware, Request, Response } from "@/types/middleware";

export class AuthHandlers {
  static loginPageUrl = new URL("/login", origin).href;
  static defaultPostLoginRedirect = new URL("/vote", origin).href;

  static urlOriginIsTrusted(url: URL) {
    return url.origin === origin.origin;
  }

  static destinationUrlSchema = z
    .string()
    .transform((value, ctx) => {
      try {
        return new URL(value);
      } catch (_error) {
        ctx.issues.push({
          input: value,
          code: "invalid_format",
          format: "url",
          message: "Invalid url",
        });
        return z.NEVER;
      }
    })
    .refine((value) => AuthHandlers.urlOriginIsTrusted(value), {
      error: (issue) =>
        `Specified destination origin ${(issue.input as URL).origin} is not trusted`,
    });

  validateIdentityProvider(): Middleware {
    return async (request, _response, next) => {
      const identityProviderSlug = request.params.slug;
      if (isString(identityProviderSlug) && issuers.has(identityProviderSlug))
        return next();

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

  getIdentityProviderSlug(request: Request, _response: Response) {
    const identityProviderSlug = request.params.slug;
    assert(identityProviderSlug != null);
    return identityProviderSlug;
  }

  getIdentityProvider(request: Request, response: Response) {
    const identityProviderSlug = this.getIdentityProviderSlug(
      request,
      response,
    );
    const identityProvider = issuers.get(identityProviderSlug);
    assert(identityProvider != null);
    return identityProvider;
  }

  getIdentityProviderConfig(
    request: Request,
    response: Response,
  ): client.Configuration {
    return this.getIdentityProvider(request, response).clientConfig;
  }

  getIdentityProviderScope(request: Request, response: Response): string {
    return this.getIdentityProvider(request, response).scopes.join(" ");
  }

  /**
   * 'lazily' log out the user - don't call the identity provider logout endpoint.
   * Just remove the user ID from the user's session.
   *
   * It's important we do this before initiating the login flow because we want to downgrade the session cookie to
   * SameSite 'Lax' during the OAuth flow (not implemented yet -
   * requires https://github.com/OtterJS/otterhttp-session/issues/1).
   */
  lazyLogout(response: Response, session: BakeoffSession): void {
    if (session.userId == null) return;

    session.userId = undefined;
    response.sessionDirty = true;
  }

  getOrGenerateCodeVerifier(
    response: Response,
    session: BakeoffSession,
  ): string {
    if (isString(session.providerOAuth2FlowCodeVerifier))
      return session.providerOAuth2FlowCodeVerifier;

    const codeVerifier = client.randomPKCECodeVerifier();
    session.providerOAuth2FlowCodeVerifier = codeVerifier;
    response.sessionDirty = true;
    return codeVerifier;
  }

  generateState(response: Response, session: BakeoffSession): string {
    const state = client.randomState();
    session.providerOAuth2FlowState = state;
    response.sessionDirty = true;
    return state;
  }

  rememberDestination(
    request: Request,
    response: Response,
    session: BakeoffSession,
  ): void {
    const destination =
      request.query.destination != null
        ? AuthHandlers.destinationUrlSchema.parse(request.query.destination)
        : null;

    if (session.redirectTo == null && destination?.href == null) return;
    if (session.redirectTo === destination?.href) return;

    session.redirectTo = destination?.href;
    response.sessionDirty = true;
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
      const issuer = issuers.get(request.userTokenSet.identityProvider);
      assert(issuer != null);
      const endSessionUrl = client.buildEndSessionUrl(issuer.clientConfig, {
        id_token_hint: request.userTokenSet?.idToken,
        post_logout_redirect_uri: origin.href,
      });
      await response.redirect(endSessionUrl.href);
      return;
    };
  }

  beginOAuth2Flow(): Middleware {
    return async (request, response) => {
      const clientConfig = this.getIdentityProviderConfig(request, response);

      const parameters: Record<string, string> = {};
      const session = await getSession(request, response);
      this.rememberDestination(request, response, session);
      this.lazyLogout(response, session);
      const codeVerifier = this.getOrGenerateCodeVerifier(response, session);
      parameters.state = this.generateState(response, session);
      if (response.sessionDirty) await session.commit();

      parameters.redirect_uri = new URL(
        `/api/auth/${request.params.slug}/callback`,
        origin,
      ).href;
      parameters.scope = this.getIdentityProviderScope(request, response);
      parameters.code_challenge =
        await client.calculatePKCECodeChallenge(codeVerifier);
      parameters.code_challenge_method = "S256";
      parameters.claims = JSON.stringify({
        id_token: {
          email: null,
          email_verified: null,
          preferred_username: null,
        },
        userinfo: {
          email: null,
          email_verified: null,
          preferred_username: null,
        },
      });

      const url = client.buildAuthorizationUrl(clientConfig, parameters);
      await response.redirect(url.href);
    };
  }

  oauth2FlowCallback(): Middleware {
    return async (request, response, next) => {
      const session = await getSession(request, response);
      let codeVerifier: unknown;
      let state: unknown;
      try {
        codeVerifier = session.providerOAuth2FlowCodeVerifier;
        state = session.providerOAuth2FlowState;
        if (!isString(codeVerifier))
          throw new ClientError("OAuth2 code verifier not initialized", {
            statusCode: 400,
            exposeMessage: false,
          });
        if (!isString(state))
          throw new ClientError("OAuth2 'state' not initialized", {
            statusCode: 400,
            exposeMessage: false,
          });
      } finally {
        session.providerOAuth2FlowCodeVerifier = undefined;
        session.providerOAuth2FlowState = undefined;
        await session.commit();
      }

      const clientConfig = this.getIdentityProviderConfig(request, response);
      const tokens = await client.authorizationCodeGrant(
        clientConfig,
        new URL(request.href),
        {
          pkceCodeVerifier: codeVerifier,
          expectedState: state,
        },
      );

      const claims = tokens.claims();
      assert(claims != null);
      assert(isString(claims.preferred_username));
      assert(isString(claims.email));
      assert(isBoolean(claims.email_verified));
      if (claims.email_verified === false) {
        throw new ClientError("Account email address not verified", {
          statusCode: 400,
          code: "ERR_EMAIL_ADDRESS_NOT_VERIFIED",
          exposeMessage: true,
        });
      }
      const identityProviderSlug = this.getIdentityProviderSlug(
        request,
        response,
      );
      const serializedTokens = adaptTokenResponseToDatabase(
        identityProviderSlug,
        tokens,
      );

      let userId: number | undefined;
      await drizzle.transaction(async (tx) => {
        const [inserted, existing] = await Promise.all([
          tx
            .insert(users)
            .values({
              username: claims.preferred_username as string,
              email: claims.email as string,
            })
            .onConflictDoNothing()
            .returning({ id: users.id }),
          tx.query.users.findFirst({
            columns: { id: true },
            where: { email: claims.email as string },
          }),
        ]);
        userId = (inserted[0] ?? existing)?.id;
        assert(userId != null);

        await tx
          .insert(tokenSets)
          .values({ userId, ...serializedTokens })
          .onConflictDoUpdate({
            target: [tokenSets.userId, tokenSets.identityProvider],
            set: { ...serializedTokens },
          });
      });
      assert(userId != null);

      session.userId = userId;
      session.identityProvider = identityProviderSlug;
      await session.commit();
      request.user = { id: userId, email: claims.email as string };

      next();
    };
  }
}

export const authHandlers = new AuthHandlers();
