import { prismaMock, resetPrismaMock } from "./src/test/prismaSingleton"

jest.mock("@/lib/prisma", () => ({
    __esModule: true,
    default: prismaMock,
    prismaOrThrow: () => prismaMock,
}))

beforeEach(() => {
    resetPrismaMock()
})
