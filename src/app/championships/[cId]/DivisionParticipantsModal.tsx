"use client"

export type DivisionParticipantEntry = {
    name: string
    membershipNo: string
    competitorNumber: number
    club: string
}

export default function DivisionParticipantsModal({
    abbrev,
    participants,
}: {
    abbrev: string
    participants: DivisionParticipantEntry[]
}) {
    const sorted = [...participants].sort((a, b) => a.competitorNumber - b.competitorNumber)

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-medium font-mono">{abbrev}</h3>
            {sorted.length === 0 ? (
                <p className="text-base-content/70">No competitors registered in this division.</p>
            ) : (
                <ul className="space-y-2">
                    {sorted.map((participant) => (
                        <li
                            key={participant.membershipNo}
                            className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm"
                        >
                            <span className="badge badge-primary badge-sm">#{participant.competitorNumber}</span>
                            <span className="font-medium">{participant.name}</span>
                            <span className="text-base-content/70">
                                {participant.membershipNo} · {participant.club}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}
