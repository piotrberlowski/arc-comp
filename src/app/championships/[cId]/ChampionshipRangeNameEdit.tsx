"use client"

import ErrorAlert from "@/components/errors/ErrorAlert"
import { championshipRangeDisplayName } from "@/lib/championshipDayNaming"
import { CheckCircleIcon, PencilSquareIcon, XCircleIcon } from "@heroicons/react/24/outline"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { updateChampionshipRangeName } from "../championshipActions"

function RangeNameEditor({
    rangeNumber,
    draftName,
    saving,
    error,
    onDraftChange,
    onSave,
    onCancel,
    onClearError,
}: {
    rangeNumber: number
    draftName: string
    saving: boolean
    error: string
    onDraftChange: (value: string) => void
    onSave: () => void
    onCancel: () => void
    onClearError: () => void
}) {
    return (
        <div className="flex flex-wrap items-center gap-2 flex-1">
            <input
                type="text"
                className="input input-primary input-sm flex-1 min-w-40"
                value={draftName}
                placeholder={championshipRangeDisplayName(rangeNumber)}
                aria-label={`Name for range ${rangeNumber}`}
                onChange={(evt) => onDraftChange(evt.target.value)}
            />
            {saving ? (
                <span className="loading loading-ring loading-sm" />
            ) : (
                <>
                    <button type="button" className="btn btn-primary btn-sm" onClick={onSave} aria-label="Save range name">
                        <CheckCircleIcon width={20} />
                    </button>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={onCancel} aria-label="Cancel range rename">
                        <XCircleIcon width={20} />
                    </button>
                </>
            )}
            <ErrorAlert error={error} resetAction={onClearError} />
        </div>
    )
}

export default function ChampionshipRangeNameEdit({
    championshipId,
    rangeNumber,
    initialName,
    readOnly = false,
}: {
    championshipId: string
    rangeNumber: number
    initialName: string | null
    readOnly?: boolean
}) {
    const router = useRouter()
    const [storedName, setStoredName] = useState(initialName)
    const [isEditing, setIsEditing] = useState(false)
    const [draftName, setDraftName] = useState(initialName ?? "")
    const [error, setError] = useState("")
    const [saving, setSaving] = useState(false)
    const displayName = championshipRangeDisplayName(rangeNumber, storedName)

    function startEdit() {
        setDraftName(storedName ?? "")
        setError("")
        setIsEditing(true)
    }

    function cancelEdit() {
        setDraftName(storedName ?? "")
        setError("")
        setIsEditing(false)
    }

    function saveName() {
        setSaving(true)
        updateChampionshipRangeName(championshipId, rangeNumber, draftName)
            .then((updated) => {
                setStoredName(updated.name)
                setIsEditing(false)
                router.refresh()
            })
            .catch((e) => {
                console.error("Failed to update championship range name:", e)
                setError(e instanceof Error ? e.message : "Unable to update range name")
            })
            .finally(() => setSaving(false))
    }

    if (isEditing) {
        return (
            <RangeNameEditor
                rangeNumber={rangeNumber}
                draftName={draftName}
                saving={saving}
                error={error}
                onDraftChange={setDraftName}
                onSave={saveName}
                onCancel={cancelEdit}
                onClearError={() => setError("")}
            />
        )
    }

    return (
        <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{displayName}</p>
            {storedName ? (
                <span className="badge badge-sm badge-ghost">Range {rangeNumber}</span>
            ) : null}
            {!readOnly ? (
                <button
                    type="button"
                    className="btn btn-ghost btn-xs"
                    onClick={startEdit}
                    aria-label={`Rename ${displayName}`}
                >
                    <PencilSquareIcon width={16} />
                </button>
            ) : null}
        </div>
    )
}
