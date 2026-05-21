"use client"

import useErrorContext from "@/components/errors/ErrorContext"
import { useRouter } from "next/navigation"
import { useState } from "react"
import TournamentSetupForm from "./TournamentSetupForm"
import { createTournament } from "./tournamentActions"

export default function CreateTournamentForm({ clubs }: { clubs: string[] }) {
    const router = useRouter()
    const setError = useErrorContext()
    const [club, setClub] = useState(clubs.length > 0 ? clubs[0] : "")

    function validateInput(name: string, formatId: string, endCount: number, groupSize: number) {
        const errors = []
        if (!name) {
            errors.push("Name cannot be empty")
        }
        if (!formatId) {
            errors.push("Round format must be selected")
        }
        if (!club) {
            errors.push("Organizing Club must be selected")
        }
        if (!endCount || endCount < 1) {
            errors.push("End count must be at least 1")
        }
        if (!groupSize || groupSize < 2) {
            errors.push("Group size must be at least 2")
        }
        if (errors.length > 0) {
            setError(errors.join("; "))
            return false
        }
        return true
    }

    return (
        <TournamentSetupForm
            clubs={clubs}
            club={club}
            onClubChange={setClub}
            action={(formData) => {
                const name = String(formData.get("name") ?? "")
                const formatId = String(formData.get("formatId") ?? "")
                const date = new Date(String(formData.get("date") ?? ""))
                const endCount = Number(formData.get("endCount"))
                const groupSize = Number(formData.get("groupSize"))
                if (!validateInput(name, formatId, endCount, groupSize)) {
                    return
                }
                setError(undefined)
                createTournament(name, formatId, club, date, endCount, groupSize)
                    .then((tgt) => router.push(`/tournaments/${tgt}`))
                    .catch((e) => {
                        console.error("Failed to create tournament:", e)
                        setError(String(e))
                    })
            }}
            submitLabel="Create!"
        />
    )
}
