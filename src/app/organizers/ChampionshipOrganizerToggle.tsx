"use client"

import { Organizer } from "@/generated/prisma/browser"
import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { setChampionshipOrganizerPowerUp } from "./organizersActions"

export default function ChampionshipOrganizerToggle({
    role,
    revalidate,
}: {
    role: Organizer
    revalidate?: string
}) {
    const router = useRouter()
    const [pending, startTransition] = useTransition()

    const onToggle = () => {
        startTransition(async () => {
            await setChampionshipOrganizerPowerUp(
                role.userId,
                role.club,
                !role.canManageChampionships,
                revalidate
            )
            router.refresh()
        })
    }

    return (
        <label className="label cursor-pointer gap-1 py-0 min-h-0 align-middle">
            <span className="label-text text-sm whitespace-nowrap">Championship</span>
            <input
                type="checkbox"
                className="toggle toggle-xs toggle-primary bg-neutral"
                checked={role.canManageChampionships}
                onChange={onToggle}
                disabled={pending}
                aria-label={`Championship organizer for ${role.club}`}
            />
        </label>
    )
}
