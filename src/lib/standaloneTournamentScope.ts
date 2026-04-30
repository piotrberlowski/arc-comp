import type { Prisma } from "@/generated/prisma/client"

/** Tournaments that are not a championship day (ADR M3 default list guardrail). */
export const standaloneTournamentWhere: Prisma.TournamentWhereInput = {
    championshipRound: { is: null },
}
