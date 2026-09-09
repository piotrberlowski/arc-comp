export default function ParticipantVisibleCount({
    visible,
    total,
}: {
    visible: number
    total: number
}) {
    return (
        <span className="text-sm text-base-content/70 whitespace-nowrap">
            Showing {visible} out of {total}
        </span>
    )
}
