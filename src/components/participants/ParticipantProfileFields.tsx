"use client"

import AgeDivisionSelect from "@/app/tournaments/[tId]/components/AgeDivisionSelect"
import EquipmentCategorySelect from "@/app/tournaments/[tId]/components/EquipmentCategorySelect"
import GenderSelect from "@/app/tournaments/[tId]/components/GenderSelect"
import type { ParticipantProfileInput } from "@/lib/participantProfileSchema"

function fieldClass(hasError: boolean, baseClass: string): string {
    return hasError ? `${baseClass} input-error` : baseClass
}

export default function ParticipantProfileFields({
    errors,
    data,
}: {
    errors: Record<string, string>
    data?: Partial<ParticipantProfileInput>
}) {
    return (
        <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-3">
                <label className="form-control flex-1 min-w-48">
                    <span className="label-text">Archer&apos;s name</span>
                    <input
                        type="text"
                        name="name"
                        className={fieldClass(!!errors.name, "input input-bordered w-full")}
                        placeholder="Archer's name"
                        defaultValue={data?.name ?? ""}
                        required
                    />
                </label>
                <label className="form-control flex-1 min-w-40">
                    <span className="label-text">Membership number</span>
                    <input
                        type="text"
                        name="membershipNo"
                        className={fieldClass(!!errors.membershipNo, "input input-bordered w-full")}
                        placeholder="Membership no."
                        defaultValue={data?.membershipNo ?? ""}
                        required
                    />
                </label>
                <label className="form-control flex-1 min-w-40">
                    <span className="label-text">Club</span>
                    <input
                        type="text"
                        name="club"
                        className={fieldClass(!!errors.club, "input input-bordered w-full")}
                        placeholder="Club"
                        defaultValue={data?.club ?? ""}
                        required
                    />
                </label>
            </div>
            <div className="flex flex-wrap gap-3">
                <label className="form-control flex-1 min-w-40">
                    <span className="label-text">Age division</span>
                    <AgeDivisionSelect
                        name="ageGroupId"
                        className={fieldClass(!!errors.ageGroupId, "select select-bordered w-full")}
                        defaultValue={data?.ageGroupId ?? ""}
                    />
                </label>
                <label className="form-control flex-1 min-w-32">
                    <span className="label-text">Gender</span>
                    <GenderSelect
                        name="genderGroup"
                        className={fieldClass(!!errors.genderGroup, "select select-bordered w-full")}
                        defaultValue={data?.genderGroup}
                    />
                </label>
                <label className="form-control flex-1 min-w-40">
                    <span className="label-text">Equipment category</span>
                    <EquipmentCategorySelect
                        name="categoryId"
                        className={fieldClass(!!errors.categoryId, "select select-bordered w-full")}
                        defaultValue={data?.categoryId ?? ""}
                    />
                </label>
            </div>
        </div>
    )
}
