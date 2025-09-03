"use client"

import { useEffect, useState } from "react"
import { listTournamentsForClubs } from "./tournamentActions"
import { RoundFormat, Tournament } from "@prisma/client"
import TournamentHeader from "./TournamentHeader"
import TournamentCard from "./TournamentCard"

interface tf extends Tournament {
    format: RoundFormat
}

export default function TournamentsList({ clubs }: { clubs: string[] }) {
    const [tournaments, setTournaments] = useState<tf[]>(new Array<tf>())
    const [includeArchive, setIncludeArchive] = useState(false)

    useEffect(
        () => {
            listTournamentsForClubs(clubs, includeArchive).then(t => setTournaments(t))
        }, [includeArchive]
    )

    function onTournamentArchived(id: string) {
        if (!includeArchive) {
            setTournaments(tournaments.filter(t => t.id !== id))
        }
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
                {tournaments && tournaments.map(t => (<TournamentCard key={`tournament-${t.id}`} tournament={t} onArchived={onTournamentArchived}/>))}
            </div>
        </div>
    )

}