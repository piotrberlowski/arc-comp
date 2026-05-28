import { isDayRangeAssignmentEditable } from "@/lib/championshipRangeRules"
import MatrixDayColumnsTable from "./MatrixDayColumnsTable"
import { useDivisionRangeMatrix } from "./DivisionRangeMatrixContext"

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

export default function DivisionRangeMatrixTotalsHeader() {
    const {
        matrix,
        readOnly,
        isPending,
        showRangeDayParticipants,
        clearDay,
    } = useDivisionRangeMatrix()

    return (
        <MatrixDayColumnsTable dayOrders={matrix.dayOrders}>
            <thead>
                <tr className="font-medium text-xs">
                    <th className="text-left">Total per range</th>
                    <th />
                    {matrix.dayOrders.map((dayOrder) => (
                        <th key={dayOrder} className="text-center font-normal text-base-content/70">
                            <div className="flex flex-col items-center gap-1">
                                <span>D{dayOrder}</span>
                                {!readOnly && isDayRangeAssignmentEditable(dayOrder, matrix.dayOneFrozen) ? (
                                    <button
                                        type="button"
                                        className="btn btn-ghost btn-xs min-h-0 h-6 px-1 font-normal"
                                        disabled={isPending}
                                        onClick={() => clearDay(dayOrder)}
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
                    {matrix.dayOrders.map((dayOrder) => (
                        <td key={dayOrder} className="text-center px-1">
                            <DayRangeTotals
                                dayOrder={dayOrder}
                                totals={matrix.totalsByDay[dayOrder] ?? {}}
                                onRangeDayClick={showRangeDayParticipants}
                            />
                        </td>
                    ))}
                </tr>
            </tbody>
        </MatrixDayColumnsTable>
    )
}
