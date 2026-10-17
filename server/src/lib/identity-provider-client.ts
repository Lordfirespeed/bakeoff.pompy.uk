import { type Configuration, discovery } from "openid-client";

import { oidcConfig } from "@/config";

export const issuerConfigs: Map<string, Configuration> = new Map();
issuerConfigs.set(
  oidcConfig.issuerSlug,
  await discovery(
    oidcConfig.issuerUrl,
    oidcConfig.clientId,
    oidcConfig.clientSecret,
  ),
);
