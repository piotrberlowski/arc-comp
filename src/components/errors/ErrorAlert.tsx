import { ExclamationTriangleIcon, InformationCircleIcon, XMarkIcon } from "@heroicons/react/24/outline"

export default function ErrorAlert({
    message,
    error,
    tone = "error",
    resetAction,
    prominent = false,
}: {
    message?: string
    error?: string
    tone?: "error" | "info"
    resetAction: () => void
    prominent?: boolean
}) {
    const text = typeof message === "string" ? message.trim() : typeof error === "string" ? error.trim() : ""
    if (!text) {
        return null
    }

    const Icon = tone === "info" ? InformationCircleIcon : ExclamationTriangleIcon
    const alertClass =
        tone === "info"
            ? prominent
                ? "alert alert-info shadow-lg ring-2 ring-info/30 text-sm font-medium"
                : "alert alert-info alert-vertical sm:alert-horizontal"
            : prominent
              ? "alert alert-error shadow-lg ring-2 ring-error/40 text-sm font-medium"
              : "alert alert-error alert-vertical sm:alert-horizontal"

    return (
        <div role="alert" className={alertClass}>
            <Icon width={24} className="shrink-0" />
            <div className="flex-1 whitespace-pre-wrap">{text}</div>
            <button
                type="button"
                className="btn btn-sm btn-ghost btn-square shrink-0"
                aria-label="Dismiss message"
                onClick={() => resetAction()}
            >
                <XMarkIcon width={20} />
            </button>
        </div>
    )
}
