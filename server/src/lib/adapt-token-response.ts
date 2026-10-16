import type { TokenEndpointResponse } from "openid-client"

import type { TokenSet as DbTokenSet } from "@/db/schema"

export function adaptTokenResponseToDatabase(providerSlug: string, response: TokenEndpointResponse): Omit<DbTokenSet, "userId"> {
  let expires_at: Date | null = null;
  if (response.expires_in != null) {
    expires_at = new Date();
    expires_at.setUTCSeconds(expires_at.getUTCSeconds() + response.expires_in)
  }
  return {
    identityProvider: providerSlug,
    tokenType: response.token_type ?? null,
    accessToken: response.access_token ?? null,
    idToken: response.id_token ?? null,
    refreshToken: response.refresh_token ?? null,
    scope: response.scope ?? null,
    accessExpiry: expires_at,
  }
}
