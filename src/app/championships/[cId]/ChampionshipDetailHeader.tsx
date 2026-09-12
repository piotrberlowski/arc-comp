import type { ChampionshipMedalCount } from "@/lib/championshipMedalCount"
import { competitorsRegisteredLabel } from "../competitorsRegisteredLabel"
import ChampionshipMedalCountButton from "./ChampionshipMedalCountButton"
import ChampionshipNameEdit from "./ChampionshipNameEdit"
import ChampionshipSharingButton from "./ChampionshipSharingButton"

export default function ChampionshipDetailHeader({
    championshipId,
    name,
    organizerClub,
    registrationCount,
    medalCount,
    isArchive,
    readOnly,
}: {
    championshipId: string
    name: string
    organizerClub: string
    registrationCount: number
    medalCount: ChampionshipMedalCount
    isArchive: boolean
    readOnly: boolean
}) {
    return (
        <>
            <div className="flex flex-wrap items-baseline justify-between gap-2 mb-6">
                <ChampionshipNameEdit
                    championshipId={championshipId}
                    initialName={name}
                    readOnly={readOnly}
                />
                <div className="flex flex-wrap items-center gap-2">
                    <ChampionshipMedalCountButton medalCount={medalCount} />
                    {!readOnly ? (
                        <ChampionshipSharingButton championshipId={championshipId} readOnly={readOnly} />
                    ) : null}
                    {isArchive ? (
                        <span className="badge badge-lg badge-warning">Archived</span>
                    ) : null}
                    <span className="badge badge-lg badge-info badge-outline">{organizerClub}</span>
                </div>
            </div>
            <p className="text-sm text-base-content/70 mb-4">
                {competitorsRegisteredLabel(registrationCount)}.
            </p>
        </>
    )
}
