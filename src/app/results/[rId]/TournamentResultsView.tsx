"use client"

import MedalIcon from "@/app/tournaments/[tId]/components/MedalIcon"
import React from "react"
import { ParticipantResultData, TournamentResultsData } from "../resultsActions"
import ExportButton from "./components/ExportButton"

interface TournamentResultsViewProps {
    tournamentData: TournamentResultsData
}

// Category header row component
const CategoryHeaderRow = ({ category, id }: { category: string, id: string }) => (
    <React.Fragment key={`category-${id}`}>
        <tr className="bg-base-100 [&>*]:!bg-base-100">
            <td colSpan={4} className="py-2"></td>
        </tr>
        <tr className="sticky top-0 bg-primary text-primary-content z-10 [&>*]:!bg-primary [&>*]:!text-primary-content">
            <td colSpan={4} className="font-semibold py-3">
                <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">{category}</span>
                    <div className="flex-1 border-t border-primary-content/20"></div>
                </div>
            </td>
        </tr>
    </React.Fragment>
)

// Sub-header row component
const SubHeaderRow = ({ subCategory, id }: { subCategory: string, id: string }) => (
    <tr key={id} className="bg-secondary text-secondary-content [&>*]:!bg-secondary [&>*]:!text-secondary-content">
        <td colSpan={4} className="font-semibold py-2 pl-8">
            <span className="text-sm">{subCategory}</span>
        </td>
    </tr>
)

// Participant row component
const ParticipantRow = ({ participant, place }: { participant: ParticipantResultData, place: number }) => (
    <tr key={participant.id}>
        <td className="pl-8">
            <div className="flex items-center gap-1">
                <MedalIcon place={place} />
                <span className="font-mono text-xs font-semibold">
                    {place}
                </span>
            </div>
        </td>
        <td>
            <div>
                <p className="font-medium text-xs">{participant.name}</p>
            </div>
        </td>
        <td>
            <span className="text-xs">{participant.club || 'Independent'}</span>
        </td>
        <td>
            <span className="font-mono text-xs font-semibold">
                {participant.participantScore.score}
            </span>
        </td>
    </tr>
)

// Group participants by equipment category and age+gender
function groupParticipantsByCategory(participants: ParticipantResultData[]) {
    const equipmentCategories = participants.reduce((acc, participant) => {
        const equipmentCategory = participant.category.name
        if (!acc[equipmentCategory]) {
            acc[equipmentCategory] = {}
        }

        const genderDisplay = participant.genderGroup === 'F' ? 'Female' : 'Male'
        const ageGenderKey = `${participant.ageGroup.name} ${genderDisplay}`
        if (!acc[equipmentCategory][ageGenderKey]) {
            acc[equipmentCategory][ageGenderKey] = []
        }

        acc[equipmentCategory][ageGenderKey].push(participant)
        return acc
    }, {} as Record<string, Record<string, ParticipantResultData[]>>)

    // Sort participants within each age+gender group by score descending
    Object.keys(equipmentCategories).forEach(equipmentCategory => {
        Object.keys(equipmentCategories[equipmentCategory]).forEach(ageGenderKey => {
            equipmentCategories[equipmentCategory][ageGenderKey].sort((a, b) => {
                if (a.participantScore.score !== b.participantScore.score) {
                    return (b.participantScore.score) - (a.participantScore.score)
                }
                return a.name.localeCompare(b.name)
            })
        })
    })

    return equipmentCategories
}

// Component that renders table rows from grouped participants
function TournamentResultsTable({ equipmentCategories }: { equipmentCategories: Record<string, Record<string, ParticipantResultData[]>> }) {
    return (
        <>
            {Object.entries(equipmentCategories).map(([equipmentCategory, ageGenderGroups]) => (
                <React.Fragment key={equipmentCategory}>
                    {/* Equipment category header */}
                    <CategoryHeaderRow
                        category={equipmentCategory}
                        id={`header-${equipmentCategory}`}
                    />

                    {/* Age+gender sub-headers and participants */}
                    {Object.entries(ageGenderGroups).map(([ageGenderKey, participants]) => (
                        <React.Fragment key={`${equipmentCategory}-${ageGenderKey}`}>
                            {/* Sub-header for age+gender */}
                            <SubHeaderRow
                                subCategory={ageGenderKey}
                                id={`subheader-${equipmentCategory}-${ageGenderKey}`}
                            />

                            {/* Participants in this age+gender group */}
                            {participants.map((participant, index) => (
                                <ParticipantRow
                                    key={participant.id}
                                    participant={participant}
                                    place={index + 1}
                                />
                            ))}
                        </React.Fragment>
                    ))}
                </React.Fragment>
            ))}
        </>
    )
}

export default function TournamentResultsView({ tournamentData }: TournamentResultsViewProps) {
    const equipmentCategories = groupParticipantsByCategory(tournamentData.participants)

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <ExportButton tournamentData={tournamentData} />
            </div>

            <div className="overflow-x-auto">
                <table className="table table-compact table-zebra w-full border border-base-300">
                    <thead>
                        <tr>
                            <th className="w-1/12">Place</th>
                            <th className="w-2/5">Name</th>
                            <th className="w-1/5">Club</th>
                            <th className="w-1/12">Score</th>
                        </tr>
                    </thead>
                    <tbody>
                        <TournamentResultsTable equipmentCategories={equipmentCategories} />
                    </tbody>
                </table>
            </div>
        </div>
    )
}
