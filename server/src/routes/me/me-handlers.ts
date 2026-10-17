import assert from "node:assert/strict";

import { onlyKnownUsers } from "@/decorators/authorise";
import type { Middleware } from "@/types/middleware";

class MeHandlers {
  @onlyKnownUsers()
  getMe(): Middleware {
    return async (request, response) => {
      assert(request.user);
      assert(request.userProfile);

      const payload = {
        id: request.user.id,
        email: request.userProfile.email,
        username: request.userProfile.preferred_username,
        roles: request.roles,
      };

      response.status(200);
      response.json({ data: payload });
    };
  }
}

const meHandlers = new MeHandlers();

export { meHandlers };
