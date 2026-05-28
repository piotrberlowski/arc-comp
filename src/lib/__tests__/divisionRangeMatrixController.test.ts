import type { DivisionRangeMatrixData } from "@/lib/championshipDivisionRangeMatrix"
import {
    DivisionRangeMatrixController,
    type DivisionRangeMatrixGateway,
    type DivisionRangeMatrixStore,
} from "@/lib/divisionRangeMatrixController"

function sampleMatrix(overrides?: Partial<DivisionRangeMatrixData>): DivisionRangeMatrixData {
    return {
        dayOrders: [1, 2],
        rangeCount: 2,
        dayOneFrozen: false,
        totalsByDay: { 1: { 1: 0, 2: 0 }, 2: { 1: 0, 2: 0 } },
        rows: [
            {
                divisionKey: "age-1:M:cat-1",
                ageGroupId: "age-1",
                categoryId: "cat-1",
                categoryName: "Recurve",
                ageGroupName: "Adult",
                genderGroup: "M",
                abbrev: "AM",
                registrationCount: 1,
                rangeByDay: { 1: null, 2: null },
                isCub: false,
            },
        ],
        ...overrides,
    }
}

describe("DivisionRangeMatrixController", () => {
    it("commits matrix after successful assignment", async () => {
        const initial = sampleMatrix()
        let current = initial
        const committed: DivisionRangeMatrixData[] = []

        const store: DivisionRangeMatrixStore = {
            getSnapshot: () => current,
            setOptimistic: (matrix) => {
                current = matrix ?? current
            },
            setCommitted: (matrix) => {
                current = matrix ?? current
                if (matrix) {
                    committed.push(matrix)
                }
            },
            markApplySuccess: () => undefined,
        }

        const gateway: DivisionRangeMatrixGateway = {
            setAssignments: async () =>
                sampleMatrix({
                    rows: [
                        {
                            ...initial.rows[0]!,
                            rangeByDay: { 1: 1, 2: null },
                        },
                    ],
                }),
            loadMatrix: async () => initial,
        }

        const controller = new DivisionRangeMatrixController("c-1", gateway, store)
        const result = await controller.applyAssignments([
            { divisionKey: "age-1:M:cat-1", dayOrder: 1, rangeNumber: 1 },
        ])

        expect(result?.rows[0]?.rangeByDay[1]).toBe(1)
        expect(committed).toHaveLength(1)
    })

    it("restores matrix when assignment fails", async () => {
        const initial = sampleMatrix()
        let current = initial

        const store: DivisionRangeMatrixStore = {
            getSnapshot: () => current,
            setOptimistic: (matrix) => {
                current = matrix ?? current
            },
            setCommitted: (matrix) => {
                current = matrix ?? current
            },
            markApplySuccess: () => undefined,
        }

        const gateway: DivisionRangeMatrixGateway = {
            setAssignments: async () => {
                throw new Error("save failed")
            },
            loadMatrix: async () => initial,
        }

        const controller = new DivisionRangeMatrixController("c-1", gateway, store)

        await expect(
            controller.applyAssignments([
                { divisionKey: "age-1:M:cat-1", dayOrder: 1, rangeNumber: 1 },
            ])
        ).rejects.toThrow("save failed")

        expect(current).toEqual(initial)
    })
})
