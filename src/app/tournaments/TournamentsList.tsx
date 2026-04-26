"use client"

import { RoundFormat, Tournament } from "@/generated/prisma/browser"
import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import TournamentCard from "./TournamentCard"
import TournamentHeader from "./TournamentHeader"
import { listTournamentsForClubs } from "./tournamentActions"

interface tf extends Tournament {
    format: RoundFormat
}

export default function TournamentsList({ clubs }: { clubs: string[] }) {
    const { data: session } = useSession()
    const [tournaments, setTournaments] = useState<tf[]>(new Array<tf>())
    const [includeArchive, setIncludeArchive] = useState(false)

    useEffect(
        () => {
            listTournamentsForClubs(clubs, includeArchive).then(t => setTournaments(t))
        }, [clubs, includeArchive]
    )

    function onTournamentArchived(id: string) {
        if (!includeArchive) {
            setTournaments(prev => prev.filter(t => t.id !== id))
        }
    }

    function onTournamentUnarchived(tournament: tf) {
        setTournaments(prev => prev.map(t => t.id === tournament.id ? tournament : t))
    }

    return (
        <div className="w-full">
            <TournamentHeader clubs={clubs} />
            <div className="divider">
                <label className="label">
                    <input type="checkbox" checked={includeArchive} className="checkbox checkbox-accent rounded-lg" onChange={evt => setIncludeArchive(evt.target.checked)} />
                    <span className="text-accent">Include Archived</span>
                </label>
            </div>
            <div className="w-full flex flex-wrap gap-4 mt-5 bg-primary p-5 rounded-sm justify-center">
                {tournaments && tournaments.map(t => (<TournamentCard key={`tournament-${t.id}`} tournament={t} isAdmin={!!session?.isAdmin} onArchived={onTournamentArchived} onUnarchived={onTournamentUnarchived} />))}
            </div>
        </div>
    )

}