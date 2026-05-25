"use client"

import React, { createContext, useContext, useMemo, useState } from "react"
import ErrorAlert from "./ErrorAlert"

type setMessageF = (message?: string) => void

export type ErrorBannerPlacement = "top" | "bottom" | "sticky-top" | "sticky-bottom"

type ErrorContextValue = {
    error?: string
    info?: string
    setError: setMessageF
    setInfo: setMessageF
}

const ErrorContext = createContext<ErrorContextValue>({
    setError: () => {},
    setInfo: () => {},
})

function bannerPlacementClass(placement: ErrorBannerPlacement): string {
    if (placement === "sticky-top") {
        return "sticky top-0 z-40 -mx-1 px-1 pt-1 pb-2 bg-base-100/95 backdrop-blur-sm"
    }
    if (placement === "sticky-bottom") {
        return "sticky bottom-0 z-40 -mx-1 px-1 pt-2 pb-1 bg-base-100/95 backdrop-blur-sm"
    }
    if (placement === "bottom") {
        return "mt-3"
    }
    return "mb-3"
}

export function ErrorContextProvider({ children }: { children: React.ReactNode }) {
    const [error, setErrorState] = useState<string | undefined>(undefined)
    const [info, setInfoState] = useState<string | undefined>(undefined)
    const value = useMemo(
        () => ({
            error,
            info,
            setError: (message?: string) => {
                setErrorState(message)
                if (message) {
                    setInfoState(undefined)
                }
            },
            setInfo: (message?: string) => {
                setInfoState(message)
                if (message) {
                    setErrorState(undefined)
                }
            },
        }),
        [error, info]
    )

    return <ErrorContext.Provider value={value}>{children}</ErrorContext.Provider>
}

export function ErrorContextBanner({
    placement = "sticky-top",
    className = "",
}: {
    placement?: ErrorBannerPlacement
    className?: string
}) {
    const { error, info, setError, setInfo } = useContext(ErrorContext)
    if (!error && !info) {
        return null
    }

    return (
        <div className={`${bannerPlacementClass(placement)} ${className}`.trim()}>
            {info ? (
                <ErrorAlert message={info} tone="info" resetAction={() => setInfo(undefined)} prominent />
            ) : null}
            {error ? (
                <div className={info ? "mt-2" : undefined}>
                    <ErrorAlert message={error} tone="error" resetAction={() => setError(undefined)} prominent />
                </div>
            ) : null}
        </div>
    )
}

export default function useErrorContext(): setMessageF {
    return useContext(ErrorContext).setError
}

export function useInfoContext(): setMessageF {
    return useContext(ErrorContext).setInfo
}
