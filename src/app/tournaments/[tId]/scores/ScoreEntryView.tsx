"use client"

import useErrorContext from "@/components/errors/ErrorContext"
import { useState } from "react"
import { publishResults, TournamentScoresData, updateScore } from "../scoreActions"
import CategoryScoreView from "./CategoryScoreView"
import GroupScoreView from "./GroupScoreView"

interface ScoreEntryViewProps {
    scoresData: TournamentScoresData
}

type ViewMode = 'group' | 'category'

export default function ScoreEntryView({ scoresData }: ScoreEntryViewProps) {
    const [viewMode, setViewMode] = useState<ViewMode>('group')
    const [isPublishing, setIsPublishing] = useState(false)
    const setError = useErrorContext()

    const handleScoreChange = async (participantId: string, score: number | null, isComplete: boolean) => {
        try {
            await updateScore(participantId, scoresData.tournament.id, score, isComplete)
        } catch (error) {
            setError(error instanceof Error ? error.message : 'An error occurred')
        }
    }

    const handlePublishResults = async () => {
        setIsPublishing(true)
        try {
            await publishResults(scoresData.tournament.id)
            setError("Results published successfully!")
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Failed to publish results')
        } finally {
            setIsPublishing(false)
        }
    }

    // Check if all participants have completed scores
    const allScoresComplete = scoresData.participants.every(p => p.isComplete)
    const isPublished = scoresData.tournament.isPublished


    return (
        <div className="w-full p-4 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Score Entry</h1>
                    <p className="text-base-content/70">
                        Enter scores for {scoresData.participants.length} participants
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
                    {!isPublished && (
                        <button
                            className={`btn ${allScoresComplete ? 'btn-success' : 'btn-disabled'}`}
                            onClick={handlePublishResults}
                            disabled={!allScoresComplete || isPublishing}
                        >
                            {isPublishing ? 'Publishing...' : 'Publish Results'}
                        </button>
                    )}
                </div>
            </div>

            {/* Score Views */}
            {viewMode === 'group' ? (
                <GroupScoreView
                    participants={scoresData.participants}
                    onScoreChange={handleScoreChange}
                />
            ) : (
                <CategoryScoreView
                    participants={scoresData.participants}
                    onScoreChange={handleScoreChange}
                />
            )}
        </div>
    )
}

