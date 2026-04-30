import type { PrismaClient } from "@/generated/prisma/client"
import { mockDeep, mockReset, type DeepMockProxy } from "jest-mock-extended"

/**
 * Shared PrismaClient mock for Jest. Import from here in tests to configure
 * `prismaMock.*` delegates; `@/lib/prisma` is wired to this instance via jest.setup.
 */
export const prismaMock: DeepMockProxy<PrismaClient> = mockDeep<PrismaClient>()

export function resetPrismaMock(): void {
    mockReset(prismaMock)
}

type TransactionClient = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0]

/**
 * Mocks interactive transactions (`prisma.$transaction(async (tx) => ...)`) by
 * invoking the callback with the provided transaction client mock.
 */
export function mockInteractiveTransaction(
    txClient: Partial<DeepMockProxy<TransactionClient>> = prismaMock
): void {
    prismaMock.$transaction.mockImplementation(async (arg: unknown) => {
        if (typeof arg === "function") {
            return await (arg as (tx: Partial<DeepMockProxy<TransactionClient>>) => Promise<unknown>)(txClient)
        }
        return arg
    })
}
