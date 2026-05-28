"use client"

import { isDayRangeAssignmentEditable } from "@/lib/championshipRangeRules"
import type { MatrixBowStyleGroup } from "@/lib/divisionRangeMatrixRows"
import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/24/outline"
import { useEffect, useState } from "react"
import { useDivisionRangeMatrix } from "./DivisionRangeMatrixContext"
import DivisionRangeMatrixTable from "./DivisionRangeMatrixTable"

function CategoryDayQuickAssign({ group }: { group: MatrixBowStyleGroup }) {
    const {
        matrix,
        readOnly,
        isPending,
        assignCategoryDay,
        clearCategoryDay,
        clearCategory,
    } = useDivisionRangeMatrix()

    if (readOnly) {
        return null
    }

    return (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-normal pl-9">
            <button
                type="button"
                className="btn btn-ghost btn-xs min-h-0 h-7 px-1.5"
                disabled={isPending}
                onClick={() => clearCategory(group.rows)}
            >
                Clear category
            </button>
            {matrix.dayOrders.map((dayOrder) => {
                const editable = isDayRangeAssignmentEditable(dayOrder, matrix.dayOneFrozen)

                return (
                    <div key={dayOrder} className="flex items-center gap-1">
                        <span className="text-base-content/70">D{dayOrder}</span>
                        <select
                            className="select select-bordered select-xs w-[4.75rem] min-h-0 h-7 px-1"
                            disabled={isPending || !editable}
                            aria-label={`Assign all divisions on day ${dayOrder}`}
                            defaultValue=""
                            onChange={(event) => {
                                const value = event.target.value
                                if (value === "") {
                                    return
                                }
                                assignCategoryDay(group.rows, dayOrder, Number(value))
                                event.target.value = ""
                            }}
                        >
                            <option value="">All →</option>
                            {Array.from({ length: matrix.rangeCount }, (_, index) => {
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
                            disabled={isPending || !editable}
                            onClick={() => clearCategoryDay(group.rows, dayOrder)}
                        >
                            Clear D{dayOrder}
                        </button>
                    </div>
                )
            })}
        </div>
    )
}

function MatrixBowStylePanel({
    group,
    isOpen,
    onToggle,
}: {
    group: MatrixBowStyleGroup
    isOpen: boolean
    onToggle: () => void
}) {
    const { showBowStyleParticipants } = useDivisionRangeMatrix()

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
                        onClick={() => showBowStyleParticipants(group.categoryName, group.rows)}
                    >
                        {group.participantCount} registered
                    </button>
                </div>
                <CategoryDayQuickAssign group={group} />
            </div>
            {isOpen ? (
                <div className="px-4 pb-4">
                    <DivisionRangeMatrixTable rows={group.rows} />
                </div>
            ) : null}
        </div>
    )
}

export default function MatrixBowStylePanels() {
    const { bowStyleGroups } = useDivisionRangeMatrix()
    const [openCategoryId, setOpenCategoryId] = useState<string | null>(
        () => bowStyleGroups[0]?.categoryId ?? null
    )

    useEffect(() => {
        if (bowStyleGroups.length === 0) {
            setOpenCategoryId(null)
            return
        }
        if (
            openCategoryId === null ||
            !bowStyleGroups.some((group) => group.categoryId === openCategoryId)
        ) {
            setOpenCategoryId(bowStyleGroups[0].categoryId)
        }
    }, [bowStyleGroups, openCategoryId])

    return (
        <div className="flex flex-col gap-2">
            {bowStyleGroups.map((group) => (
                <MatrixBowStylePanel
                    key={group.categoryId}
                    group={group}
                    isOpen={openCategoryId === group.categoryId}
                    onToggle={() =>
                        setOpenCategoryId(
                            openCategoryId === group.categoryId ? null : group.categoryId
                        )
                    }
                />
            ))}
        </div>
    )
}
