import { isDivisionRangeBlockedOnOtherDay } from "@/lib/championshipRangeRules"
import type { DivisionRangeMatrixRow } from "@/lib/championshipDivisionRangeMatrix"
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

export default function DivisionRangeMatrixTable({
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
        <MatrixDayColumnsTable dayOrders={dayOrders}>
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
                            <button
                                type="button"
                                className="font-mono text-xs link link-hover text-left"
                                title={`View ${row.registrationCount} registered competitors`}
                                onClick={() => onShowParticipants(row.abbrev, row.divisionKey)}
                            >
                                {row.abbrev}
                            </button>
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
        </MatrixDayColumnsTable>
    )
}
