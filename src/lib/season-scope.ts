const DIRECT_MODELS = new Set(["Team", "Player", "Match", "Sanction", "PointAdjustment", "Video", "News", "LeagueRegistration"]);
const MATCH_MODELS = new Set(["MatchGoal", "MatchCard", "MatchParticipation", "Prediction"]);
export const READ_OPERATIONS = new Set(["findMany", "findFirst", "findFirstOrThrow", "findUnique", "findUniqueOrThrow", "count", "aggregate", "groupBy"]);
const FILTER_OPERATIONS = new Set([...READ_OPERATIONS, "update", "updateMany", "updateManyAndReturn", "delete", "deleteMany", "upsert"]);
export function scopeLeagueArgs(model: string, operation: string, args: Record<string, unknown>, seasonId: string): Record<string, unknown> {
  const direct = DIRECT_MODELS.has(model);
  if (!direct && !MATCH_MODELS.has(model)) return args;
  const result = { ...args };
  if (FILTER_OPERATIONS.has(operation)) {
    const where = (args.where ?? {}) as Record<string, unknown>;
    const condition = direct ? { seasonId } : { match: { seasonId } };
    // Preserve the unique key at top level for findUnique/update/delete.
    const previous = where.AND ? (Array.isArray(where.AND) ? where.AND : [where.AND]) : [];
    result.where = { ...where, AND: [...previous, condition] };
  }
  if (direct && operation === "create") result.data = { ...(args.data as object), seasonId };
  if (direct && (operation === "createMany" || operation === "createManyAndReturn")) {
    const data = Array.isArray(args.data) ? args.data : [args.data];
    result.data = data.map(row => ({ ...row, seasonId }));
  }
  if (direct && operation === "upsert") result.create = { ...(args.create as object), seasonId };
  return result;
}
export function isLeagueModel(model: string) { return DIRECT_MODELS.has(model) || MATCH_MODELS.has(model); }
