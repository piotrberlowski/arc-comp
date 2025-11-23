"use client"

import { ExclamationTriangleIcon, TrashIcon } from "@heroicons/react/24/outline"

export default function GroupWarningHeader({ 
    totalAssigned,
    notCheckedInCount,
    onCleanup,
    isCleanupPending = false 
}: {
    totalAssigned: number
    notCheckedInCount: number
    onCleanup: () => void
    isCleanupPending?: boolean
}) {
    if (notCheckedInCount === 0) {
        return null
    }

    return (
        <div className="alert alert-warning mb-4">
            <ExclamationTriangleIcon className="w-5 h-5" />
            <span className="flex-1">
                {notCheckedInCount} of {totalAssigned} assigned participants are not checked in
            </span>
            <button
                className="btn btn-warning btn-sm"
                onClick={onCleanup}
                disabled={isCleanupPending}
            >
                {isCleanupPending ? (
                    <span className="loading loading-spinner loading-xs"></span>
                ) : (
                    <TrashIcon className="w-4 h-4" />
                )}
                Clean Up Groups
            </button>
        </div>
    )
}
