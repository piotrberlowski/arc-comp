import { competitorsRegisteredLabel } from "../competitorsRegisteredLabel"
import ChampionshipNameEdit from "./ChampionshipNameEdit"
import ChampionshipSharingButton from "./ChampionshipSharingButton"

export default function ChampionshipDetailHeader({
    championshipId,
    name,
    organizerClub,
    registrationCount,
    isArchive,
    readOnly,
}: {
    championshipId: string
    name: string
    organizerClub: string
    registrationCount: number
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
