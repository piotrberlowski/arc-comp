'use client'

import { Tournament } from "@prisma/client";
import { format } from "date-fns/format";
import React, { createContext, useContext } from "react";
import { TournamentUpdate, updateTournament } from "../tournamentActions";
import { TOURNAMENT_DATE_FORMAT } from "../utils";


export class TournamentEditController {
    private tournament: Tournament

    public constructor(tournament: Tournament) {
        this.tournament = tournament
    }

    public getTournamentDate() {
        return format(this.tournament.date, TOURNAMENT_DATE_FORMAT)
    }

    public getTournament() {
        return this.tournament
    }

    public updateTournament(t:TournamentUpdate, done: (e?:string)=>void) {
        updateTournament(this.tournament.id, t)
        .then(
            t => {
                this.tournament = t
                done()
            }
        )
        .catch(e => done(e))
    }


}

const TournamentContext = createContext<TournamentEditController|null>(null)

export function TournamentEditContextProvider({children, tournament}:{children: React.ReactNode, tournament: Tournament}) {
    const controller = new TournamentEditController(tournament)
    return (
        <TournamentContext.Provider value={controller}>
            {children}
        </TournamentContext.Provider>
    )
}

export default function useTournamentContext() {
    return useContext(TournamentContext)
}