import { ServerError } from "@otterhttp/errors";
import { drizzle } from "@/db";
import { isString } from "@/lib/type-guards";

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
    where: { key: "voting_status" },
  });
  if (votingStatus == null) return "not-started";
  if (!isVotingStatus(votingStatus.value))
    throw new ServerError("voting status is corrupt", {
      code: "ERR_VOTING_STATUS_CORRUPT",
    });
  return votingStatus.value;
}
