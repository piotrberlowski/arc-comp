"use client"

import { ChartBarIcon, UserGroupIcon, UsersIcon } from "@heroicons/react/24/outline"
import Link from "next/link"
import { usePathname } from "next/navigation"

interface TournamentNavigationProps {
    tournamentId: string
}

export default function TournamentNavigation({ tournamentId }: TournamentNavigationProps) {
    const pathname = usePathname()

    const navItems = [
        {
            href: `/tournaments/${tournamentId}`,
            label: "Participants",
            icon: UsersIcon,
            isActive: pathname === `/tournaments/${tournamentId}` || pathname === `/tournaments/${tournamentId}/`
        },
        {
            href: `/tournaments/${tournamentId}/groups`,
            label: "Group Assignment",
            icon: UserGroupIcon,
            isActive: pathname === `/tournaments/${tournamentId}/groups` || pathname.startsWith(`/tournaments/${tournamentId}/groups`)
        },
        {
            href: `/tournaments/${tournamentId}/scores`,
            label: "Score Entry",
            icon: ChartBarIcon,
            isActive: pathname === `/tournaments/${tournamentId}/scores` || pathname.startsWith(`/tournaments/${tournamentId}/scores`)
        }
    ]


    const activeStyle = 'tab-active bg-primary text-primary-content border-secondary border-solid border-1 border-b-0'

    return (
        <div className="tabs tabs-boxed bg-base-200">
            {navItems.map((item) => {
                const Icon = item.icon
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`tab flex items-center gap-2 min-w-0 flex-1 justify-center ${item.isActive ? activeStyle : 'hover:bg-base-300'
                            }`}
                    >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <span className="hidden md:block whitespace-nowrap">{item.label}</span>
                    </Link>
                )
            })}
        </div>
    )
}
