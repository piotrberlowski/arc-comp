"use client"

import { createContext, useContext } from "react"

export interface ScoreActions {
    setScore: (participantId: string, score: number) => Promise<void>
    clear: (participantId: string) => Promise<void>
    setDNF: (participantId: string) => Promise<void>
    setDNC: (participantId: string) => Promise<void>
}

const ScoreActionsContext = createContext<ScoreActions | null>(null)

export function ScoreActionsProvider({ 
    children, 
    actions 
}: { 
    children: React.ReactNode
    actions: ScoreActions 
}) {
    return (
        <ScoreActionsContext.Provider value={actions}>
            {children}
        </ScoreActionsContext.Provider>
    )
}

export function useScoreActions(): ScoreActions {
    const context = useContext(ScoreActionsContext)
    if (!context) {
        throw new Error("useScoreActions must be used within a ScoreActionsProvider")
    }
    return context
}
