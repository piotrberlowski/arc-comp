"use client"

import { ParticipantWithResult } from "../scoreActions"
import CategoryParticipantTableRow, { type ParticipantWithPlace } from "./CategoryParticipantTableRow"

/**
 * Comparator function for sorting participants by completion status, score (with shootoff), and name.
 * Sorts incomplete participants first, then by score descending (including shootoff tiebreaker), then by name ascending.
 */
export function compareParticipants(a: ParticipantWithResult, b: ParticipantWithResult): number {
    const aHasResult = !!a.result
    const bHasResult = !!b.result

    if (aHasResult !== bHasResult) {
        return aHasResult ? 1 : -1
    }

    const aScore = a.result?.score ?? 0
    const bScore = b.result?.score ?? 0
    if (aScore !== bScore) {
        return bScore - aScore
    }

    const aShootoff = a.result?.shootoff ?? 0
    const bShootoff = b.result?.shootoff ?? 0
    if (aShootoff !== bShootoff) {
        return bShootoff - aShootoff
    }

    return a.name.localeCompare(b.name)
}


interface CategoryHeaderRow {
    isCategoryHeader: true
    category: string
    participantId: string
    participant: {
        name: string
        ageGroupId: string
        genderGroup: string
        categoryId: string
        club: string | null
    }
    score: null
    categoryComplete: boolean
    place: null
}

type TableRow = ParticipantWithPlace | CategoryHeaderRow

function CategoryParticipantTable({
    participants,
    title,
    bgColor,
}: {
    participants: TableRow[]
    title: string
    bgColor: string
}) {
    return (
        <div className={`${bgColor} rounded-lg p-3 mb-3`}>
            <h3 className="text-base font-semibold mb-2">{title}</h3>
            <div className="overflow-x-auto">
                <table className="table table-compact table-zebra w-full">
                    <thead>
                        <tr>
                            <th className="w-1/12">Place</th>
                            <th className="w-2/5">Name</th>
                            <th className="w-1/5 hidden md:table-cell">Club</th>
                            <th className="w-1/12 hidden md:table-cell">Score</th>
                            <th className="w-2/5">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {participants.map((participant) => {
                            if (participant.isCategoryHeader) {
                                return (
                                    <tr key={participant.participantId} className="sticky top-0 bg-primary text-primary-content z-10 [&>*]:!bg-primary [&>*]:!text-primary-content">
                                        <td colSpan={5} className="font-semibold py-2">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-sm">{participant.category}</span>
                                                <div className="flex-1 border-t border-primary-content/20"></div>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            }

                            return (
                                <CategoryParticipantTableRow
                                    key={participant.id}
                                    participant={participant}
                                />
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

interface CategoryScoreViewProps {
    participants: ParticipantWithResult[]
    unresolvedTieParticipantIds?: Set<string>
}

export default function CategoryScoreView({ 
    participants, unresolvedTieParticipantIds 
}: CategoryScoreViewProps) {
    // Group participants by category
    const categories = participants.reduce((acc, participant) => {
        const category = `${participant.ageGroupId}${participant.genderGroup}${participant.categoryId}`
        if (!acc[category]) {
            acc[category] = []
        }
        acc[category].push(participant)
        return acc
    }, {} as Record<string, ParticipantWithResult[]>)

    // Convert to array and sort by category
    const sortedCategories = Object.entries(categories)
        .map(([category, participants]) => ({
            category,
            participants: participants.sort(compareParticipants),
            isComplete: participants.every(p => !!p.result)
        }))
        .sort((a, b) => a.category.localeCompare(b.category))

    // Create participants with category grouping for pinned rows
    const outstandingParticipants: TableRow[] = sortedCategories
        .filter(c => !c.isComplete)
        .flatMap(categoryData => [
            // Pinned category header row
            {
                isCategoryHeader: true,
                category: categoryData.category,
                participantId: `header-${categoryData.category}`,
                participant: { name: categoryData.category, ageGroupId: '', genderGroup: '', categoryId: '', club: null },
                score: null,
                categoryComplete: false,
                place: null
            } as CategoryHeaderRow,
            // Regular participant rows
            ...categoryData.participants.map(participant => ({
                ...participant,
                isCategoryHeader: false,
                category: categoryData.category,
                categoryComplete: categoryData.isComplete,
                place: 0,
                hasUnresolvedTie: unresolvedTieParticipantIds?.has(participant.id) ?? false
            } as ParticipantWithPlace))
        ])

    const completeParticipants: TableRow[] = sortedCategories
        .filter(c => c.isComplete)
        .flatMap(categoryData => {
            // Calculate places for this category
            const participantsWithPlaces: ParticipantWithPlace[] = categoryData.participants.map((participant, index) => ({
                ...participant,
                isCategoryHeader: false,
                category: categoryData.category,
                categoryComplete: categoryData.isComplete,
                place: index + 1,
                hasUnresolvedTie: unresolvedTieParticipantIds?.has(participant.id) ?? false
            }))

            return [
                // Pinned category header row
                {
                    isCategoryHeader: true,
                    category: categoryData.category,
                    participantId: `header-${categoryData.category}`,
                    participant: { name: categoryData.category, ageGroupId: '', genderGroup: '', categoryId: '', club: null },
                    score: null,
                    categoryComplete: true,
                    place: null
                } as CategoryHeaderRow,
                // Regular participant rows with places
                ...participantsWithPlaces
            ]
        })

    return (
        <div className="space-y-3">
            {outstandingParticipants.length > 0 && (
                <CategoryParticipantTable
                    participants={outstandingParticipants}
                    title="Outstanding Categories"
                    bgColor="bg-warning/10"
                />
            )}

            {completeParticipants.length > 0 && (
                <CategoryParticipantTable
                    participants={completeParticipants}
                    title="Complete Categories"
                    bgColor="bg-success/10"
                />
            )}

            {outstandingParticipants.length === 0 && completeParticipants.length === 0 && (
                <div className="text-center py-8 text-base-content/50">
                    <p>No participants found.</p>
                </div>
            )}
        </div>
    )
}

