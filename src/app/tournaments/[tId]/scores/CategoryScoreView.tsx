"use client"

import ScoreInput from "../components/ScoreInput"
import { ParticipantScoreData } from "../scoreActions"

// Extended interfaces for participants with place information
interface ParticipantWithPlace extends ParticipantScoreData {
    place: number
    isCategoryHeader: false
    category: string
    categoryComplete: boolean
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
    isComplete: false
    categoryComplete: boolean
    place: null
}

type TableRow = ParticipantWithPlace | CategoryHeaderRow

// Medal icon component
const MedalIcon = ({ place }: { place: number }) => {
    if (place === 1) {
        return <span className="text-yellow-500 text-lg">🥇</span>
    } else if (place === 2) {
        return <span className="text-gray-400 text-lg">🥈</span>
    } else if (place === 3) {
        return <span className="text-amber-600 text-lg">🥉</span>
    }
    return null
}

interface CategoryScoreViewProps {
    participants: ParticipantScoreData[]
    onScoreChange: (participantId: string, score: number | null, isComplete: boolean) => void
}

export default function CategoryScoreView({ participants, onScoreChange }: CategoryScoreViewProps) {
    // Group participants by category
    const categories = participants.reduce((acc, participant) => {
        const category = `${participant.participant.ageGroupId}${participant.participant.genderGroup}${participant.participant.categoryId}`
        if (!acc[category]) {
            acc[category] = []
        }
        acc[category].push(participant)
        return acc
    }, {} as Record<string, ParticipantScoreData[]>)

    // Convert to array and sort by category
    const sortedCategories = Object.entries(categories)
        .map(([category, participants]) => ({
            category,
            participants: participants.sort((a, b) => {
                // First sort by completion status (incomplete first, then complete)
                if (a.isComplete !== b.isComplete) {
                    return a.isComplete ? 1 : -1
                }
                // Then sort by score descending, then by name ascending
                if (a.score !== b.score) {
                    return (b.score || 0) - (a.score || 0)
                }
                return a.participant.name.localeCompare(b.participant.name)
            }),
            isComplete: participants.every(p => p.isComplete)
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
                isComplete: false,
                categoryComplete: false,
                place: null
            } as CategoryHeaderRow,
            // Regular participant rows
            ...categoryData.participants.map(participant => ({
                ...participant,
                isCategoryHeader: false,
                category: categoryData.category,
                categoryComplete: categoryData.isComplete,
                place: 0 // Will be calculated properly in complete participants
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
                place: index + 1
            }))

            return [
                // Pinned category header row
                {
                    isCategoryHeader: true,
                    category: categoryData.category,
                    participantId: `header-${categoryData.category}`,
                    participant: { name: categoryData.category, ageGroupId: '', genderGroup: '', categoryId: '', club: null },
                    score: null,
                    isComplete: false,
                    categoryComplete: true,
                    place: null
                } as CategoryHeaderRow,
                // Regular participant rows with places
                ...participantsWithPlaces
            ]
        })

    const ParticipantTable = ({ participants, title, bgColor }: {
        participants: TableRow[],
        title: string,
        bgColor: string
    }) => (
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
                                <tr key={participant.participantId}>
                                    <td>
                                        <div className="flex items-center gap-1">
                                            {!participant.isCategoryHeader && (
                                                <>
                                                    <MedalIcon place={participant.place} />
                                                    <span className="font-mono text-sm font-semibold">
                                                        {participant.place}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <div>
                                            <p className="font-medium text-sm">{participant.participant.name}</p>
                                            <p className="text-xs text-base-content/70">
                                                {participant.participant.ageGroupId}{participant.participant.genderGroup}
                                            </p>
                                        </div>
                                    </td>
                                    <td className="hidden md:table-cell">
                                        <span className="text-sm">{participant.participant.club || 'Independent'}</span>
                                    </td>
                                    <td className="hidden md:table-cell">
                                        <span className="font-mono text-sm">
                                            {participant.score !== null ? participant.score : '-'}
                                        </span>
                                    </td>
                                    <td>
                                        <ScoreInput
                                            currentScore={participant.score}
                                            isComplete={participant.isComplete}
                                            onScoreChange={(score, isComplete) =>
                                                onScoreChange(participant.participantId, score, isComplete)
                                            }
                                        />
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    )

    return (
        <div className="space-y-3">
            {outstandingParticipants.length > 0 && (
                <ParticipantTable
                    participants={outstandingParticipants}
                    title="Outstanding Categories"
                    bgColor="bg-warning/10"
                />
            )}

            {completeParticipants.length > 0 && (
                <ParticipantTable
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

