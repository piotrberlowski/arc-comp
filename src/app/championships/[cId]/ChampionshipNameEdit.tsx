"use client"

import ErrorAlert from "@/components/errors/ErrorAlert"
import { CheckCircleIcon, PencilSquareIcon, XCircleIcon } from "@heroicons/react/24/outline"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { updateChampionship } from "../championshipActions"

export default function ChampionshipNameEdit({
    championshipId,
    initialName,
}: {
    championshipId: string
    initialName: string
}) {
    const router = useRouter()
    const [displayName, setDisplayName] = useState(initialName)
    const [isEditing, setIsEditing] = useState(false)
    const [draftName, setDraftName] = useState(initialName)
    const [error, setError] = useState("")
    const [saving, setSaving] = useState(false)

    function startEdit() {
        setDraftName(displayName)
        setError("")
        setIsEditing(true)
    }

    function cancelEdit() {
        setDraftName(displayName)
        setError("")
        setIsEditing(false)
    }

    function saveName() {
        const trimmed = draftName.trim()
        if (!trimmed) {
            setError("Name cannot be empty")
            return
        }
        setSaving(true)
        updateChampionship(championshipId, { name: trimmed })
            .then(() => {
                setDisplayName(trimmed)
                setIsEditing(false)
                router.refresh()
            })
            .catch((e) => {
                console.error("Failed to update championship:", e)
                setError(e instanceof Error ? e.message : "Unable to update championship")
            })
            .finally(() => setSaving(false))
    }

    if (isEditing) {
        return (
            <div className="flex flex-wrap items-center gap-2 flex-1">
                <input
                    type="text"
                    className="input input-primary flex-1 min-w-48"
                    value={draftName}
                    onChange={(evt) => setDraftName(evt.target.value)}
                />
                {saving ? (
                    <span className="loading loading-ring loading-md" />
                ) : (
                    <>
                        <button type="button" className="btn btn-primary btn-sm" onClick={saveName} aria-label="Save name">
                            <CheckCircleIcon width={20} />
                        </button>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={cancelEdit} aria-label="Cancel edit">
                            <XCircleIcon width={20} />
                        </button>
                    </>
                )}
                <ErrorAlert error={error} resetAction={() => setError("")} />
            </div>
        )
    }

    return (
        <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold">{displayName}</h1>
            <button type="button" className="btn btn-ghost btn-sm" onClick={startEdit} aria-label="Edit championship name">
                <PencilSquareIcon width={20} />
            </button>
        </div>
    )
}
