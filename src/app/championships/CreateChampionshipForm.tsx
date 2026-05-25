"use client"

import useErrorContext from "@/components/errors/ErrorContext"
import RoundFormatSelect from "@/components/RoundFormatSelect"
import { PencilSquareIcon } from "@heroicons/react/24/solid"
import Form from "next/form"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useFormStatus } from "react-dom"
import { createChampionship } from "./championshipActions"

function validateChampionshipInput(
    name: string,
    club: string,
    rangeCount: number,
    formatByRange: Record<number, string>
): string | null {
    if (!name.trim()) {
        return "Name cannot be empty"
    }
    if (!club) {
        return "Organizing club must be selected"
    }
    if (!Number.isInteger(rangeCount) || rangeCount < 1 || rangeCount > 8) {
        return "Number of ranges must be between 1 and 8"
    }
    for (let rangeNumber = 1; rangeNumber <= rangeCount; rangeNumber += 1) {
        if (!formatByRange[rangeNumber]?.trim()) {
            return `Range ${rangeNumber} must have a round type selected`
        }
    }
    return null
}

function ChampionshipRangeFormatRow({
    rangeNumber,
    formatId,
    onFormatChange,
}: {
    rangeNumber: number
    formatId: string
    onFormatChange: (rangeNumber: number, formatId: string) => void
}) {
    const label = rangeNumber === 1 && formatId === "" ? "Round type" : `Range ${rangeNumber} round type`

    return (
        <label className="form-control w-full">
            <span className="label-text">{label}</span>
            <RoundFormatSelect
                className="select-bordered w-full"
                formatId={formatId}
                onChange={(format) => onFormatChange(rangeNumber, format?.id ?? "")}
            />
        </label>
    )
}

export default function CreateChampionshipForm({ clubs }: { clubs: string[] }) {
    const status = useFormStatus()
    const router = useRouter()
    const setError = useErrorContext()
    const [name, setName] = useState("")
    const [club, setClub] = useState(clubs[0] ?? "")
    const [rangeCount, setRangeCount] = useState(1)
    const [formatByRange, setFormatByRange] = useState<Record<number, string>>({ 1: "" })

    useEffect(() => {
        setFormatByRange((previous) => {
            const next: Record<number, string> = {}
            for (let rangeNumber = 1; rangeNumber <= rangeCount; rangeNumber += 1) {
                next[rangeNumber] = previous[rangeNumber] ?? ""
            }
            return next
        })
    }, [rangeCount])

    const handleFormatChange = (rangeNumber: number, formatId: string) => {
        setFormatByRange((previous) => ({ ...previous, [rangeNumber]: formatId }))
    }

    return (
        <div className="card w-full bg-base-300 card-sm shadow-sm">
            <select
                className="select select-primary w-full bg-base-200"
                value={club}
                onChange={(evt) => setClub(evt.target.value)}
            >
                {clubs.map((c) => (
                    <option key={`championship-club-${c}`} value={c}>
                        {c}
                    </option>
                ))}
            </select>
            <div className="card-body gap-3">
                <input
                    type="text"
                    placeholder="Championship name"
                    className="input input-primary w-full"
                    value={name}
                    onChange={(evt) => setName(evt.target.value)}
                    required
                />
                <label className="form-control w-full">
                    <span className="label-text">Shooting ranges</span>
                    <input
                        type="number"
                        min={1}
                        max={8}
                        className="input input-primary w-full"
                        value={rangeCount}
                        onChange={(evt) => setRangeCount(Number(evt.target.value))}
                    />
                </label>
                {Array.from({ length: rangeCount }, (_, index) => (
                    <ChampionshipRangeFormatRow
                        key={index + 1}
                        rangeNumber={index + 1}
                        formatId={formatByRange[index + 1] ?? ""}
                        onFormatChange={handleFormatChange}
                    />
                ))}
                <Form
                    className="justify-end card-actions"
                    action={() => {
                        const validationError = validateChampionshipInput(name, club, rangeCount, formatByRange)
                        if (validationError) {
                            setError(validationError)
                            return
                        }
                        setError(undefined)
                        createChampionship({
                            name: name.trim(),
                            organizerClub: club,
                            rangeCount,
                            rangeFormats: Array.from({ length: rangeCount }, (_, index) => ({
                                rangeNumber: index + 1,
                                formatId: formatByRange[index + 1] ?? "",
                            })),
                        })
                            .then((created) => router.push(`/championships/${created.id}`))
                            .catch((e) => {
                                console.error("Failed to create championship:", e)
                                setError(e instanceof Error ? e.message : "Unable to create championship")
                            })
                    }}
                >
                    <button type="submit" className="btn btn-success" disabled={status.pending}>
                        <PencilSquareIcon width={24} />
                        Create
                    </button>
                </Form>
            </div>
        </div>
    )
}
