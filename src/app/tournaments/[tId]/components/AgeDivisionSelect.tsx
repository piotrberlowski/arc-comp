'use client'

import { useAgeDivisions } from "@/data/dataHooks"
import { SelectElementParams } from "./api"

export default function AgeDivisionSelect(props:SelectElementParams) {
    
    const {ageDivisions, error, isLoading} = useAgeDivisions()

    if (isLoading) {
        return (
            <span className="loading loading-infinity loading-md"></span>
        )
    }

    if (error) {
        return (
            <div role="alert" className="alert alert-error">
                {JSON.stringify(error)}
            </div>
        )
    }

    return (
        <select {...props} key={props.defaultValue}>
            {
                ageDivisions?.map(c => {
                    return (
                        <option key={`age-select-${c.id}`} value={c.id}>
                            {c.name}
                        </option>
                    )
                })
            }
        </select>

    )

}