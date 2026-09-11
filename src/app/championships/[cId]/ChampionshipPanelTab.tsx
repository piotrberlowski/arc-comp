"use client"

import type { ReactNode } from "react"
import { championshipTabActiveClass } from "./championshipDetailLayout"

export default function ChampionshipPanelTab({
    selected,
    onSelect,
    children,
}: {
    selected: boolean
    onSelect: () => void
    children: ReactNode
}) {
    return (
        <button
            type="button"
            role="tab"
            aria-selected={selected}
            className={`tab flex-1 ${selected ? championshipTabActiveClass : "hover:bg-base-300"}`}
            onClick={onSelect}
        >
            {children}
        </button>
    )
}
