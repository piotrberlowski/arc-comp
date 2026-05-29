import { buildPublicChampionshipPrintPath } from "@/lib/publicChampionshipUrls"
import { PrinterIcon } from "@heroicons/react/24/outline"
import Link from "next/link"

export default function ChampionshipDayGroupsPrintLink({
    championshipId,
    dayOrder,
}: {
    championshipId: string
    dayOrder: number
}) {
    return (
        <Link
            href={buildPublicChampionshipPrintPath(championshipId, dayOrder)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost btn-sm gap-1"
            title={`Print published Day ${dayOrder} target groups`}
        >
            <PrinterIcon className="h-4 w-4" />
            Print groups
        </Link>
    )
}
