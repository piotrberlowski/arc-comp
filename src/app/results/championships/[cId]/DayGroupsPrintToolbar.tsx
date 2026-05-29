"use client"

export default function DayGroupsPrintToolbar() {
    return (
        <div className="no-print flex flex-wrap items-center gap-2 mb-6">
            <button type="button" className="btn btn-primary btn-sm" onClick={() => window.print()}>
                Print
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => window.close()}>
                Close
            </button>
        </div>
    )
}
