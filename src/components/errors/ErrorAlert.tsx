import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

export default function ErrorAlert({ error, resetAction }: { error?: string, resetAction: () => void }) {
    let message = ""
    if (!!error) {
        if (typeof (error) === "string") {
            message = error
        } else {
            message = JSON.stringify(error)
        }
    }

    return (
        <div role="alert" className="alert alert-error alert-vertical sm:alert-horizontal" hidden={message === ""}>
            <ExclamationTriangleIcon width={24} />
            <div className="flex-1">{message}</div>
            <div>
                <button className="btn btn-sm btn-outline" onClick={() => resetAction()}>X</button>
            </div>
        </div>
    )
}