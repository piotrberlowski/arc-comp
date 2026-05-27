"use client"

import { ShareIcon } from "@heroicons/react/24/outline"
import { useState } from "react"
import {
    getChampionshipSharingStatus,
    type ChampionshipSharingStatus,
} from "../championshipActions"
import ChampionshipSharingDrawer, { championshipSharingBadgeLabel } from "./ChampionshipSharingDrawer"

export default function ChampionshipSharingButton({
    championshipId,
    readOnly,
}: {
    championshipId: string
    readOnly: boolean
}) {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)
    const [sharingStatus, setSharingStatus] = useState<ChampionshipSharingStatus | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    if (readOnly) {
        return null
    }

    const badgeLabel = sharingStatus ? championshipSharingBadgeLabel(sharingStatus.sharingOption) : null

    const handleOpen = async () => {
        setIsLoading(true)
        try {
            const status = await getChampionshipSharingStatus(championshipId)
            if (!status) {
                return
            }
            setSharingStatus(status)
            setIsDrawerOpen(true)
        } catch (error) {
            console.error("Failed to load championship sharing status:", error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <>
            <button
                type="button"
                className="btn btn-primary btn-sm gap-1"
                onClick={handleOpen}
                disabled={isLoading}
            >
                <ShareIcon className="w-4 h-4" />
                {isLoading ? "Loading..." : "Sharing"}
                {badgeLabel ? <span className="badge badge-xs badge-secondary">{badgeLabel}</span> : null}
            </button>
            {sharingStatus ? (
                <ChampionshipSharingDrawer
                    championshipId={championshipId}
                    isOpen={isDrawerOpen}
                    onClose={() => setIsDrawerOpen(false)}
                    sharingStatus={sharingStatus}
                    onSharingUpdated={setSharingStatus}
                />
            ) : null}
        </>
    )
}
