"use client"

import { ChartBarIcon, Squares2X2Icon } from "@heroicons/react/24/outline"
import Link from "next/link"
import { usePathname } from "next/navigation"

const activeTabClass =
    "tab-active bg-primary text-primary-content border-secondary border-solid border-1 border-b-0"

export default function ChampionshipNavigation({ championshipId }: { championshipId: string }) {
    const pathname = usePathname()
    const basePath = `/championships/${championshipId}`

    const navItems = [
        {
            href: basePath,
            label: "Overview",
            icon: Squares2X2Icon,
            isActive: pathname === basePath || pathname === `${basePath}/`,
        },
        {
            href: `${basePath}/standings`,
            label: "Combined standings",
            icon: ChartBarIcon,
            isActive:
                pathname === `${basePath}/standings` ||
                pathname.startsWith(`${basePath}/standings/`),
        },
    ]

    return (
        <div className="tabs tabs-boxed bg-base-200 mb-0">
            {navItems.map((item) => {
                const Icon = item.icon
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`tab flex items-center gap-2 min-w-0 flex-1 justify-center ${
                            item.isActive ? activeTabClass : "hover:bg-base-300"
                        }`}
                    >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="hidden md:block whitespace-nowrap">{item.label}</span>
                    </Link>
                )
            })}
        </div>
    )
}
