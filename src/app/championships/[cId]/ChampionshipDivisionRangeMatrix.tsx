"use client"

import FormModal, { type FormModalHandle } from "@/components/FormModal"
import useErrorContext from "@/components/errors/ErrorContext"
import { compareDivisionsForMatrix } from "@/lib/championshipDivision"
import type { GenderGroup } from "@/generated/prisma/client"
import { isDivisionRangeBlockedOnOtherDay } from "@/lib/championshipRangeRules"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react"
import {
    getChampionshipDivisionRangeMatrix,
    setChampionshipDivisionRangeAssignment,
    type DivisionRangeMatrixData,
    type DivisionRangeMatrixRow,
} from "../championshipActions"
import DivisionParticipantsModal, { type DivisionParticipantEntry } from "./DivisionParticipantsModal"

export type ChampionshipMatrixRegistration = DivisionParticipantEntry & {
    divisionKey: string
}

type MatrixBowStyleGroup = {
    categoryId: string
    categoryName: string
    participantCount: number
    rows: DivisionRangeMatrixRow[]
}

function RangeSelect({
    divisionKey,
    dayOrder,
    rangeNumber,
    rangeByDay,
    rangeCount,
    frozen,
    readOnly,
    onChange,
}: {
    divisionKey: string
    dayOrder: number
    rangeNumber: number | null
    rangeByDay: Record<number, number | null>
    rangeCount: number
    frozen: boolean
    readOnly: boolean
    onChange: (divisionKey: string, dayOrder: number, rangeNumber: number | null) => void
}) {
    return (
        <select
            className="select select-bordered select-xs w-14 min-h-0 h-8 px-1"
            value={rangeNumber ?? ""}
            disabled={readOnly || frozen}
            aria-label={`Day ${dayOrder} range for ${divisionKey}`}
            onChange={(event) => {
                const value = event.target.value
                onChange(divisionKey, dayOrder, value === "" ? null : Number(value))
            }}
        >
            <option value="">—</option>
            {Array.from({ length: rangeCount }, (_, index) => {
                const option = index + 1
                const blocked = isDivisionRangeBlockedOnOtherDay(rangeByDay, dayOrder, option)
                return (
                    <option key={option} value={option} disabled={blocked}>
                        R{option}
                    </option>
                )
            })}
        </select>
    )
}

function DayRangeTotals({ totals }: { totals: Record<number, number> }) {
    const entries = Object.entries(totals).filter(([, count]) => count > 0)
    if (entries.length === 0) {
        return <span className="text-base-content/50">—</span>
    }

    return (
        <div className="flex flex-wrap justify-center gap-x-2 gap-y-0.5 text-xs">
            {entries.map(([rangeNumber, count]) => (
                <span key={rangeNumber}>
                    R{rangeNumber}: {count}
                </span>
            ))}
        </div>
    )
}

function DivisionRangeTotalsHeader({
    dayOrders,
    totalsByDay,
}: {
    dayOrders: number[]
    totalsByDay: DivisionRangeMatrixData["totalsByDay"]
}) {
    return (
        <div className="overflow-x-auto">
            <table className="table table-sm table-fixed w-auto">
                <colgroup>
                    <col className="w-24" />
                    <col className="w-10" />
                    {dayOrders.map((dayOrder) => (
                        <col key={dayOrder} className="w-16" />
                    ))}
                </colgroup>
                <thead>
                    <tr className="font-medium text-xs">
                        <th className="text-left">Total per range</th>
                        <th />
                        {dayOrders.map((dayOrder) => (
                            <th key={dayOrder} className="text-center font-normal text-base-content/70">
                                D{dayOrder}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td className="text-xs text-base-content/70">Registered</td>
                        <td />
                        {dayOrders.map((dayOrder) => (
                            <td key={dayOrder} className="text-center px-1">
                                <DayRangeTotals totals={totalsByDay[dayOrder] ?? {}} />
                            </td>
                        ))}
                    </tr>
                </tbody>
            </table>
        </div>
    )
}

function DivisionAbbrevButton({
    abbrev,
    registrationCount,
    onShowParticipants,
}: {
    abbrev: string
    registrationCount: number
    onShowParticipants: () => void
}) {
    return (
        <button
            type="button"
            className="font-mono text-xs link link-hover text-left"
            title={`View ${registrationCount} registered competitors`}
            onClick={onShowParticipants}
        >
            {abbrev}
        </button>
    )
}

function DivisionRangeMatrixTable({
    rows,
    dayOrders,
    rangeCount,
    dayOneFrozen,
    readOnly,
    isPending,
    onRangeChange,
    onShowParticipants,
}: {
    rows: DivisionRangeMatrixRow[]
    dayOrders: number[]
    rangeCount: number
    dayOneFrozen: boolean
    readOnly: boolean
    isPending: boolean
    onRangeChange: (divisionKey: string, dayOrder: number, rangeNumber: number | null) => void
    onShowParticipants: (abbrev: string, divisionKey: string) => void
}) {
    return (
        <div className="overflow-x-auto">
            <table className="table table-sm table-fixed w-auto">
                <colgroup>
                    <col className="w-24" />
                    <col className="w-10" />
                    {dayOrders.map((dayOrder) => (
                        <col key={dayOrder} className="w-16" />
                    ))}
                </colgroup>
                <thead>
                    <tr>
                        <th className="font-mono text-xs">Div</th>
                        <th className="text-right text-xs">Reg</th>
                        {dayOrders.map((dayOrder) => (
                            <th key={dayOrder} className="text-center text-xs">
                                D{dayOrder}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => (
                        <tr key={row.divisionKey} className={row.isCub ? "bg-base-200/50" : undefined}>
                            <td>
                                <DivisionAbbrevButton
                                    abbrev={row.abbrev}
                                    registrationCount={row.registrationCount}
                                    onShowParticipants={() => onShowParticipants(row.abbrev, row.divisionKey)}
                                />
                            </td>
                            <td className="text-right text-xs">{row.registrationCount}</td>
                            {dayOrders.map((dayOrder) => (
                                <td key={dayOrder} className="text-center px-1">
                                    <RangeSelect
                                        divisionKey={row.divisionKey}
                                        dayOrder={dayOrder}
                                        rangeNumber={row.rangeByDay[dayOrder] ?? null}
                                        rangeByDay={row.rangeByDay}
                                        rangeCount={rangeCount}
                                        frozen={dayOneFrozen && dayOrder === 1}
                                        readOnly={readOnly || isPending}
                                        onChange={onRangeChange}
                                    />
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

function groupRowsByBowStyle(rows: DivisionRangeMatrixRow[]): MatrixBowStyleGroup[] {
    const byCategory = new Map<string, MatrixBowStyleGroup>()

    for (const row of rows) {
        const existing = byCategory.get(row.categoryId)
        if (existing) {
            existing.rows.push(row)
            continue
        }
        byCategory.set(row.categoryId, {
            categoryId: row.categoryId,
            categoryName: row.categoryName,
            participantCount: 0,
            rows: [row],
        })
    }

    return [...byCategory.values()]
        .sort((a, b) => a.categoryName.localeCompare(b.categoryName))
        .map((group) => {
            const sortedRows = [...group.rows].sort((a, b) =>
                compareDivisionsForMatrix(matrixRowAsDivision(a), matrixRowAsDivision(b))
            )
            return {
                ...group,
                rows: sortedRows,
                participantCount: sortedRows.reduce((sum, row) => sum + row.registrationCount, 0),
            }
        })
}

function BowStyleAccordion({
    groups,
    accordionName,
    dayOrders,
    rangeCount,
    dayOneFrozen,
    readOnly,
    isPending,
    onRangeChange,
    onShowParticipants,
}: {
    groups: MatrixBowStyleGroup[]
    accordionName: string
    dayOrders: number[]
    rangeCount: number
    dayOneFrozen: boolean
    readOnly: boolean
    isPending: boolean
    onRangeChange: (divisionKey: string, dayOrder: number, rangeNumber: number | null) => void
    onShowParticipants: (abbrev: string, divisionKey: string) => void
}) {
    return (
        <div className="flex flex-col gap-2">
            {groups.map((group, index) => (
                <div
                    key={group.categoryId}
                    className="collapse collapse-arrow bg-base-100 border border-base-300"
                >
                    <input
                        type="radio"
                        name={accordionName}
                        defaultChecked={index === 0}
                        aria-label={`${group.categoryName}, ${group.participantCount} registered`}
                    />
                    <div className="collapse-title flex flex-wrap items-center gap-2 pr-8 font-medium">
                        <span>{group.categoryName}</span>
                        <span className="badge badge-neutral badge-sm font-normal">
                            {group.participantCount} registered
                        </span>
                    </div>
                    <div className="collapse-content pt-1">
                        <DivisionRangeMatrixTable
                            rows={group.rows}
                            dayOrders={dayOrders}
                            rangeCount={rangeCount}
                            dayOneFrozen={dayOneFrozen}
                            readOnly={readOnly}
                            isPending={isPending}
                            onRangeChange={onRangeChange}
                            onShowParticipants={onShowParticipants}
                        />
                    </div>
                </div>
            ))}
        </div>
    )
}

function matrixRowAsDivision(row: DivisionRangeMatrixRow) {
    return {
        ageGroupId: row.ageGroupId,
        categoryId: row.categoryId,
        genderGroup: row.genderGroup as GenderGroup,
        ageGroupName: row.ageGroupName,
        categoryName: row.categoryName,
    }
}

export default function ChampionshipDivisionRangeMatrix({
    championshipId,
    initialMatrix,
    registrations,
    readOnly = false,
}: {
    championshipId: string
    initialMatrix: DivisionRangeMatrixData | null
    registrations: ChampionshipMatrixRegistration[]
    readOnly?: boolean
}) {
    const router = useRouter()
    const setError = useErrorContext()
    const participantsModalRef = useRef<FormModalHandle>(null)
    const [matrix, setMatrix] = useState<DivisionRangeMatrixData | null>(initialMatrix)
    const [selectedDivision, setSelectedDivision] = useState<{ abbrev: string; divisionKey: string } | null>(
        null
    )
    const [isPending, startTransition] = useTransition()

    useEffect(() => {
        setMatrix(initialMatrix)
    }, [initialMatrix])

    const bowStyleGroups = useMemo(
        () => (matrix ? groupRowsByBowStyle(matrix.rows) : []),
        [matrix]
    )

    const participantsByDivision = useMemo(() => {
        const grouped = new Map<string, DivisionParticipantEntry[]>()
        for (const registration of registrations) {
            const existing = grouped.get(registration.divisionKey) ?? []
            existing.push({
                name: registration.name,
                membershipNo: registration.membershipNo,
                competitorNumber: registration.competitorNumber,
                club: registration.club,
            })
            grouped.set(registration.divisionKey, existing)
        }
        return grouped
    }, [registrations])

    const selectedParticipants = selectedDivision
        ? (participantsByDivision.get(selectedDivision.divisionKey) ?? [])
        : []

    const openDivisionParticipants = (abbrev: string, divisionKey: string) => {
        setSelectedDivision({ abbrev, divisionKey })
        participantsModalRef.current?.open()
    }

    const reloadMatrix = useCallback(() => {
        return getChampionshipDivisionRangeMatrix(championshipId).then((data) => {
            if (data) {
                setMatrix(data)
            }
            return data
        })
    }, [championshipId])

    const handleRangeChange = (divisionKey: string, dayOrder: number, rangeNumber: number | null) => {
        startTransition(() => {
            setChampionshipDivisionRangeAssignment(championshipId, dayOrder, divisionKey, rangeNumber)
                .then(() => {
                    router.refresh()
                    return reloadMatrix()
                })
                .catch((error) => {
                    setError(error instanceof Error ? error.message : "Unable to update range assignment")
                })
        })
    }

    if (!matrix || matrix.rows.length === 0) {
        return null
    }

    return (
        <div className="space-y-4">
            {matrix.dayOneFrozen ? (
                <p className="text-sm text-warning">
                    Day 1 assignments are frozen because scores have been entered on a day-1 range tournament.
                </p>
            ) : null}
            <div className="card bg-base-200 shadow-sm">
                <div className="card-body py-4 gap-3">
                    <DivisionRangeTotalsHeader dayOrders={matrix.dayOrders} totalsByDay={matrix.totalsByDay} />
                </div>
            </div>
            <BowStyleAccordion
                groups={bowStyleGroups}
                accordionName={`division-range-bow-styles-${championshipId}`}
                dayOrders={matrix.dayOrders}
                rangeCount={matrix.rangeCount}
                dayOneFrozen={matrix.dayOneFrozen}
                readOnly={readOnly}
                isPending={isPending}
                onRangeChange={handleRangeChange}
                onShowParticipants={openDivisionParticipants}
            />
            <p className="text-sm text-base-content/70">
                Assign every division to a range on each day before enrolling competitors on multi-range championships.
                A division cannot use the same range on more than one day. Unassigning a division unenrolls affected
                competitors from that range.
            </p>
            <FormModal ref={participantsModalRef}>
                {selectedDivision ? (
                    <DivisionParticipantsModal
                        abbrev={selectedDivision.abbrev}
                        participants={selectedParticipants}
                    />
                ) : null}
            </FormModal>
        </div>
    )
}
