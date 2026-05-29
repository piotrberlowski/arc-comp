"use client"

import FormModal, { type FormModalHandle } from "@/components/FormModal"
import useErrorContext, { useInfoContext } from "@/components/errors/ErrorContext"
import {
    formatAutoSeedFailureMessage,
    formatAutoSeedValidationMessage,
    validateAutoSeedTargetRange,
} from "@/lib/championshipAutoSeed"
import { useRouter } from "next/navigation"
import { useMemo, useRef, useState, useTransition } from "react"
import { autoSeedChampionshipDay } from "../championshipActions"

function AutoSeedTargetFields({
    firstTarget,
    targetCount,
    endCount,
    groupSize,
    onFirstTargetChange,
    onTargetCountChange,
}: {
    firstTarget: number
    targetCount: number
    endCount: number
    groupSize: number
    onFirstTargetChange: (value: number) => void
    onTargetCountChange: (value: number) => void
}) {
    const maxTargetCount = Math.max(1, endCount - firstTarget + 1)

    return (
        <div className="flex flex-col gap-4">
            <p className="text-sm text-base-content/70">
                Assign groups from combined standings through the prior day. Each division keeps standing blocks of{" "}
                {groupSize} together; smaller divisions share targets.
            </p>
            <label className="form-control w-full">
                <span className="label-text">First target</span>
                <input
                    type="number"
                    className="input input-bordered"
                    min={1}
                    max={endCount}
                    value={firstTarget}
                    onChange={(event) => onFirstTargetChange(Number(event.target.value))}
                />
            </label>
            <label className="form-control w-full">
                <span className="label-text">Targets to fill</span>
                <input
                    type="number"
                    className="input input-bordered"
                    min={1}
                    max={maxTargetCount}
                    value={targetCount}
                    onChange={(event) => onTargetCountChange(Number(event.target.value))}
                />
            </label>
            <p className="text-xs text-base-content/60">
                Fills targets {firstTarget}–{firstTarget + targetCount - 1} (max {endCount} for this format).
            </p>
        </div>
    )
}

export default function ChampionshipDayAutoSeedButton({
    championshipId,
    dayOrder,
    rangeNumber,
    endCount,
    groupSize,
}: {
    championshipId: string
    dayOrder: number
    rangeNumber: number
    endCount: number
    groupSize: number
}) {
    const router = useRouter()
    const setError = useErrorContext()
    const setInfo = useInfoContext()
    const modalRef = useRef<FormModalHandle>(null)
    const [firstTarget, setFirstTarget] = useState(1)
    const [targetCount, setTargetCount] = useState(() => Math.min(2, endCount))
    const [isPending, startTransition] = useTransition()

    const maxTargetCount = useMemo(
        () => Math.max(1, endCount - firstTarget + 1),
        [firstTarget, endCount]
    )

    const handleFirstTargetChange = (value: number) => {
        const nextFirstTarget = Number.isFinite(value) ? Math.max(1, Math.min(endCount, value)) : 1
        setFirstTarget(nextFirstTarget)
        setTargetCount((current) => Math.min(current, Math.max(1, endCount - nextFirstTarget + 1)))
    }

    const handleTargetCountChange = (value: number) => {
        const nextTargetCount = Number.isFinite(value)
            ? Math.max(1, Math.min(maxTargetCount, value))
            : 1
        setTargetCount(nextTargetCount)
    }

    const openModal = () => {
        setError(undefined)
        setInfo(undefined)
        modalRef.current?.open()
    }

    const handleAutoSeed = () => {
        const targetRange = { firstTarget, targetCount }
        const validationError = validateAutoSeedTargetRange(targetRange, endCount)
        if (validationError) {
            setError(formatAutoSeedValidationMessage(validationError))
            return
        }

        setError(undefined)
        setInfo(undefined)
        startTransition(() => {
            autoSeedChampionshipDay(championshipId, dayOrder, rangeNumber, targetRange)
                .then((result) => {
                    modalRef.current?.close()
                    const seeded = result.tournaments.reduce(
                        (sum, tournament) => sum + tournament.assignmentsCount,
                        0
                    )
                    setInfo(`Auto-seeded ${seeded} assignments on day ${dayOrder}, range ${rangeNumber}.`)
                    router.refresh()
                })
                .catch((error) => {
                    setError(formatAutoSeedFailureMessage(error))
                })
        })
    }

    return (
        <>
            <button type="button" className="btn btn-secondary btn-xs" onClick={openModal}>
                Auto-seed groups
            </button>
            <FormModal ref={modalRef}>
                <div className="flex flex-col gap-4">
                    <h3 className="text-lg font-medium">
                        Auto-seed day {dayOrder}, range {rangeNumber}
                    </h3>
                    <AutoSeedTargetFields
                        firstTarget={firstTarget}
                        targetCount={targetCount}
                        endCount={endCount}
                        groupSize={groupSize}
                        onFirstTargetChange={handleFirstTargetChange}
                        onTargetCountChange={handleTargetCountChange}
                    />
                    <p className="text-sm text-warning">
                        Seeding replaces all group assignments on this range. If seeding fails, existing groups are
                        left unchanged.
                    </p>
                    <div className="flex flex-wrap justify-end gap-2">
                        <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={() => modalRef.current?.close()}
                            disabled={isPending}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            className="btn btn-secondary"
                            disabled={isPending}
                            onClick={handleAutoSeed}
                        >
                            {isPending ? "Seeding…" : "Seed groups"}
                        </button>
                    </div>
                </div>
            </FormModal>
        </>
    )
}
