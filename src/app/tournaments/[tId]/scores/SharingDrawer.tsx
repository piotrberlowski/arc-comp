"use client"

import useErrorContext from "@/components/errors/ErrorContext"
import { useEffect, useRef, useState } from "react"
import useTournamentContext from "../TournamentContext"
import { updateSharingSettings } from "../scoreActions"

interface TournamentData {
    id: string
    isPublished: boolean
    isShared: boolean
}

interface SharingDrawerProps {
    isOpen: boolean
    onClose: () => void
    allScoresComplete: boolean
    tournament?: TournamentData
    onSharingUpdated?: (updatedTournament: TournamentData) => void
}

type SharingOption = 'private' | 'link-shared' | 'public'

export default function SharingDrawer({ isOpen, onClose, allScoresComplete, tournament: tournamentProp, onSharingUpdated }: SharingDrawerProps) {
    const tCtx = useTournamentContext()
    const setError = useErrorContext()
    const [isUpdating, setIsUpdating] = useState(false)
    const [copied, setCopied] = useState(false)
    const drawerCheckboxRef = useRef<HTMLInputElement>(null)

    // Use prop if provided, otherwise fall back to context
    const tFromContext = tCtx?.getTournament()
    const tournament: TournamentData | null = tournamentProp || (tFromContext ? {
        id: tFromContext.id,
        isPublished: tFromContext.isPublished,
        isShared: tFromContext.isShared
    } : null)

    if (!tournament?.id) {
        return null
    }

    // Determine current sharing state
    const getCurrentSharingOption = (): SharingOption => {
        if (tournament.isPublished && tournament.isShared) return 'public'
        if (!tournament.isPublished && tournament.isShared) return 'link-shared'
        return 'private'
    }

    const [selectedOption, setSelectedOption] = useState<SharingOption>(getCurrentSharingOption())

    // Sync checkbox with isOpen prop
    useEffect(() => {
        if (drawerCheckboxRef.current) {
            drawerCheckboxRef.current.checked = isOpen
        }
    }, [isOpen])

    // Sync selectedOption with tournament state when drawer opens
    useEffect(() => {
        if (isOpen && tournament) {
            let currentOption: SharingOption = 'private'
            if (tournament.isPublished && tournament.isShared) {
                currentOption = 'public'
            } else if (!tournament.isPublished && tournament.isShared) {
                currentOption = 'link-shared'
            }
            setSelectedOption(currentOption)
        }
    }, [isOpen, tournament?.isPublished, tournament?.isShared])

    const handleSharingChange = async (option: SharingOption) => {
        if (option === 'public' && !allScoresComplete) {
            setError("Cannot make results public: all participants must have completed scores")
            return
        }

        setIsUpdating(true)
        try {
            let isPublished = false
            let isShared = false

            switch (option) {
                case 'private':
                    isPublished = false
                    isShared = false
                    break
                case 'link-shared':
                    isPublished = false
                    isShared = true
                    break
                case 'public':
                    isPublished = true
                    isShared = true
                    break
            }

            await updateSharingSettings(tournament.id, isPublished, isShared)
            setSelectedOption(option)
            setError("Sharing settings updated successfully!")

            // Notify parent component of the update
            if (onSharingUpdated) {
                onSharingUpdated({
                    id: tournament.id,
                    isPublished,
                    isShared
                })
            }
        } catch (error) {
            console.error("Failed to update sharing settings:", error)
            setError(error instanceof Error ? error.message : 'Failed to update sharing settings')
        } finally {
            setIsUpdating(false)
        }
    }

    const handleCopyLink = async () => {
        const resultsUrl = `${window.location.origin}/results/${tournament.id}`
        try {
            await navigator.clipboard.writeText(resultsUrl)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (error) {
            console.error("Failed to copy link to clipboard:", error)
            setError("Failed to copy link to clipboard")
        }
    }

    const resultsUrl = `${window.location.origin}/results/${tournament.id}`
    const isLinkShared = !tournament.isPublished && tournament.isShared

    return (
        <div className="drawer drawer-end">
            <input
                ref={drawerCheckboxRef}
                id="sharing-drawer"
                type="checkbox"
                className="drawer-toggle"
                onChange={(e) => {
                    if (!e.target.checked) {
                        onClose()
                    }
                }}
            />

            <div className="drawer-side">
                <label htmlFor="sharing-drawer" className="drawer-overlay" onClick={onClose}></label>
                <div className="min-h-full w-80 bg-base-200 p-4">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Sharing Settings</h3>
                        <label htmlFor="sharing-drawer" className="btn btn-sm btn-circle btn-ghost" onClick={onClose}>✕</label>
                    </div>

                    <div className="space-y-4">
                        {/* Private Option */}
                        <div className="form-control">
                            <label className="label cursor-pointer">
                                <div className="label-text">
                                    <div className="font-semibold">Private</div>
                                    <div className="text-xs text-base-content/70">Results are not accessible to anyone</div>
                                </div>
                                <input
                                    type="radio"
                                    name="sharing-option"
                                    className="radio radio-primary"
                                    checked={selectedOption === 'private'}
                                    onChange={() => setSelectedOption('private')}
                                    disabled={isUpdating}
                                />
                            </label>
                        </div>

                        {/* Link-Shared Option */}
                        <div className="form-control">
                            <label className="label cursor-pointer">
                                <div className="label-text">
                                    <div className="font-semibold">Link-Shared</div>
                                    <div className="text-xs text-base-content/70">Results accessible via direct link only</div>
                                </div>
                                <input
                                    type="radio"
                                    name="sharing-option"
                                    className="radio radio-primary"
                                    checked={selectedOption === 'link-shared'}
                                    onChange={() => setSelectedOption('link-shared')}
                                    disabled={isUpdating}
                                />
                            </label>
                        </div>

                        {/* Public Option */}
                        <div className="form-control">
                            <label className="label cursor-pointer">
                                <div className="label-text">
                                    <div className="font-semibold">Public</div>
                                    <div className="text-xs text-base-content/70">Results visible on public results page</div>
                                </div>
                                <input
                                    type="radio"
                                    name="sharing-option"
                                    className="radio radio-primary"
                                    checked={selectedOption === 'public'}
                                    onChange={() => setSelectedOption('public')}
                                    disabled={isUpdating || !allScoresComplete}
                                />
                            </label>
                            {!allScoresComplete && (
                                <div className="text-xs text-warning mt-1 ml-4">
                                    All scores must be complete to make results public
                                </div>
                            )}
                        </div>

                        {/* Link Display (when link-shared) */}
                        {isLinkShared && (
                            <div className="mt-6 space-y-2">
                                <label className="label">
                                    <span className="label-text font-semibold">Results Link</span>
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        readOnly
                                        value={resultsUrl}
                                        className="input input-bordered flex-1 text-sm"
                                    />
                                    <button
                                        className="btn btn-primary"
                                        onClick={handleCopyLink}
                                        disabled={isUpdating}
                                    >
                                        {copied ? 'Copied!' : 'Copy'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Apply Button */}
                        <div className="mt-6">
                            <button
                                className="btn btn-primary w-full"
                                onClick={() => handleSharingChange(selectedOption)}
                                disabled={isUpdating || selectedOption === getCurrentSharingOption()}
                            >
                                {isUpdating ? 'Updating...' : 'Apply Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

