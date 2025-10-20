"use client"

import React from "react"
import ExportButton from "./components/ExportButton"
import { ParticipantResultData, TournamentResultsData } from "./resultsActions"

interface TournamentResultsViewProps {
    tournamentData: TournamentResultsData
}

enum RowType {
    CATEGORY_HEADER = 'category_header',
    SUB_HEADER = 'sub_header',
    PARTICIPANT = 'participant'
}

interface CategoryHeaderRow {
    rowType: RowType.CATEGORY_HEADER
    category: string
    id: string
}

interface SubHeaderRow {
    rowType: RowType.SUB_HEADER
    subCategory: string
    id: string
}

interface ParticipantRow {
    rowType: RowType.PARTICIPANT
    participantId: string
    participant: {
        name: string
        ageGroup: { name: string }
        genderGroup: string
        club: string | null
    }
    score: number | null
    place: number | null
}

type TableRow = CategoryHeaderRow | SubHeaderRow | ParticipantRow

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

// Category header row component
const CategoryHeaderRow = ({ row }: { row: CategoryHeaderRow }) => (
    <React.Fragment key={`category-${row.id}`}>
        <tr className="bg-base-100 [&>*]:!bg-base-100">
            <td colSpan={4} className="py-2"></td>
        </tr>
        <tr className="sticky top-0 bg-primary text-primary-content z-10 [&>*]:!bg-primary [&>*]:!text-primary-content">
            <td colSpan={4} className="font-semibold py-3">
                <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">{row.category}</span>
                    <div className="flex-1 border-t border-primary-content/20"></div>
                </div>
            </td>
        </tr>
    </React.Fragment>
)

// Sub-header row component
const SubHeaderRow = ({ row }: { row: SubHeaderRow }) => (
    <tr key={row.id} className="bg-secondary text-secondary-content [&>*]:!bg-secondary [&>*]:!text-secondary-content">
        <td colSpan={4} className="font-semibold py-2 pl-8">
            <span className="text-sm">{row.subCategory}</span>
        </td>
    </tr>
)

// Participant row component
const ParticipantRow = ({ row }: { row: ParticipantRow }) => (
    <tr key={row.participantId}>
        <td className="pl-8">
            <div className="flex items-center gap-1">
                <MedalIcon place={row.place!} />
                <span className="font-mono text-xs font-semibold">
                    {row.place}
                </span>
            </div>
        </td>
        <td>
            <div>
                <p className="font-medium text-xs">{row.participant.name}</p>
            </div>
        </td>
        <td>
            <span className="text-xs">{row.participant.club || 'Independent'}</span>
        </td>
        <td>
            <span className="font-mono text-xs font-semibold">
                {row.score !== null ? row.score : '-'}
            </span>
        </td>
    </tr>
)

// Table row renderer
const TableRowRenderer = ({ row }: { row: TableRow }) => {
    if (row.rowType === RowType.CATEGORY_HEADER) {
        return <CategoryHeaderRow row={row} />
    }

    if (row.rowType === RowType.SUB_HEADER) {
        return <SubHeaderRow row={row} />
    }

    // row.rowType === RowType.PARTICIPANT
    return <ParticipantRow row={row} />
}

// Group participants by equipment category and age+gender
function groupParticipantsByCategory(participants: ParticipantResultData[]) {
    const equipmentCategories = participants.reduce((acc, participant) => {
        const equipmentCategory = participant.participant.equipmentCategory.name
        if (!acc[equipmentCategory]) {
            acc[equipmentCategory] = {}
        }

        const genderDisplay = participant.participant.genderGroup === 'F' ? 'Female' : 'Male'
        const ageGenderKey = `${participant.participant.ageGroup.name} ${genderDisplay}`
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
                if (a.score !== b.score) {
                    return (b.score || 0) - (a.score || 0)
                }
                return a.participant.name.localeCompare(b.participant.name)
            })
        })
    })

    return equipmentCategories
}

// Create table rows from grouped participants
function createTableRows(equipmentCategories: Record<string, Record<string, ParticipantResultData[]>>): TableRow[] {
    const tableRows: TableRow[] = []

    Object.entries(equipmentCategories).forEach(([equipmentCategory, ageGenderGroups]) => {
        // Add equipment category header
        tableRows.push({
            rowType: RowType.CATEGORY_HEADER,
            category: equipmentCategory,
            id: `header-${equipmentCategory}`
        })

        // Add age+gender sub-headers and participants
        Object.entries(ageGenderGroups).forEach(([ageGenderKey, participants]) => {
            // Add sub-header for age+gender
            tableRows.push({
                rowType: RowType.SUB_HEADER,
                subCategory: ageGenderKey,
                id: `subheader-${equipmentCategory}-${ageGenderKey}`
            })

            // Add participants in this age+gender group
            participants.forEach((participant, index) => {
                tableRows.push({
                    rowType: RowType.PARTICIPANT,
                    participantId: participant.participantId,
                    participant: participant.participant,
                    score: participant.score,
                    place: index + 1
                })
            })
        })
    })

    return tableRows
}

export default function TournamentResultsView({ tournamentData }: TournamentResultsViewProps) {
    const equipmentCategories = groupParticipantsByCategory(tournamentData.participants)
    const tableRows = createTableRows(equipmentCategories)

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
                        {tableRows.map((row) => (
                            <TableRowRenderer key={row.rowType === RowType.PARTICIPANT ? row.participantId : row.id} row={row} />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
