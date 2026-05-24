"use client"

import AgeDivisionSelect from "@/app/tournaments/[tId]/components/AgeDivisionSelect"
import EquipmentCategorySelect from "@/app/tournaments/[tId]/components/EquipmentCategorySelect"
import GenderSelect from "@/app/tournaments/[tId]/components/GenderSelect"
import type { ParticipantProfileInput } from "@/lib/participantProfileSchema"
import {
    getParticipantProfileFieldDefinition,
    participantProfileFieldGroups,
    participantProfileFields,
    type ParticipantProfileFieldDefinition,
    type ParticipantProfileFieldKey,
} from "@/lib/participantProfileFields"

function fieldClass(hasError: boolean, baseClass: string): string {
    return hasError ? `${baseClass} input-error` : baseClass
}

function renderProfileControl({
    field,
    errors,
    data,
    inputClassName,
    selectClassName,
}: {
    field: ParticipantProfileFieldDefinition
    errors: Record<string, string>
    data?: Partial<ParticipantProfileInput>
    inputClassName: string
    selectClassName: string
}) {
    const value = data?.[field.key]

    if (field.kind === "text") {
        return (
            <input
                type="text"
                name={field.key}
                className={fieldClass(!!errors[field.key], inputClassName)}
                placeholder={field.placeholder}
                defaultValue={typeof value === "string" ? value : ""}
                required
            />
        )
    }

    if (field.kind === "ageGroup") {
        return (
            <AgeDivisionSelect
                name={field.key}
                className={fieldClass(!!errors[field.key], selectClassName)}
                defaultValue={typeof value === "string" ? value : ""}
            />
        )
    }

    if (field.kind === "gender") {
        return (
            <GenderSelect
                name={field.key}
                className={fieldClass(!!errors[field.key], selectClassName)}
                defaultValue={value === "F" || value === "M" ? value : undefined}
            />
        )
    }

    return (
        <EquipmentCategorySelect
            name={field.key}
            className={fieldClass(!!errors[field.key], selectClassName)}
            defaultValue={typeof value === "string" ? value : ""}
        />
    )
}

function StackedField({
    fieldKey,
    errors,
    data,
}: {
    fieldKey: ParticipantProfileFieldKey
    errors: Record<string, string>
    data?: Partial<ParticipantProfileInput>
}) {
    const field = getParticipantProfileFieldDefinition(fieldKey)

    return (
        <label className="form-control flex-1 min-w-40">
            <span className="label-text">{field.label}</span>
            {renderProfileControl({
                field,
                errors,
                data,
                inputClassName: "input input-bordered w-full",
                selectClassName: "select select-bordered w-full",
            })}
        </label>
    )
}

function InlineField({
    fieldKey,
    errors,
    data,
}: {
    fieldKey: ParticipantProfileFieldKey
    errors: Record<string, string>
    data?: Partial<ParticipantProfileInput>
}) {
    const field = getParticipantProfileFieldDefinition(fieldKey)

    return renderProfileControl({
        field,
        errors,
        data,
        inputClassName: "sm:w-2/5 input input-xs md:input-sm flex-grow input-secondary",
        selectClassName: "min-w-fit select select-xs md:select-sm select-secondary w-2/5 md:w-1/3 flex-1",
    })
}

export default function ParticipantProfileFields({
    errors,
    data,
    layout = "stacked",
}: {
    errors: Record<string, string>
    data?: Partial<ParticipantProfileInput>
    layout?: "stacked" | "inline"
}) {
    if (layout === "inline") {
        return (
            <div className="flex-1 flex gap-1 flex-wrap items-stretch">
                {participantProfileFields.map((field) => (
                    <InlineField key={field.key} fieldKey={field.key} errors={errors} data={data} />
                ))}
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-3">
            {participantProfileFieldGroups.map((group) => (
                <div key={group.join("-")} className="flex flex-wrap gap-3">
                    {group.map((fieldKey) => (
                        <StackedField key={fieldKey} fieldKey={fieldKey} errors={errors} data={data} />
                    ))}
                </div>
            ))}
        </div>
    )
}
