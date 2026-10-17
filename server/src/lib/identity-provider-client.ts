import { type Configuration, discovery } from "openid-client";

import { oidcConfig } from "@/config";

type Issuer = {
  slug: string;
  scopes: string[];
  clientConfig: Configuration;
}

export const issuerConfigs: Map<string, Issuer> = new Map();
issuerConfigs.set(
  oidcConfig.issuerSlug,
  {
    slug: oidcConfig.issuerSlug,
    scopes: oidcConfig.scopes,
    clientConfig: await discovery(
      oidcConfig.issuerUrl,
      oidcConfig.clientId,
      oidcConfig.clientSecret,
    ),
  }
);
