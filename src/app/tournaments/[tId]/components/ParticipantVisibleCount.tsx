export default function ParticipantVisibleCount({
    visible,
    total,
}: {
    visible: number
    total: number
}) {
    return (
        <input className="hidden md:inline input input-bordered input-xs md:input-sm whitespace-nowrap max-w-max" placeholder={`${visible}/${total} shown`} disabled />
    )
}
