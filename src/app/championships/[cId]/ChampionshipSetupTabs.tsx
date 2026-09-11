"use client"

import { ErrorContextBanner, ErrorContextProvider } from "@/components/errors/ErrorContext"
import { useState, type ReactNode } from "react"
import ChampionshipPanelTab from "./ChampionshipPanelTab"
import { championshipDetailContentClass, championshipPanelClass } from "./championshipDetailLayout"

type SetupTabId = "roster" | "ranges"

export default function ChampionshipSetupTabs({
    showRangeAssignments,
    rangeAssignment,
    roster,
}: {
    showRangeAssignments: boolean
    rangeAssignment: ReactNode
    roster: ReactNode
}) {
    const [activeTab, setActiveTab] = useState<SetupTabId>("roster")

    if (!showRangeAssignments) {
        return (
            <ErrorContextProvider>
                <div className={`mt-6 ${championshipDetailContentClass}`}>
                    <div className={`${championshipPanelClass} p-4 flex flex-col gap-3`}>
                        <ErrorContextBanner key="setup-error-banner" placement="sticky-top" />
                        <div key="roster">{roster}</div>
                    </div>
                </div>
            </ErrorContextProvider>
        )
    }

    return (
        <ErrorContextProvider>
            <div className={`mt-6 ${championshipDetailContentClass}`}>
                <div className={championshipPanelClass}>
                    <div
                        role="tablist"
                        className="tabs tabs-boxed bg-base-200 w-full rounded-none border-b border-base-300"
                    >
                        <ChampionshipPanelTab
                            selected={activeTab === "roster"}
                            onSelect={() => setActiveTab("roster")}
                        >
                            Competitor roster
                        </ChampionshipPanelTab>
                        <ChampionshipPanelTab
                            selected={activeTab === "ranges"}
                            onSelect={() => setActiveTab("ranges")}
                        >
                            Division — range assignments
                        </ChampionshipPanelTab>
                    </div>
                    <div className="p-4 flex flex-col gap-3" role="tabpanel">
                        <ErrorContextBanner key="setup-error-banner" placement="sticky-top" />
                        <div key={activeTab} className="min-h-0">
                            {activeTab === "roster" ? roster : rangeAssignment}
                        </div>
                    </div>
                </div>
            </div>
        </ErrorContextProvider>
    )
}
