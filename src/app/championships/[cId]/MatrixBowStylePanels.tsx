"use client"

import { isDayRangeAssignmentEditable } from "@/lib/championshipRangeRules"
import type { MatrixBowStyleGroup } from "@/lib/divisionRangeMatrixRows"
import type { DivisionRangeMatrixRow } from "@/lib/championshipDivisionRangeMatrix"
import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/24/outline"
import { useEffect, useState } from "react"
import DivisionRangeMatrixTable from "./DivisionRangeMatrixTable"

function CategoryDayQuickAssignDay({
    dayOrder,
    rangeCount,
    editable,
    readOnly,
    isPending,
    onCategoryDayAction,
    onClearCategoryDay,
}: {
    dayOrder: number
    rangeCount: number
    editable: boolean
    readOnly: boolean
    isPending: boolean
    onCategoryDayAction: (dayOrder: number, rangeNumber: number) => void
    onClearCategoryDay: (dayOrder: number) => void
}) {
    return (
        <div className="flex items-center gap-1">
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
            {dayOrders.map((dayOrder) => (
                <CategoryDayQuickAssignDay
                    key={dayOrder}
                    dayOrder={dayOrder}
                    rangeCount={rangeCount}
                    editable={isDayRangeAssignmentEditable(dayOrder, dayOneFrozen)}
                    readOnly={readOnly}
                    isPending={isPending}
                    onCategoryDayAction={onCategoryDayAction}
                    onClearCategoryDay={onClearCategoryDay}
                />
            ))}
        </div>
    )
}

function MatrixBowStylePanel({
    group,
    isOpen,
    dayOrders,
    rangeCount,
    dayOneFrozen,
    readOnly,
    isPending,
    onToggle,
    onRangeChange,
    onShowParticipants,
    onShowBowStyleParticipants,
    onCategoryDayAction,
    onClearCategoryDay,
    onClearCategory,
}: {
    group: MatrixBowStyleGroup
    isOpen: boolean
    dayOrders: number[]
    rangeCount: number
    dayOneFrozen: boolean
    readOnly: boolean
    isPending: boolean
    onToggle: () => void
    onRangeChange: (divisionKey: string, dayOrder: number, rangeNumber: number | null) => void
    onShowParticipants: (abbrev: string, divisionKey: string) => void
    onShowBowStyleParticipants: (categoryName: string, rows: DivisionRangeMatrixRow[]) => void
    onCategoryDayAction: (rows: DivisionRangeMatrixRow[], dayOrder: number, rangeNumber: number) => void
    onClearCategoryDay: (rows: DivisionRangeMatrixRow[], dayOrder: number) => void
    onClearCategory: (rows: DivisionRangeMatrixRow[]) => void
}) {
    return (
        <div className="rounded-lg border border-base-300 bg-base-100">
            <div className="flex flex-col gap-2 p-4">
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        className="btn btn-ghost btn-xs btn-square shrink-0"
                        aria-expanded={isOpen}
                        aria-label={`${isOpen ? "Collapse" : "Expand"} ${group.categoryName}`}
                        onClick={onToggle}
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
                        onClick={() => onShowBowStyleParticipants(group.categoryName, group.rows)}
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
                        onClearCategoryDay={(dayOrder) => onClearCategoryDay(group.rows, dayOrder)}
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
}

export default function MatrixBowStylePanels({
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
            {groups.map((group) => (
                <MatrixBowStylePanel
                    key={group.categoryId}
                    group={group}
                    isOpen={openCategoryId === group.categoryId}
                    dayOrders={dayOrders}
                    rangeCount={rangeCount}
                    dayOneFrozen={dayOneFrozen}
                    readOnly={readOnly}
                    isPending={isPending}
                    onToggle={() =>
                        setOpenCategoryId(
                            openCategoryId === group.categoryId ? null : group.categoryId
                        )
                    }
                    onRangeChange={onRangeChange}
                    onShowParticipants={onShowParticipants}
                    onShowBowStyleParticipants={onShowBowStyleParticipants}
                    onCategoryDayAction={onCategoryDayAction}
                    onClearCategoryDay={onClearCategoryDay}
                    onClearCategory={onClearCategory}
                />
            ))}
        </div>
    )
}
