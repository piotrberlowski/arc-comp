import { isDivisionRangeBlockedOnOtherDay } from "@/lib/championshipRangeRules"
import type { DivisionRangeMatrixRow } from "@/lib/championshipDivisionRangeMatrix"
import { useDivisionRangeMatrix } from "./DivisionRangeMatrixContext"
import MatrixDayColumnsTable from "./MatrixDayColumnsTable"

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

function RangeSelect({
    row,
    dayOrder,
    frozen,
}: {
    row: DivisionRangeMatrixRow
    dayOrder: number
    frozen: boolean
}) {
    const { matrix, readOnly, isPending, assignRange } = useDivisionRangeMatrix()
    const rangeNumber = row.rangeByDay[dayOrder] ?? null

    return (
        <select
            className="select select-bordered select-xs w-14 min-h-0 h-8 px-1"
            value={rangeNumber ?? ""}
            disabled={readOnly || isPending || frozen}
            aria-label={`Day ${dayOrder} range for ${row.divisionKey}`}
            onChange={(event) => {
                const value = event.target.value
                assignRange(row.divisionKey, dayOrder, value === "" ? null : Number(value))
            }}
        >
            <option value="">—</option>
            {Array.from({ length: matrix.rangeCount }, (_, index) => {
                const option = index + 1
                const blocked = isDivisionRangeBlockedOnOtherDay(row.rangeByDay, dayOrder, option)
                return (
                    <option key={option} value={option} disabled={blocked}>
                        R{option}
                    </option>
                )
            })}
        </select>
    )
}

export default function DivisionRangeMatrixTable({ rows }: { rows: DivisionRangeMatrixRow[] }) {
    const { matrix, showDivisionParticipants } = useDivisionRangeMatrix()

    return (
        <MatrixDayColumnsTable dayOrders={matrix.dayOrders}>
            <thead>
                <tr>
                    <th className="font-mono text-xs">Div</th>
                    <th className="text-right text-xs">Reg</th>
                    {matrix.dayOrders.map((dayOrder) => (
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
                            <button
                                type="button"
                                className="font-mono text-xs link link-hover text-left"
                                title={`View ${row.registrationCount} registered competitors`}
                                onClick={() => showDivisionParticipants(row.abbrev, row.divisionKey)}
                            >
                                {row.abbrev}
                            </button>
                        </td>
                        <td className="text-right text-xs">
                            <RegistrationCountButton
                                count={row.registrationCount}
                                onClick={() => showDivisionParticipants(row.abbrev, row.divisionKey)}
                            />
                        </td>
                        {matrix.dayOrders.map((dayOrder) => (
                            <td key={dayOrder} className="text-center px-1">
                                <RangeSelect
                                    row={row}
                                    dayOrder={dayOrder}
                                    frozen={matrix.dayOneFrozen && dayOrder === 1}
                                />
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </MatrixDayColumnsTable>
    )
}
