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
                ],
                skipDuplicates: true,
            }),
            prisma.user.updateMany({
                where: {
                    email: "piotr.berlowski@gmail.com"
                },
                data: {
                    isAdmin: true
                },
            }),
            prisma.ageGroup.createMany({
                data: [
                    {id: "C", name: "Cub"},
                    {id: "J", name: "Junior"},
                    {id: "YA", name: "Young Adult"},
                    {id: "A", name: "Adult"},
                    {id: "V", name: "Veteran"},
                    {id: "S", name: "Senior"},
                ],
                skipDuplicates: true,
            }),
            prisma.equipmentCategory.createMany({
                data: [
                    {id: "HB", name: "Historical Bow"},
                    {id: "LB", name: "Longbow"},
                    {id: "TR", name: "Traditional Recurve"},
                    {id: "BHR", name: "Bowhunter Recurve"},
                    {id: "BHC", name: "Bowhunter Compound"},
                    {id: "BU", name: "Bowhunter Unlimited"},
                    {id: "BL", name: "Bowhunter Limited"},
                    {id: "BBR", name: "Barebow Recurve"},
                    {id: "BBC", name: "Barebow Compound"},
                    {id: "FSC", name: "Freestyle Compound"},
                    {id: "FSR", name: "Freestyle Recurve"},
                    {id: "FU", name: "Freestyle Unlimited"},
                    {id: "PFAA-ETR", name: "PFAA Eastern Thumb Ring / Zekier"},
                ],
                skipDuplicates: true,
            })
            ],
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