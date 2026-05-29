import type { PublicChampionshipTournamentRef, PublicTournamentGroupsData } from "../championshipResultsActions"
import PublicGroupCard from "./PublicGroupCard"
import PublicUnassignedParticipants from "./PublicUnassignedParticipants"
import { groupGridColsClassName } from "@/lib/groupGridCols"

function DayGroupCard({
    heading,
    groups,
    unassigned,
}: {
    heading: string
    groups: PublicTournamentGroupsData["groups"]
    unassigned: PublicTournamentGroupsData["unassigned"]
}) {
    const assignedGroups = groups.filter((group) => group.participants.length > 0)

    return (
        <div className="card bg-base-100 border border-base-300">
            <div className="card-body gap-4">
                <h3 className="card-title text-base">{heading}</h3>
                <PublicUnassignedParticipants participants={unassigned} />
                {assignedGroups.length > 0 ? (
                    <div className={`grid ${groupGridColsClassName(assignedGroups.length)} gap-4`}>
                        {assignedGroups.map((group) => (
                            <PublicGroupCard key={group.groupNumber} group={group} />
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-base-content/60">No group assignments yet.</p>
                )}
            </div>
        </div>
    )
}

export default function PublicDayGroupAllocations({
    dayOrder,
    rounds,
    groupsByTournamentId,
}: {
    dayOrder: number
    rounds: PublicChampionshipTournamentRef[]
    groupsByTournamentId: Record<string, PublicTournamentGroupsData>
}) {
    const dayRounds = rounds.filter((round) => round.dayOrder === dayOrder)

    return (
        <div className="space-y-3">
            {dayRounds.map((round) => {
                const groupsData = groupsByTournamentId[round.tournamentId]
                if (!groupsData) {
                    return null
                }

                return (
                    <DayGroupCard
                        key={round.tournamentId}
                        heading={`Range ${round.rangeNumber} — ${round.tournamentName}`}
                        groups={groupsData.groups}
                        unassigned={groupsData.unassigned}
                    />
                )
            })}
        </div>
    )
}
