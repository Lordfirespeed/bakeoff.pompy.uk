import session, {
  type Session,
  type SessionData,
  type SessionStore,
} from "@otterhttp/session";
import { eq } from "drizzle-orm";

import { sessionConfig } from "@/config";
import { drizzle, sessionRecords } from "@/db";
import { signCookie, unsignCookieOrThrow } from "@/lib/cookies";
import type { JSONLiteral } from "@/types/json-literal";

const { cookie: cookieOptions, ...sessionOptions } = sessionConfig;

class DrizzleSessionStore implements SessionStore {
  async destroy(sid: string): Promise<void> {
    await drizzle.delete(sessionRecords).where(eq(sessionRecords.id, sid));
  }

  async get(sid: string): Promise<SessionData | null> {
    const sessionRecord = await drizzle.query.sessionRecords.findFirst({
      where: { id: sid },
    });
    if (!sessionRecord) return null;
    const sessionData = sessionRecord.data as SessionData | null;
    if (sessionData == null) return null;
    if (
      sessionData.cookie.expires &&
      sessionData.cookie.expires.getTime() <= Date.now()
    ) {
      await this.destroy(sid);
      return null;
    }
    return sessionData;
  }

  async set(
    sid: string,
    sess: SessionData<Record<string, JSONLiteral>> & {
      userId: number;
    },
  ): Promise<void> {
    await drizzle
      .insert(sessionRecords)
      .values({
        id: sid,
        userId: sess.userId ?? null,
        expiresAt: sess.cookie.expires,
        data: sess,
      })
      .onConflictDoUpdate({
        target: sessionRecords.id,
        set: {
          userId: sess.userId ?? null,
          expiresAt: sess.cookie.expires,
          data: sess,
        },
      });
  }

  async touch(sid: string, sess: SessionData): Promise<void> {
    await drizzle
      .update(sessionRecords)
      .set({
        expiresAt: sess.cookie.expires,
      })
      .where(eq(sessionRecords.id, sid));
  }
}

export type BakeoffSessionRecord = Record<string, unknown> & {
  providerOAuth2FlowCodeVerifier?: string | undefined;
  providerOAuth2FlowState?: string | undefined;
  identityProvider?: string | undefined;
  userId?: number | undefined;
  redirectTo?: string | undefined;
};

export type { Session };
export type BakeoffSession = Session<BakeoffSessionRecord>;

export const getSession = session<BakeoffSessionRecord>({
  store: new DrizzleSessionStore(),
  ...sessionOptions,
  cookie: {
    ...cookieOptions,
    sign: signCookie,
    unsign: unsignCookieOrThrow,
  },
});
