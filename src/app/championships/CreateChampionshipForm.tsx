"use client"

import ErrorAlert from "@/components/errors/ErrorAlert"
import { PencilSquareIcon } from "@heroicons/react/24/solid"
import Form from "next/form"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useFormStatus } from "react-dom"
import { createChampionship } from "./championshipActions"

function validateChampionshipInput(name: string, club: string): string | null {
    if (!name.trim()) {
        return "Name cannot be empty"
    }
    if (!club) {
        return "Organizing club must be selected"
    }
    return null
}

export default function CreateChampionshipForm({ clubs }: { clubs: string[] }) {
    const status = useFormStatus()
    const router = useRouter()
    const [name, setName] = useState("")
    const [error, setError] = useState("")
    const [club, setClub] = useState(clubs[0] ?? "")

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
            <div className="card-body">
                <input
                    type="text"
                    placeholder="Championship name"
                    className="input input-primary w-full"
                    value={name}
                    onChange={(evt) => setName(evt.target.value)}
                    required
                />
                <ErrorAlert error={error} resetAction={() => setError("")} />
                <Form
                    className="justify-end card-actions"
                    action={() => {
                        const validationError = validateChampionshipInput(name, club)
                        if (validationError) {
                            setError(validationError)
                            return
                        }
                        createChampionship({ name: name.trim(), organizerClub: club })
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
