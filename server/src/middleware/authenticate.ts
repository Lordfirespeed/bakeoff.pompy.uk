import assert from "node:assert/strict";
import { ServerError } from "@otterhttp/errors";
import { and, eq } from "drizzle-orm";
import { validateJwtIdToken } from "oauth4webapi";
import * as client from "openid-client";

import { drizzle, tokenSets } from "@/db";
import type { TokenSet as DbTokenSet } from "@/db/schema";
import { adaptTokenResponseToDatabase } from "@/lib/adapt-token-response";
import { issuerConfigs } from "@/lib/identity-provider-client";
import { isNetworkError } from "@/lib/is-network-error";
import { getSession } from "@/lib/session";
import type { Middleware, Request } from "@/types/middleware";

/**
 * Returns a middleware which assigns {@link Request.user}, {@link Request.userTokenSet} and {@link Request.userProfile}
 * for requests that include appropriate valid credentials.
 *
 * This middleware is pass-through and performs no authorisation - it will always invoke <code>next</code> provided
 * that no unexpected error occurs.
 *
 * 'Appropriate valid credentials' in this context consist of a session cookie meeting the following conditions:
 *  - the session cookie's associated session record must have a <code>userId</code> member
 *  - a user with the session record's <code>userId</code> must exist in persistent storage (the database)
 *  - the user must have an associated token set in persistent storage
 *  - if the set's access token has expired, Keycloak must accept the set's refresh token in exchange for a
 *    fresh token set
 *  - Keycloak must accept the (potentially refreshed) token set's access token as credentials for its
 *    OpenID Connect <code>userinfo</code> endpoint
 */
export function authenticate(): Middleware {
  return async (request, response, next) => {
    const session = await getSession(request, response);
    if (session.userId == null) return next();
    assert(session.identityProvider != null);
    const issuerConfig = issuerConfigs.get(session.identityProvider);
    assert(issuerConfig != null);

    const user = await drizzle.query.users.findFirst({
      where: { id: session.userId },
      with: {
        tokenSets: { where: { identityProvider: session.identityProvider } },
      },
    });
    let tokenSet: Omit<DbTokenSet, "userId"> | undefined = user?.tokenSets[0];

    if (user == null || tokenSet == null) {
      session.userId = undefined;
      session.identityProvider = undefined;
      await session.commit();
      return next();
    }

    const tokenSetExpired =
      tokenSet.accessExpiry == null || tokenSet.accessExpiry <= new Date();
    if (tokenSetExpired && tokenSet.refreshToken != null) {
      try {
        const response = await client.refreshTokenGrant(
          issuerConfig,
          tokenSet.refreshToken,
        );
        tokenSet = adaptTokenResponseToDatabase(
          session.identityProvider,
          response,
        );
        await drizzle
          .update(tokenSets)
          .set(tokenSet)
          .where(
            and(
              eq(tokenSets.userId, user.id),
              eq(tokenSets.identityProvider, session.identityProvider),
            ),
          );
      } catch (error) {
        if (isNetworkError(error)) {
          throw new ServerError(
            "Encountered network error while attempting to refresh a token set",
            {
              statusCode: 500,
              exposeMessage: false,
              cause: error,
            },
          );
        }
      }
    }

    // if the token set is still expired, the user needs to log in again
    if (tokenSetExpired || tokenSet.accessToken == null) {
      session.userId = undefined;
      session.identityProvider = undefined;
      await session.commit();
      return next();
    }

    assert(tokenSet.idToken != null);
    const claims = await validateJwtIdToken(
      issuerConfig.serverMetadata(),
      issuerConfig.clientMetadata(),
      tokenSet.idToken,
      {},
    );

    // use the token set to get the user profile
    let profile: client.UserInfoResponse | undefined;
    try {
      profile = await client.fetchUserInfo(
        issuerConfig,
        tokenSet.accessToken,
        claims.sub,
      );
    } catch (error) {
      if (isNetworkError(error)) {
        throw new ServerError(
          "Encountered network error while attempting to fetch profile info",
          {
            statusCode: 500,
            exposeMessage: false,
            cause: error,
          },
        );
      }

      assert(error instanceof Error);
      console.error(
        `Failed to fetch profile info for ${user.username}: ${error.stack}`,
      );

      // if the access token is rejected, the user needs to log in again
      session.userId = undefined;
      session.identityProvider = undefined;
      await session.commit();
      return next();
    }

    request.userProfile = profile;
    request.userTokenSet = tokenSet;
    request.user = user;
    next();
  };
}
