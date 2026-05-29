import type { PublicTournamentGroupsData } from "../championshipResultsActions"
import PrintTargetGroupCard from "./PrintTargetGroupCard"

function PrintRangeSection({
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
        <section className="print-range-section">
            <h3 className="print-range-section__heading">{heading}</h3>
            {unassigned.length > 0 ? (
                <p className="print-range-section__unassigned">
                    Unassigned ({unassigned.length}):{" "}
                    {unassigned
                        .map((participant) => {
                            const num =
                                participant.competitorNumber !== null
                                    ? `#${participant.competitorNumber} `
                                    : ""
                            return `${num}${participant.name}`
                        })
                        .join(" · ")}
                </p>
            ) : null}
            {assignedGroups.length > 0 ? (
                <div className="print-target-groups-grid">
                    {assignedGroups.map((group) => (
                        <PrintTargetGroupCard key={group.groupNumber} group={group} />
                    ))}
                </div>
            ) : (
                <p className="print-range-section__empty">No group assignments yet.</p>
            )}
        </section>
    )
}

export default function PrintDayGroupAllocations({
    dayOrder,
    rounds,
    groupsByTournamentId,
}: {
    dayOrder: number
    rounds: {
        dayOrder: number
        rangeNumber: number
        tournamentId: string
        tournamentName: string
    }[]
    groupsByTournamentId: Record<string, PublicTournamentGroupsData>
}) {
    const dayRounds = rounds.filter((round) => round.dayOrder === dayOrder)

    return (
        <div className="print-day-allocations">
            {dayRounds.map((round) => {
                const groupsData = groupsByTournamentId[round.tournamentId]
                if (!groupsData) {
                    return null
                }

                return (
                    <PrintRangeSection
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
