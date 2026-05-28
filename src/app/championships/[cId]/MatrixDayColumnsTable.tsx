import type { ReactNode } from "react"

export default function MatrixDayColumnsTable({
    dayOrders,
    children,
}: {
    dayOrders: number[]
    children: ReactNode
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
                {children}
            </table>
        </div>
    )
}
