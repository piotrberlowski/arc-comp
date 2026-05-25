"use client"

import { ErrorContextBanner, ErrorContextProvider } from "@/components/errors/ErrorContext"
import { forwardRef, useImperativeHandle, useRef, type ReactNode } from "react"

export type FormModalHandle = {
    open: () => void
    close: () => void
}

const FormModal = forwardRef<FormModalHandle, { children: ReactNode }>(function FormModal(
    { children },
    ref
) {
    const dialogRef = useRef<HTMLDialogElement>(null)

    useImperativeHandle(ref, () => ({
        open: () => dialogRef.current?.showModal(),
        close: () => dialogRef.current?.close(),
    }))

    return (
        <dialog ref={dialogRef} className="modal">
            <div className="modal-box p-10">
                <form method="dialog">
                    <button type="submit" className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
                        ✕
                    </button>
                </form>
                <ErrorContextProvider>
                    <ErrorContextBanner placement="top" />
                    {children}
                </ErrorContextProvider>
            </div>
        </dialog>
    )
})

export default FormModal
