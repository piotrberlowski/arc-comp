import { getChampionshipDayLinkForTournament } from "../tournamentActions"
import ChampionshipDayBackNav from "./ChampionshipDayBackNav"

export default async function TournamentIdLayout({
    children,
    params,
}: {
    children: React.ReactNode
    params: Promise<{ tId: string }>
}) {
    const { tId } = await params
    const championshipDayLink = await getChampionshipDayLinkForTournament(tId)

    return (
        <>
            {championshipDayLink && <ChampionshipDayBackNav link={championshipDayLink} />}
            {children}
        </>
    )
}
