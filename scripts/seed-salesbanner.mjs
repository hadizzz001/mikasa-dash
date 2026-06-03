import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const id = '699f557b514e4a80f6c81a6b';

async function main() {
  const existing = await prisma.banner3.findUnique({ where: { id } });
  if (existing) {
    console.log(`banner3: already exists (${id})`);
    return;
  }
  await prisma.banner3.create({ data: { id, img: [], imgMobile: [], imgPc: [] } });
  console.log(`banner3: created (${id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
