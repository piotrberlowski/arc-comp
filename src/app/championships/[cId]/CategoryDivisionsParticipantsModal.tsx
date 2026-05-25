"use client"

import type { DivisionParticipantEntry } from "./DivisionParticipantsModal"

export type CategoryDivisionGroup = {
    categoryName: string
    divisions: {
        abbrev: string
        participants: DivisionParticipantEntry[]
    }[]
}

function categoryParticipantCount(group: CategoryDivisionGroup): number {
    return group.divisions.reduce((sum, division) => sum + division.participants.length, 0)
}

function sortedParticipants(participants: DivisionParticipantEntry[]) {
    return [...participants].sort((a, b) => a.competitorNumber - b.competitorNumber)
}

function DivisionParticipantList({ participants }: { participants: DivisionParticipantEntry[] }) {
    const sorted = sortedParticipants(participants)
    if (sorted.length === 0) {
        return <p className="text-sm text-base-content/70">No competitors registered.</p>
    }

    return (
        <ul className="space-y-1.5">
            {sorted.map((participant) => (
                <li
                    key={participant.membershipNo}
                    className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-sm"
                >
                    <span className="badge badge-primary badge-sm">#{participant.competitorNumber}</span>
                    <span className="font-medium">{participant.name}</span>
                    <span className="text-base-content/70">
                        {participant.membershipNo} · {participant.club}
                    </span>
                </li>
            ))}
        </ul>
    )
}

function CategoryCollapse({ group }: { group: CategoryDivisionGroup }) {
    const count = categoryParticipantCount(group)

    return (
        <div className="collapse collapse-arrow border border-base-300 bg-base-100">
            <input type="checkbox" aria-label={`${group.categoryName}, ${count} registered`} />
            <div className="collapse-title flex flex-wrap items-center gap-2 pr-8 font-medium text-base">
                <span>{group.categoryName}</span>
                <span className="badge badge-neutral badge-sm font-normal tabular-nums">{count}</span>
            </div>
            <div className="collapse-content space-y-3 pt-1">
                {group.divisions.map((division) => (
                    <div key={division.abbrev} className="space-y-1.5 pl-1 border-l-2 border-base-300">
                        <p className="font-mono text-sm font-medium">{division.abbrev}</p>
                        <DivisionParticipantList participants={division.participants} />
                    </div>
                ))}
            </div>
        </div>
    )
}

export default function CategoryDivisionsParticipantsModal({
    title,
    groups,
}: {
    title: string
    groups: CategoryDivisionGroup[]
}) {
    const hasCompetitors = groups.some((group) => categoryParticipantCount(group) > 0)

    return (
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            <h3 className="text-lg font-medium">{title}</h3>
            {!hasCompetitors ? (
                <p className="text-base-content/70">No competitors registered for these divisions.</p>
            ) : (
                <div className="flex flex-col gap-2">
                    {groups.map((group) => (
                        <CategoryCollapse key={group.categoryName} group={group} />
                    ))}
                </div>
            )}
        </div>
    )
}
