"use client"

interface SortControlsProps {
    sortBy: string
    onSortChange: (sortBy: string) => void
    itemCount: number
    itemName: string
    sortOptions: { value: string; label: string; sortFunction?: (a: unknown, b: unknown) => number }[]
}

export default function SortControls({
    sortBy,
    onSortChange,
    itemCount,
    itemName,
    sortOptions
}: SortControlsProps) {
    return (
        <div className="p-4 border-b border-base-content/5">
            <div className="flex items-center gap-4">
                <label className="text-sm font-medium">Sort by:</label>
                <select
                    className="select select-bordered select-sm"
                    value={sortBy}
                    onChange={(e) => onSortChange(e.target.value)}
                >
                    {sortOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                <span className="text-sm text-base-content/70">
                    {itemCount} {itemName}{itemCount !== 1 ? 's' : ''}
                </span>
            </div>
        </div>
    )
}

