'use client'
import { JSX, useState } from "react"

interface BtnProps {
    className?: string
    children: JSX.Element
}

export default function ConfirmingButton({ action, baseButton, confirmButton, className }: { action: () => Promise<unknown>, baseButton: BtnProps, confirmButton: BtnProps, className?: string }) {
    const [isConfirming, setConfirming] = useState(false)
    const [isLoading, setLoading] = useState(false)

    if (isLoading) {
        return <span className="loading loading-ring loading-xs"></span>
    }

    let button = baseButton
    let stateBasedAction = () => setConfirming(true)
    if (isConfirming) {
        button = confirmButton
        stateBasedAction = () => {
            setLoading(true)
            action().then(() => setLoading(false))
        }
    }

    return (
        <form action={stateBasedAction} className={className}>
            <button className={`btn ${button.className}`}>{button.children}</button>
        </form>
    )
}