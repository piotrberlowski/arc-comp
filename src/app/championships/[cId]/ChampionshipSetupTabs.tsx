"use client"

import { ErrorContextBanner, ErrorContextProvider } from "@/components/errors/ErrorContext"
import { useState, type ReactNode } from "react"
import { championshipDetailContentClass } from "./championshipDetailLayout"

const activeTabClass =
    "tab-active bg-primary text-primary-content border-secondary border-solid border-1 border-b-0"

const setupPanelClass = "rounded-lg border border-base-300 bg-base-100 overflow-hidden"

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
                    <div className={`${setupPanelClass} p-4 flex flex-col gap-3`}>
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
                <div className={setupPanelClass}>
                    <div
                        role="tablist"
                        className="tabs tabs-boxed bg-base-200 w-full rounded-none border-b border-base-300"
                    >
                        <button
                            type="button"
                            role="tab"
                            aria-selected={activeTab === "roster"}
                            className={`tab flex-1 ${activeTab === "roster" ? activeTabClass : "hover:bg-base-300"}`}
                            onClick={() => setActiveTab("roster")}
                        >
                            Competitor roster
                        </button>
                        <button
                            type="button"
                            role="tab"
                            aria-selected={activeTab === "ranges"}
                            className={`tab flex-1 ${activeTab === "ranges" ? activeTabClass : "hover:bg-base-300"}`}
                            onClick={() => setActiveTab("ranges")}
                        >
                            Division — range assignments
                        </button>
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
