"use client"

import FormModal, { type FormModalHandle } from "@/components/FormModal"
import useErrorContext, { useInfoContext } from "@/components/errors/ErrorContext"
import { compareDivisionsForMatrix } from "@/lib/championshipDivision"
import type { GenderGroup } from "@/generated/prisma/client"
import {
    buildCategoryRangeUpdates,
    categoryHasAssignmentOnFrozenDayOne,
    collectSoleAvailableRangeAssignments,
    isDayRangeAssignmentEditable,
    isDivisionRangeBlockedOnOtherDay,
    type RangeAssignmentUpdate,
} from "@/lib/championshipRangeRules"
import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/24/outline"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState, useTransition, type Dispatch, type SetStateAction } from "react"
import {
    getChampionshipDivisionRangeMatrix,
    setChampionshipDivisionRangeAssignment,
    type DivisionRangeMatrixData,
    type DivisionRangeMatrixRow,
} from "../championshipActions"
import CategoryDivisionsParticipantsModal, {
    type CategoryDivisionGroup,
} from "./CategoryDivisionsParticipantsModal"
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

type MatrixModalView =
    | { kind: "division"; abbrev: string; divisionKey: string }
    | { kind: "rangeDay"; dayOrder: number; rangeNumber: number }
    | { kind: "bowStyle"; categoryName: string; rows: DivisionRangeMatrixRow[] }

function buildCategoryDivisionGroups(
    rows: DivisionRangeMatrixRow[],
    participantsByDivision: Map<string, DivisionParticipantEntry[]>
): CategoryDivisionGroup[] {
    const byCategory = new Map<string, CategoryDivisionGroup>()
    const sortedRows = [...rows].sort((a, b) =>
        compareDivisionsForMatrix(matrixRowAsDivision(a), matrixRowAsDivision(b))
    )

    for (const row of sortedRows) {
        const existing = byCategory.get(row.categoryId)
        if (existing) {
            existing.divisions.push({
                abbrev: row.abbrev,
                participants: participantsByDivision.get(row.divisionKey) ?? [],
            })
            continue
        }
        byCategory.set(row.categoryId, {
            categoryName: row.categoryName,
            divisions: [
                {
                    abbrev: row.abbrev,
                    participants: participantsByDivision.get(row.divisionKey) ?? [],
                },
            ],
        })
    }

    return [...byCategory.values()].sort((a, b) => a.categoryName.localeCompare(b.categoryName))
}

function RegistrationCountButton({ count, onClick }: { count: number; onClick: () => void }) {
    if (count === 0) {
        return <span className="text-xs text-base-content/50">0</span>
    }

    return (
        <button
            type="button"
            className="text-xs link link-hover tabular-nums"
            title="View registered competitors"
            onClick={onClick}
        >
            {count}
        </button>
    )
}

function CategoryDayQuickAssign({
    dayOrders,
    rangeCount,
    dayOneFrozen,
    readOnly,
    isPending,
    onCategoryDayAction,
    onClearCategoryDay,
    onClearCategory,
}: {
    dayOrders: number[]
    rangeCount: number
    dayOneFrozen: boolean
    readOnly: boolean
    isPending: boolean
    onCategoryDayAction: (dayOrder: number, rangeNumber: number) => void
    onClearCategoryDay: (dayOrder: number) => void
    onClearCategory: () => void
}) {
    return (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-normal pl-9">
            <button
                type="button"
                className="btn btn-ghost btn-xs min-h-0 h-7 px-1.5"
                disabled={readOnly || isPending}
                onClick={onClearCategory}
            >
                Clear category
            </button>
            {dayOrders.map((dayOrder) => {
                const editable = isDayRangeAssignmentEditable(dayOrder, dayOneFrozen)

                return (
                    <div key={dayOrder} className="flex items-center gap-1">
                        <span className="text-base-content/70">D{dayOrder}</span>
                        <select
                            className="select select-bordered select-xs w-[4.75rem] min-h-0 h-7 px-1"
                            disabled={readOnly || isPending || !editable}
                            aria-label={`Assign all divisions on day ${dayOrder}`}
                            defaultValue=""
                            onChange={(event) => {
                                const value = event.target.value
                                if (value === "") {
                                    return
                                }
                                onCategoryDayAction(dayOrder, Number(value))
                                event.target.value = ""
                            }}
                        >
                            <option value="">All →</option>
                            {Array.from({ length: rangeCount }, (_, index) => {
                                const rangeNumber = index + 1
                                return (
                                    <option key={rangeNumber} value={rangeNumber}>
                                        R{rangeNumber}
                                    </option>
                                )
                            })}
                        </select>
                        <button
                            type="button"
                            className="btn btn-ghost btn-xs min-h-0 h-7 px-1.5"
                            disabled={readOnly || isPending || !editable}
                            onClick={() => onClearCategoryDay(dayOrder)}
                        >
                            Clear D{dayOrder}
                        </button>
                    </div>
                )
            })}
        </div>
    )
}

function RangeSelect({
    divisionKey,
    dayOrder,
    rangeNumber,
    rangeByDay,
    rangeCount,
    frozen,
    readOnly,
    isPending,
    onChange,
}: {
    divisionKey: string
    dayOrder: number
    rangeNumber: number | null
    rangeByDay: Record<number, number | null>
    rangeCount: number
    frozen: boolean
    readOnly: boolean
    isPending: boolean
    onChange: (divisionKey: string, dayOrder: number, rangeNumber: number | null) => void
}) {
    return (
        <select
            className="select select-bordered select-xs w-14 min-h-0 h-8 px-1"
            value={rangeNumber ?? ""}
            disabled={readOnly || isPending || frozen}
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

function DayRangeTotals({
    dayOrder,
    totals,
    onRangeDayClick,
}: {
    dayOrder: number
    totals: Record<number, number>
    onRangeDayClick: (dayOrder: number, rangeNumber: number) => void
}) {
    const entries = Object.entries(totals).filter(([, count]) => count > 0)
    if (entries.length === 0) {
        return <span className="text-base-content/50">—</span>
    }

    return (
        <div className="flex flex-wrap justify-center gap-x-2 gap-y-0.5 text-xs">
            {entries.map(([rangeNumber, count]) => (
                <button
                    key={rangeNumber}
                    type="button"
                    className="link link-hover tabular-nums"
                    title={`View divisions on day ${dayOrder}, range ${rangeNumber}`}
                    onClick={() => onRangeDayClick(dayOrder, Number(rangeNumber))}
                >
                    R{rangeNumber}: {count}
                </button>
            ))}
        </div>
    )
}

function DivisionRangeTotalsHeader({
    dayOrders,
    totalsByDay,
    dayOneFrozen,
    readOnly,
    isPending,
    onRangeDayClick,
    onClearDay,
}: {
    dayOrders: number[]
    totalsByDay: DivisionRangeMatrixData["totalsByDay"]
    dayOneFrozen: boolean
    readOnly: boolean
    isPending: boolean
    onRangeDayClick: (dayOrder: number, rangeNumber: number) => void
    onClearDay: (dayOrder: number) => void
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
                                <div className="flex flex-col items-center gap-1">
                                    <span>D{dayOrder}</span>
                                    {!readOnly && isDayRangeAssignmentEditable(dayOrder, dayOneFrozen) ? (
                                        <button
                                            type="button"
                                            className="btn btn-ghost btn-xs min-h-0 h-6 px-1 font-normal"
                                            disabled={isPending}
                                            onClick={() => onClearDay(dayOrder)}
                                        >
                                            Clear day
                                        </button>
                                    ) : null}
                                </div>
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
                                <DayRangeTotals
                                    dayOrder={dayOrder}
                                    totals={totalsByDay[dayOrder] ?? {}}
                                    onRangeDayClick={onRangeDayClick}
                                />
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
                            <td className="text-right text-xs">
                                <RegistrationCountButton
                                    count={row.registrationCount}
                                    onClick={() => onShowParticipants(row.abbrev, row.divisionKey)}
                                />
                            </td>
                            {dayOrders.map((dayOrder) => (
                                <td key={dayOrder} className="text-center px-1">
                                    <RangeSelect
                                        divisionKey={row.divisionKey}
                                        dayOrder={dayOrder}
                                        rangeNumber={row.rangeByDay[dayOrder] ?? null}
                                        rangeByDay={row.rangeByDay}
                                        rangeCount={rangeCount}
                                        frozen={dayOneFrozen && dayOrder === 1}
                                        readOnly={readOnly}
                                        isPending={isPending}
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
    dayOrders,
    rangeCount,
    dayOneFrozen,
    readOnly,
    isPending,
    onRangeChange,
    onShowParticipants,
    onShowBowStyleParticipants,
    onCategoryDayAction,
    onClearCategoryDay,
    onClearCategory,
}: {
    groups: MatrixBowStyleGroup[]
    dayOrders: number[]
    rangeCount: number
    dayOneFrozen: boolean
    readOnly: boolean
    isPending: boolean
    onRangeChange: (divisionKey: string, dayOrder: number, rangeNumber: number | null) => void
    onShowParticipants: (abbrev: string, divisionKey: string) => void
    onShowBowStyleParticipants: (categoryName: string, rows: DivisionRangeMatrixRow[]) => void
    onCategoryDayAction: (rows: DivisionRangeMatrixRow[], dayOrder: number, rangeNumber: number) => void
    onClearCategoryDay: (rows: DivisionRangeMatrixRow[], dayOrder: number) => void
    onClearCategory: (rows: DivisionRangeMatrixRow[]) => void
}) {
    const [openCategoryId, setOpenCategoryId] = useState<string | null>(() => groups[0]?.categoryId ?? null)

    useEffect(() => {
        if (groups.length === 0) {
            setOpenCategoryId(null)
            return
        }
        if (openCategoryId === null || !groups.some((group) => group.categoryId === openCategoryId)) {
            setOpenCategoryId(groups[0].categoryId)
        }
    }, [groups, openCategoryId])

    return (
        <div className="flex flex-col gap-2">
            {groups.map((group) => {
                const isOpen = openCategoryId === group.categoryId

                return (
                    <div key={group.categoryId} className="rounded-lg border border-base-300 bg-base-100">
                        <div className="flex flex-col gap-2 p-4">
                            <div className="flex flex-wrap items-center gap-2">
                                <button
                                    type="button"
                                    className="btn btn-ghost btn-xs btn-square shrink-0"
                                    aria-expanded={isOpen}
                                    aria-label={`${isOpen ? "Collapse" : "Expand"} ${group.categoryName}`}
                                    onClick={() =>
                                        setOpenCategoryId(isOpen ? null : group.categoryId)
                                    }
                                >
                                    {isOpen ? (
                                        <ChevronDownIcon className="w-4 h-4" />
                                    ) : (
                                        <ChevronRightIcon className="w-4 h-4" />
                                    )}
                                </button>
                                <span className="font-medium">{group.categoryName}</span>
                                <button
                                    type="button"
                                    className="badge badge-neutral badge-sm font-normal hover:badge-neutral-focus"
                                    title={`View ${group.participantCount} registered competitors`}
                                    onClick={() =>
                                        onShowBowStyleParticipants(group.categoryName, group.rows)
                                    }
                                >
                                    {group.participantCount} registered
                                </button>
                            </div>
                            {!readOnly ? (
                                <CategoryDayQuickAssign
                                    dayOrders={dayOrders}
                                    rangeCount={rangeCount}
                                    dayOneFrozen={dayOneFrozen}
                                    readOnly={readOnly}
                                    isPending={isPending}
                                    onCategoryDayAction={(dayOrder, rangeNumber) =>
                                        onCategoryDayAction(group.rows, dayOrder, rangeNumber)
                                    }
                                    onClearCategoryDay={(dayOrder) =>
                                        onClearCategoryDay(group.rows, dayOrder)
                                    }
                                    onClearCategory={() => onClearCategory(group.rows)}
                                />
                            ) : null}
                        </div>
                        {isOpen ? (
                            <div className="px-4 pb-4">
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
                        ) : null}
                    </div>
                )
            })}
        </div>
    )
}

function computeTotalsByDay(
    dayOrders: number[],
    rangeCount: number,
    rows: DivisionRangeMatrixRow[]
): DivisionRangeMatrixData["totalsByDay"] {
    const totalsByDay = Object.fromEntries(
        dayOrders.map((dayOrder) => [
            dayOrder,
            Object.fromEntries(Array.from({ length: rangeCount }, (_, index) => [index + 1, 0])) as Record<
                number,
                number
            >,
        ])
    ) as DivisionRangeMatrixData["totalsByDay"]

    for (const row of rows) {
        for (const dayOrder of dayOrders) {
            const rangeNumber = row.rangeByDay[dayOrder]
            if (rangeNumber !== null && rangeNumber !== undefined) {
                totalsByDay[dayOrder][rangeNumber] =
                    (totalsByDay[dayOrder][rangeNumber] ?? 0) + row.registrationCount
            }
        }
    }

    return totalsByDay
}

function matrixWithAssignments(
    matrix: DivisionRangeMatrixData,
    assignments: RangeAssignmentUpdate[]
): DivisionRangeMatrixData {
    if (assignments.length === 0) {
        return matrix
    }

    const rows = matrix.rows.map((row) => {
        const updates = assignments.filter((assignment) => assignment.divisionKey === row.divisionKey)
        if (updates.length === 0) {
            return row
        }

        const rangeByDay = { ...row.rangeByDay }
        for (const update of updates) {
            rangeByDay[update.dayOrder] = update.rangeNumber
        }

        return { ...row, rangeByDay }
    })

    return {
        ...matrix,
        rows,
        totalsByDay: computeTotalsByDay(matrix.dayOrders, matrix.rangeCount, rows),
    }
}

async function persistRangeAssignments(
    championshipId: string,
    assignments: RangeAssignmentUpdate[]
): Promise<void> {
    for (const assignment of assignments) {
        await setChampionshipDivisionRangeAssignment(
            championshipId,
            assignment.dayOrder,
            assignment.divisionKey,
            assignment.rangeNumber
        )
    }
}

async function applyRangeAssignmentsWithAutoFill({
    championshipId,
    assignments,
    reloadMatrix,
    setMatrix,
    routerRefresh,
}: {
    championshipId: string
    assignments: RangeAssignmentUpdate[]
    reloadMatrix: () => Promise<DivisionRangeMatrixData | null>
    setMatrix: Dispatch<SetStateAction<DivisionRangeMatrixData | null>>
    routerRefresh: () => void
}): Promise<DivisionRangeMatrixData | null> {
    if (assignments.length === 0) {
        return reloadMatrix()
    }

    setMatrix((current) => (current ? matrixWithAssignments(current, assignments) : current))
    await persistRangeAssignments(championshipId, assignments)

    let currentMatrix = await reloadMatrix()
    const shouldAutoFill = assignments.some((assignment) => assignment.rangeNumber !== null)

    if (shouldAutoFill && currentMatrix) {
        let autoAssignments = collectSoleAvailableRangeAssignments(
            currentMatrix.rows,
            currentMatrix.dayOrders,
            currentMatrix.rangeCount,
            currentMatrix.dayOneFrozen
        )

        let passes = 0
        while (autoAssignments.length > 0 && passes < currentMatrix.dayOrders.length) {
            setMatrix(matrixWithAssignments(currentMatrix, autoAssignments))
            await persistRangeAssignments(championshipId, autoAssignments)
            currentMatrix = (await reloadMatrix()) ?? currentMatrix
            autoAssignments = collectSoleAvailableRangeAssignments(
                currentMatrix.rows,
                currentMatrix.dayOrders,
                currentMatrix.rangeCount,
                currentMatrix.dayOneFrozen
            )
            passes += 1
        }
    }

    routerRefresh()
    return currentMatrix
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
    const setInfo = useInfoContext()
    const participantsModalRef = useRef<FormModalHandle>(null)
    const skipNextInitialMatrixSyncRef = useRef(false)
    const initialAutoFillDoneRef = useRef(false)
    const matrixRef = useRef<DivisionRangeMatrixData | null>(initialMatrix)
    const [matrix, setMatrix] = useState<DivisionRangeMatrixData | null>(initialMatrix)
    const [modalView, setModalView] = useState<MatrixModalView | null>(null)
    const [isPending, startTransition] = useTransition()

    useEffect(() => {
        matrixRef.current = matrix
    }, [matrix])

    useEffect(() => {
        if (skipNextInitialMatrixSyncRef.current) {
            skipNextInitialMatrixSyncRef.current = false
            return
        }
        setMatrix(initialMatrix)
        matrixRef.current = initialMatrix
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

    const openModal = (view: MatrixModalView) => {
        setModalView(view)
        participantsModalRef.current?.open()
    }

    const openDivisionParticipants = (abbrev: string, divisionKey: string) => {
        openModal({ kind: "division", abbrev, divisionKey })
    }

    const openRangeDayParticipants = (dayOrder: number, rangeNumber: number) => {
        openModal({ kind: "rangeDay", dayOrder, rangeNumber })
    }

    const openBowStyleParticipants = (categoryName: string, rows: DivisionRangeMatrixRow[]) => {
        openModal({ kind: "bowStyle", categoryName, rows })
    }

    const modalContent = useMemo(() => {
        if (!modalView) {
            return null
        }
        if (modalView.kind === "division") {
            return (
                <DivisionParticipantsModal
                    abbrev={modalView.abbrev}
                    participants={participantsByDivision.get(modalView.divisionKey) ?? []}
                />
            )
        }
        if (modalView.kind === "rangeDay") {
            const rows = (matrix?.rows ?? []).filter(
                (row) => row.rangeByDay[modalView.dayOrder] === modalView.rangeNumber
            )
            return (
                <CategoryDivisionsParticipantsModal
                    title={`Day ${modalView.dayOrder} · Range ${modalView.rangeNumber}`}
                    groups={buildCategoryDivisionGroups(rows, participantsByDivision)}
                />
            )
        }
        return (
            <CategoryDivisionsParticipantsModal
                title={modalView.categoryName}
                groups={buildCategoryDivisionGroups(modalView.rows, participantsByDivision)}
            />
        )
    }, [modalView, matrix?.rows, participantsByDivision])

    const reloadMatrix = useCallback(() => {
        return getChampionshipDivisionRangeMatrix(championshipId).then((data) => {
            if (data) {
                matrixRef.current = data
                setMatrix(data)
            }
            return data
        })
    }, [championshipId])

    const applyRangeAssignments = useCallback(
        (assignments: RangeAssignmentUpdate[]) => {
            if (assignments.length === 0) {
                return Promise.resolve(matrixRef.current)
            }

            skipNextInitialMatrixSyncRef.current = true
            setError(undefined)

            return applyRangeAssignmentsWithAutoFill({
                championshipId,
                assignments,
                reloadMatrix,
                setMatrix,
                routerRefresh: () => router.refresh(),
            })
        },
        [championshipId, reloadMatrix, router, setError]
    )

    const handleRangeChange = (divisionKey: string, dayOrder: number, rangeNumber: number | null) => {
        startTransition(() => {
            applyRangeAssignments([{ divisionKey, dayOrder, rangeNumber }]).catch((error) => {
                setError(error instanceof Error ? error.message : "Unable to update range assignment")
            })
        })
    }

    const applyCategoryUpdates = (
        rows: DivisionRangeMatrixRow[],
        dayOrder: number | "all",
        rangeNumber: number | null,
        emptyMessage: string,
        successMessage?: string
    ) => {
        const current = matrixRef.current
        if (!current) {
            return
        }

        const assignments = buildCategoryRangeUpdates(
            rows,
            current.dayOrders,
            dayOrder,
            rangeNumber,
            current.dayOneFrozen
        )

        if (assignments.length === 0) {
            setInfo(emptyMessage)
            return
        }

        setInfo(undefined)
        startTransition(() => {
            applyRangeAssignments(assignments)
                .then(() => {
                    if (successMessage) {
                        setInfo(successMessage)
                    }
                })
                .catch((error) => {
                    setError(error instanceof Error ? error.message : "Unable to update range assignments")
                })
        })
    }

    const handleCategoryDayAction = (
        rows: DivisionRangeMatrixRow[],
        dayOrder: number,
        rangeNumber: number
    ) => {
        applyCategoryUpdates(
            rows,
            dayOrder,
            rangeNumber,
            `No divisions in this category could be assigned to range ${rangeNumber} on day ${dayOrder} (already set or blocked on another day).`
        )
    }

    const handleClearCategoryDay = (rows: DivisionRangeMatrixRow[], dayOrder: number) => {
        applyCategoryUpdates(
            rows,
            dayOrder,
            null,
            `No divisions in this category have an assignment on day ${dayOrder} to clear.`
        )
    }

    const handleClearCategory = (rows: DivisionRangeMatrixRow[]) => {
        const current = matrixRef.current
        if (!current) {
            return
        }

        const skippedFrozenDayOne = categoryHasAssignmentOnFrozenDayOne(rows, current.dayOneFrozen)
        applyCategoryUpdates(
            rows,
            "all",
            null,
            "No assignments in this category to clear.",
            skippedFrozenDayOne
                ? "Cleared this category on all editable days. Day 1 assignments are frozen and were not changed."
                : undefined
        )
    }

    const handleClearDay = (dayOrder: number) => {
        const current = matrixRef.current
        if (!current) {
            return
        }

        const assignments = buildCategoryRangeUpdates(
            current.rows,
            current.dayOrders,
            dayOrder,
            null,
            current.dayOneFrozen
        )

        if (assignments.length === 0) {
            setInfo(`No assignments on day ${dayOrder} to clear.`)
            return
        }

        setInfo(undefined)
        startTransition(() => {
            applyRangeAssignments(assignments).catch((error) => {
                setError(error instanceof Error ? error.message : "Unable to clear day assignments")
            })
        })
    }

    useEffect(() => {
        if (initialAutoFillDoneRef.current || !matrix || readOnly) {
            return
        }

        initialAutoFillDoneRef.current = true

        const autoAssignments = collectSoleAvailableRangeAssignments(
            matrix.rows,
            matrix.dayOrders,
            matrix.rangeCount,
            matrix.dayOneFrozen
        )

        if (autoAssignments.length === 0) {
            return
        }

        startTransition(() => {
            applyRangeAssignments(autoAssignments).catch((error) => {
                setError(error instanceof Error ? error.message : "Unable to update range assignment")
            })
        })
    }, [applyRangeAssignments, matrix, readOnly, setError])

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
                    <DivisionRangeTotalsHeader
                        dayOrders={matrix.dayOrders}
                        totalsByDay={matrix.totalsByDay}
                        dayOneFrozen={matrix.dayOneFrozen}
                        readOnly={readOnly}
                        isPending={isPending}
                        onRangeDayClick={openRangeDayParticipants}
                        onClearDay={handleClearDay}
                    />
                </div>
            </div>
            <BowStyleAccordion
                groups={bowStyleGroups}
                dayOrders={matrix.dayOrders}
                rangeCount={matrix.rangeCount}
                dayOneFrozen={matrix.dayOneFrozen}
                readOnly={readOnly}
                isPending={isPending}
                onRangeChange={handleRangeChange}
                onShowParticipants={openDivisionParticipants}
                onShowBowStyleParticipants={openBowStyleParticipants}
                onCategoryDayAction={handleCategoryDayAction}
                onClearCategoryDay={handleClearCategoryDay}
                onClearCategory={handleClearCategory}
            />
            <p className="text-sm text-base-content/70">
                Assign every division to a range on each day before enrolling competitors on multi-range championships.
                A division cannot use the same range on more than one day. Unassigning a division unenrolls affected
                competitors from that range.
            </p>
            <FormModal ref={participantsModalRef}>{modalContent}</FormModal>
        </div>
    )
}
