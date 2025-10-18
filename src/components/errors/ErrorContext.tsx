'use client'

import React, { createContext, useContext, useState } from "react";
import ErrorAlert from "./ErrorAlert";

type setErrorF = (e?: string) => void

const ErrorContext = createContext<setErrorF>(() => { })

export function ErrorContextProvider({ children }: { children: React.ReactNode }) {
    const [error, setError] = useState<string | undefined>(undefined)
    return (
        <ErrorContext.Provider value={(e) => setError(e)}>
            {children}
            <ErrorAlert error={error} resetAction={() => setError("")} />
        </ErrorContext.Provider>
    )
}

export default function useErrorContext() {
    return useContext(ErrorContext)
}