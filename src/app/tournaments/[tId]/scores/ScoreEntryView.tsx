"use client"

import useErrorContext from "@/components/errors/ErrorContext"
import { use, useState } from "react"
import useTournamentContext from "../TournamentContext"
import { TournamentScores, updateScore } from "../scoreActions"
import CategoryScoreView from "./CategoryScoreView"
import GroupScoreView from "./GroupScoreView"
import SharingDrawer from "./SharingDrawer"

type ViewMode = 'group' | 'category'

export default function ScoreEntryView({ scores }: { scores: Promise<TournamentScores> }) {
    const [viewMode, setViewMode] = useState<ViewMode>('group')
    const [isSharingDrawerOpen, setIsSharingDrawerOpen] = useState(false)
    const tCtx = useTournamentContext()
    const scoresData = use(scores)
    const setError = useErrorContext()

    const t = tCtx?.getTournament()

    if (!t?.id) {
        return (
            <div className="w-full p-4 space-y-6">
                No tournament open.
            </div>
        )
    }

    const handleScoreChange = async (participantId: string, score: number | null) => {
        try {
            await updateScore(participantId, t.id, score)
        } catch (error) {
            console.error("Failed to update score:", error)
            setError(error instanceof Error ? error.message : 'An error occurred')
        }
    }

    // Check if all participants have completed scores
    const allScoresComplete = scoresData.every(p => !!p.participantScore)
    const isPublished = t.isPublished


    return (
        <div className="w-full p-4 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between md:flex-row flex-col">
                <div>
                    <h1 className="text-2xl font-bold hidden md:block">Score Entry</h1>
                    <p className="text-base-content/70">
                        Enter scores for {scoresData.length} participants
                    </p>
                    {isPublished && (
                        <div className="badge badge-success mt-1">Results Published</div>
                    )}
                </div>

                <div className="flex gap-2">
                    <button
                        className={`btn ${viewMode === 'group' ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => setViewMode('group')}
                    >
                        By Group
                    </button>
                    <button
                        className={`btn ${viewMode === 'category' ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => setViewMode('category')}
                    >
                        By Category
                    </button>
                    {allScoresComplete && (
                        <button
                            className="hidden sm:block btn btn-primary"
                            onClick={() => setIsSharingDrawerOpen(true)}
                        >
                            Sharing
                        </button>
                    )}
                </div>
            </div>

            {/* Score Views */}
            {viewMode === 'group' ? (
                <GroupScoreView
                    participants={scoresData}
                    onScoreChange={handleScoreChange}
                />
            ) : (
                <CategoryScoreView
                    participants={scoresData}
                    onScoreChange={handleScoreChange}
                />
            )}

            {/* Sharing Drawer */}
            <SharingDrawer
                isOpen={isSharingDrawerOpen}
                onClose={() => setIsSharingDrawerOpen(false)}
                allScoresComplete={allScoresComplete}
            />
        </div>
    )
}

