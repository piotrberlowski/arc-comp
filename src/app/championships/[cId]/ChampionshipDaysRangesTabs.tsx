"use client"

import { useState, type ReactNode } from "react"
import ChampionshipPanelTab from "./ChampionshipPanelTab"
import { championshipDetailContentClass, championshipPanelClass } from "./championshipDetailLayout"

type OverviewTabId = "days" | "ranges"

export default function ChampionshipDaysRangesTabs({
    days,
    ranges,
}: {
    days: ReactNode
    ranges: ReactNode
}) {
    const [activeTab, setActiveTab] = useState<OverviewTabId>("days")

    return (
        <div className={championshipDetailContentClass}>
            <div className={championshipPanelClass}>
                <div
                    role="tablist"
                    className="tabs tabs-boxed bg-base-200 w-full rounded-none border-b border-base-300"
                >
                    <ChampionshipPanelTab selected={activeTab === "days"} onSelect={() => setActiveTab("days")}>
                        Days
                    </ChampionshipPanelTab>
                    <ChampionshipPanelTab selected={activeTab === "ranges"} onSelect={() => setActiveTab("ranges")}>
                        Ranges
                    </ChampionshipPanelTab>
                </div>
                <div className="p-4" role="tabpanel">
                    {activeTab === "days" ? days : ranges}
                </div>
            </div>
        </div>
    )
}
