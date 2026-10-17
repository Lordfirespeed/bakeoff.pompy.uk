import { ServerError } from "@otterhttp/errors";
import { eq } from "drizzle-orm";
import { drizzle } from "@/db";
import { state } from "@/db/schema";
import { isString } from "@/lib/type-guards";

const VOTING_STATUS_STATE_KEY = "voting_status";

const validVotingStatusValues = [
  "not-started",
  "open",
  "paused",
  "ended",
] as const;
const validVotingStatusValueSet: Set<string> = new Set(validVotingStatusValues);
type VotingStatus = (typeof validVotingStatusValues)[number];
function isVotingStatus(value: unknown): value is VotingStatus {
  if (!isString(value)) return false;
  return validVotingStatusValueSet.has(value);
}

export async function getVotingStatus(): Promise<VotingStatus> {
  const votingStatus = await drizzle.query.state.findFirst({
    where: { key: VOTING_STATUS_STATE_KEY },
  });
  if (votingStatus == null) return "not-started";
  if (!isVotingStatus(votingStatus.value))
    throw new ServerError("voting status is corrupt", {
      code: "ERR_VOTING_STATUS_CORRUPT",
    });
  return votingStatus.value;
}

export async function setVotingStatus(newStatus: VotingStatus) {
  await drizzle
    .update(state)
    .set({ value: newStatus })
    .where(eq(state.key, VOTING_STATUS_STATE_KEY));
}
