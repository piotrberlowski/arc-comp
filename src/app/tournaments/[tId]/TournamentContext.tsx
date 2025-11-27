'use client'

import { Tournament } from "@/generated/prisma/browser";
import { format } from "date-fns/format";
import React, { createContext, useContext, useTransition } from "react";
import { TournamentUpdate, updateTournament } from "../tournamentActions";
import { TOURNAMENT_DATE_FORMAT } from "../utils";
import { assignParticipantToGroup, setTargetCaptain, unassignParticipantFromGroup } from "./groupActions";


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

    public getTournamentId() {
        return this.tournament.id
    }

    public updateTournament(t: TournamentUpdate, done: (e?: string) => void) {
        updateTournament(this.tournament.id, t)
            .then(
                t => {
                    this.tournament = t
                    done()
                }
            )
            .catch(e => {
                console.error("Failed to update tournament:", e)
                done(e)
            })
    }

    // Group assignment methods
    public async assignParticipantToGroup(participantId: string, groupNumber: number): Promise<void> {
        return assignParticipantToGroup(participantId, this.tournament.id, groupNumber)
    }

    public async unassignParticipantFromGroup(participantId: string): Promise<void> {
        return unassignParticipantFromGroup(participantId, this.tournament.id)
    }

    public async setTargetCaptain(participantId: string, groupNumber: number): Promise<void> {
        return setTargetCaptain(participantId, this.tournament.id, groupNumber)
    }
}

const TournamentContext = createContext<TournamentEditController | null>(null)

export function TournamentEditContextProvider({ children, tournament }: { children: React.ReactNode, tournament: Tournament }) {
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

// Custom hook for group assignment functionality
export function useGroupAssignment() {
    const context = useTournamentContext()
    const [isPending, startTransition] = useTransition()

    if (!context) {
        throw new Error('useGroupAssignment must be used within TournamentEditContextProvider')
    }

    const handleAssignParticipant = async (participantId: string, groupNumber: number) => {
        return new Promise<void>((resolve, reject) => {
            startTransition(async () => {
                try {
                    await context.assignParticipantToGroup(participantId, groupNumber)
                    resolve()
                } catch (err) {
                    reject(err)
                }
            })
        })
    }

    const handleUnassignParticipant = async (participantId: string) => {
        return new Promise<void>((resolve, reject) => {
            startTransition(async () => {
                try {
                    await context.unassignParticipantFromGroup(participantId)
                    resolve()
                } catch (err) {
                    reject(err)
                }
            })
        })
    }

    const handleMoveParticipant = async (participantId: string, newGroupNumber: number) => {
        return new Promise<void>((resolve, reject) => {
            startTransition(async () => {
                try {
                    await context.assignParticipantToGroup(participantId, newGroupNumber)
                    resolve()
                } catch (err) {
                    reject(err)
                }
            })
        })
    }

    const handleSetTargetCaptain = async (participantId: string, groupNumber: number) => {
        return new Promise<void>((resolve, reject) => {
            startTransition(async () => {
                try {
                    await context.setTargetCaptain(participantId, groupNumber)
                    resolve()
                } catch (err) {
                    reject(err)
                }
            })
        })
    }

    return {
        tournamentId: context.getTournamentId(),
        isPending,
        handleAssignParticipant,
        handleUnassignParticipant,
        handleMoveParticipant,
        handleSetTargetCaptain
    }
}