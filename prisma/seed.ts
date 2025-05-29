import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const response = await Promise.all(
        [
            prisma.roundFormat.createMany({
                data: [
                    { name: "Unmarked Animal Round" },
                    { name: "3D-Standard Round" },
                    { name: "Hunting Round (Bowhunting)" },
                    { name: "Field Round" },
                    { name: "Hunter Round (Field)" },
                    { name: "Marked Animal Round" },
                    { name: "Flint", endCount: 14, groupSize: 2 },
                    { name: "Indoor", endCount: 12 },
                ]
            }),
            prisma.user.updateMany({
                where: {
                    email: "piotr.berlowski@gmail.com"
                },
                data: {
                    isAdmin: true
                },
            })]
    )
    console.log({ response })
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })