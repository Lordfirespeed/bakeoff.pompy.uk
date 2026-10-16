import { type Configuration, discovery } from "openid-client";

import { oidcConfig } from "@/config";

export const issuerConfig: Configuration = await discovery(
  oidcConfig.issuerUrl,
  oidcConfig.clientId,
  oidcConfig.clientSecret,
);
