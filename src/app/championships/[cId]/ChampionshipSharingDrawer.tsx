"use client"

import useErrorContext from "@/components/errors/ErrorContext"
import {
    flagsFromSharingOption,
    type SharingOption,
} from "@/lib/tournamentSharing"
import { useEffect, useRef, useState } from "react"
import {
    getChampionshipSharingStatus,
    updateChampionshipSharingSettings,
    type ChampionshipSharingStatus,
} from "../championshipActions"

type SelectableSharingOption = Exclude<SharingOption, "mixed">

function isSelectableSharingOption(option: SharingOption): option is SelectableSharingOption {
    return option !== "mixed"
}

export default function ChampionshipSharingDrawer({
    championshipId,
    isOpen,
    onClose,
    sharingStatus,
    onSharingUpdated,
}: {
    championshipId: string
    isOpen: boolean
    onClose: () => void
    sharingStatus: ChampionshipSharingStatus
    onSharingUpdated: (status: ChampionshipSharingStatus) => void
}) {
    const setError = useErrorContext()
    const [isUpdating, setIsUpdating] = useState(false)
    const [copied, setCopied] = useState(false)
    const drawerCheckboxRef = useRef<HTMLInputElement>(null)
    const [selectedOption, setSelectedOption] = useState<SelectableSharingOption>("private")

    useEffect(() => {
        if (drawerCheckboxRef.current) {
            drawerCheckboxRef.current.checked = isOpen
        }
    }, [isOpen])

    useEffect(() => {
        if (!isOpen) {
            return
        }
        if (isSelectableSharingOption(sharingStatus.sharingOption)) {
            setSelectedOption(sharingStatus.sharingOption)
        }
    }, [isOpen, sharingStatus.sharingOption])

    const currentOption = sharingStatus.sharingOption
    const isLinkShared =
        currentOption === "link-shared" ||
        (selectedOption === "link-shared" && currentOption === "mixed")

    const handleSharingChange = async (option: SelectableSharingOption) => {
        setIsUpdating(true)
        try {
            const { isPublished, isShared } = flagsFromSharingOption(option)
            await updateChampionshipSharingSettings(championshipId, isPublished, isShared)
            setSelectedOption(option)
            setError("Sharing settings updated for all championship days")

            const refreshed = await getChampionshipSharingStatus(championshipId)
            if (refreshed) {
                onSharingUpdated(refreshed)
            }
        } catch (error) {
            console.error("Failed to update championship sharing settings:", error)
            setError(error instanceof Error ? error.message : "Failed to update sharing settings")
        } finally {
            setIsUpdating(false)
        }
    }

    const handleCopyLink = async () => {
        const resultsUrl = `${window.location.origin}/results/championships/${championshipId}`
        try {
            await navigator.clipboard.writeText(resultsUrl)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (error) {
            console.error("Failed to copy link to clipboard:", error)
            setError("Failed to copy link to clipboard")
        }
    }

    const resultsUrl =
        typeof window !== "undefined"
            ? `${window.location.origin}/results/championships/${championshipId}`
            : `/results/championships/${championshipId}`

    const applyDisabled =
        isUpdating ||
        sharingStatus.tournamentCount === 0 ||
        (currentOption !== "mixed" && selectedOption === currentOption)

    return (
        <div className="drawer drawer-end">
            <input
                ref={drawerCheckboxRef}
                id={`championship-sharing-drawer-${championshipId}`}
                type="checkbox"
                className="drawer-toggle"
                onChange={(event) => {
                    if (!event.target.checked) {
                        onClose()
                    }
                }}
            />

            <div className="drawer-side">
                <label
                    htmlFor={`championship-sharing-drawer-${championshipId}`}
                    className="drawer-overlay"
                    onClick={onClose}
                />
                <div className="min-h-full w-80 bg-base-200 p-4">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Championship sharing</h3>
                        <label
                            htmlFor={`championship-sharing-drawer-${championshipId}`}
                            className="btn btn-sm btn-circle btn-ghost"
                            onClick={onClose}
                        >
                            ✕
                        </label>
                    </div>

                    <p className="text-xs text-base-content/70 mb-4">
                        Applies to all {sharingStatus.tournamentCount} day tournament
                        {sharingStatus.tournamentCount === 1 ? "" : "s"} (standings and groups).
                    </p>

                    {currentOption === "mixed" ? (
                        <div className="alert alert-warning text-xs mb-4 py-2">
                            Day tournaments currently have different sharing settings. Choose an option to
                            apply to all.
                        </div>
                    ) : null}

                    {sharingStatus.tournamentCount === 0 ? (
                        <div className="alert alert-info text-xs mb-4 py-2">
                            Add at least one championship day before sharing results.
                        </div>
                    ) : null}

                    <div className="space-y-4">
                        <div className="form-control">
                            <label className="label cursor-pointer">
                                <div className="label-text">
                                    <div className="font-semibold">Private</div>
                                    <div className="text-xs text-base-content/70">
                                        Results are not accessible to anyone
                                    </div>
                                </div>
                                <input
                                    type="radio"
                                    name="championship-sharing-option"
                                    className="radio radio-primary"
                                    checked={selectedOption === "private"}
                                    onChange={() => setSelectedOption("private")}
                                    disabled={isUpdating || sharingStatus.tournamentCount === 0}
                                />
                            </label>
                        </div>

                        <div className="form-control">
                            <label className="label cursor-pointer">
                                <div className="label-text">
                                    <div className="font-semibold">Link-Shared</div>
                                    <div className="text-xs text-base-content/70">
                                        Combined results accessible via direct link only
                                    </div>
                                </div>
                                <input
                                    type="radio"
                                    name="championship-sharing-option"
                                    className="radio radio-primary"
                                    checked={selectedOption === "link-shared"}
                                    onChange={() => setSelectedOption("link-shared")}
                                    disabled={isUpdating || sharingStatus.tournamentCount === 0}
                                />
                            </label>
                        </div>

                        <div className="form-control">
                            <label className="label cursor-pointer">
                                <div className="label-text">
                                    <div className="font-semibold">Public</div>
                                    <div className="text-xs text-base-content/70">
                                        Results visible on public results page
                                    </div>
                                </div>
                                <input
                                    type="radio"
                                    name="championship-sharing-option"
                                    className="radio radio-primary"
                                    checked={selectedOption === "public"}
                                    onChange={() => setSelectedOption("public")}
                                    disabled={isUpdating || sharingStatus.tournamentCount === 0}
                                />
                            </label>
                        </div>

                        {isLinkShared && sharingStatus.tournamentCount > 0 ? (
                            <div className="mt-6 space-y-2">
                                <label className="label">
                                    <span className="label-text font-semibold">Championship results link</span>
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        readOnly
                                        value={resultsUrl}
                                        className="input input-bordered flex-1 text-sm"
                                    />
                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        onClick={handleCopyLink}
                                        disabled={isUpdating}
                                    >
                                        {copied ? "Copied!" : "Copy"}
                                    </button>
                                </div>
                            </div>
                        ) : null}

                        <div className="mt-6">
                            <button
                                type="button"
                                className="btn btn-primary w-full"
                                onClick={() => handleSharingChange(selectedOption)}
                                disabled={applyDisabled}
                            >
                                {isUpdating ? "Updating..." : "Apply to all days"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export function championshipSharingBadgeLabel(option: SharingOption): string | null {
    switch (option) {
        case "public":
            return "Public"
        case "link-shared":
            return "Link-shared"
        case "mixed":
            return "Mixed sharing"
        default:
            return null
    }
}
