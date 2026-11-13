"use client"

import useErrorContext from "@/components/errors/ErrorContext"
import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { seedTournamentGroups } from "../groupActions"

export default function SeedGroupsButton({
    tournamentId,
    disabled,
    compact = false,
}: {
    tournamentId: string
    disabled: boolean
    compact?: boolean
}) {
    const [isPending, startTransition] = useTransition()
    const setError = useErrorContext()
    const router = useRouter()

    const handleSeed = () => {
        const confirmed = confirm("Replace the current group assignments with a new seeding?")
        if (!confirmed) {
            return
        }

        startTransition(async () => {
            try {
                await seedTournamentGroups(tournamentId)
                router.refresh()
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to seed groups")
            }
        })
    }

    return (
        <button
            type="button"
            className={compact ? "btn btn-secondary btn-xs" : "btn btn-secondary btn-sm"}
            onClick={handleSeed}
            disabled={disabled || isPending}
        >
            {isPending ? "Seeding..." : "Seed groups"}
        </button>
    )
}
