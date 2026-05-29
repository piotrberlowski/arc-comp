import type { PublicTournamentGroup } from "../championshipResultsActions"

export default function PrintTargetGroupCard({ group }: { group: PublicTournamentGroup }) {
    return (
        <article className="print-target-group">
            <h4 className="print-target-group__title">Target {group.groupNumber}</h4>
            <ul className="print-target-group__list">
                {group.participants.map((participant) => (
                    <li key={participant.id}>
                        {participant.competitorNumber !== null ? (
                            <span className="print-target-group__num">#{participant.competitorNumber}</span>
                        ) : null}
                        <span className="print-target-group__name">{participant.name}</span>
                        {participant.isCaptain ? <span className="print-target-group__captain"> ★</span> : null}
                    </li>
                ))}
            </ul>
        </article>
    )
}
