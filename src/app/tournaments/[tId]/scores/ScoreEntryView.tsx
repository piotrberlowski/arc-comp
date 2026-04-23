"use client"

import useErrorContext from "@/components/errors/ErrorContext"
import { findTiebreakers, TiebreakerGroup } from "@/lib/scoreUtils"
import { use, useMemo, useState } from "react"
import useTournamentContext from "../TournamentContext"
import { clearScore, setDNC, setDNF, setScore, TournamentResults, updateShootoffScore, ParticipantWithResult } from "../scoreActions"
import CategoryScoreView from "./CategoryScoreView"
import GroupScoreView from "./GroupScoreView"
import { ScoreActionsProvider } from "./ScoreActionsContext"
import SharingDrawer from "./SharingDrawer"
import TiebreakersSection from "./TiebreakersSection"

type ViewMode = 'group' | 'category'

function computeTiebreakers(resultsData: ParticipantWithResult[], allResultsComplete: boolean): TiebreakerGroup[] {
    if (!allResultsComplete) return []
    const participantsWithResults = resultsData
        .filter(p => p.result)
        .map(p => ({
            id: p.id,
            name: p.name,
            categoryId: p.categoryId,
            ageGroupId: p.ageGroupId,
            genderGroup: p.genderGroup,
            result: p.result!
        }))
    return findTiebreakers(participantsWithResults)
}

function computeUnresolvedTieParticipantIds(tiebreakers: TiebreakerGroup[]): Set<string> {
    const ids = new Set<string>()
    for (const group of tiebreakers) {
        if (!group.isResolved) {
            for (const p of group.participants) {
                ids.add(p.participantId)
            }
        }
    }
    return ids
}

export default function ScoreEntryView({ results }: { results: Promise<TournamentResults> }) {
    const [viewMode, setViewMode] = useState<ViewMode>('group')
    const [isSharingDrawerOpen, setIsSharingDrawerOpen] = useState(false)
    const tCtx = useTournamentContext()
    const resultsData = use(results)
    const setError = useErrorContext()

    const t = tCtx?.getTournament()

    if (!t?.id) {
        return (
            <div className="w-full p-4 space-y-6">
                No tournament open.
            </div>
        )
    }

    const withErrorHandling = <T extends unknown[]>(
        fn: (...args: T) => Promise<void>,
        errorMsg: string
    ) => async (...args: T) => {
        try {
            await fn(...args)
        } catch (error) {
            console.error(errorMsg, error)
            setError(error instanceof Error ? error.message : 'An error occurred')
        }
    }

    const scoreActions = {
        setScore: withErrorHandling(
            (participantId: string, score: number) => setScore(participantId, t.id, score),
            "Failed to set score:"
        ),
        clear: withErrorHandling(
            (participantId: string) => clearScore(participantId, t.id),
            "Failed to clear score:"
        ),
        setDNF: withErrorHandling(
            (participantId: string) => setDNF(participantId, t.id),
            "Failed to set DNF:"
        ),
        setDNC: withErrorHandling(
            (participantId: string) => setDNC(participantId, t.id),
            "Failed to set DNC:"
        ),
    }
    const handleShootoff = withErrorHandling(
        (participantId: string, shootoff: number) => updateShootoffScore(participantId, t.id, shootoff),
        "Failed to update shootoff:"
    )

    const allResultsComplete = resultsData.every(p => !!p.result)
    const isPublished = t.isPublished

    const tiebreakers = useMemo(
        () => computeTiebreakers(resultsData, allResultsComplete),
        [resultsData, allResultsComplete]
    )

    const unresolvedTieParticipantIds = useMemo(
        () => computeUnresolvedTieParticipantIds(tiebreakers),
        [tiebreakers]
    )


    return (
        <ScoreActionsProvider actions={scoreActions}>
            <div className="w-full p-4 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between md:flex-row flex-col">
                    <div>
                        <h1 className="text-2xl font-bold hidden md:block">Score Entry</h1>
                        <p className="text-base-content/70">
                            Enter scores for {resultsData.length} participants
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
                        {allResultsComplete && (
                            <button
                                className="hidden sm:block btn btn-primary"
                                onClick={() => setIsSharingDrawerOpen(true)}
                            >
                                Sharing
                            </button>
                        )}
                    </div>
                </div>

                {/* Tiebreakers Section - at top for visibility */}
                {tiebreakers.length > 0 && (
                    <TiebreakersSection
                        tiebreakers={tiebreakers}
                        onShootoffChange={handleShootoff}
                    />
                )}

                {/* Score Views */}
                {viewMode === 'group' ? (
                    <GroupScoreView participants={resultsData} />
                ) : (
                    <CategoryScoreView
                        participants={resultsData}
                        unresolvedTieParticipantIds={unresolvedTieParticipantIds}
                    />
                )}

                {/* Sharing Drawer */}
                <SharingDrawer
                    isOpen={isSharingDrawerOpen}
                    onClose={() => setIsSharingDrawerOpen(false)}
                    allResultsComplete={allResultsComplete}
                />
            </div>
        </ScoreActionsProvider>
    )
}

