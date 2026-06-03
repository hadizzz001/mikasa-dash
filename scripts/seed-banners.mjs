import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Fixed IDs used by the dashboard pages (app/banner, app/banner1, app/banner2)
const records = [
  { model: 'banner', id: '699f557b514e4a80f6c81a68' },
  { model: 'banner1', id: '699f557b514e4a80f6c81a69' },
  { model: 'banner2', id: '699f557b514e4a80f6c81a6a' },
];

async function main() {
  for (const { model, id } of records) {
    const existing = await prisma[model].findUnique({ where: { id } });
    if (existing) {
      console.log(`${model}: already exists (${id})`);
      continue;
    }
    await prisma[model].create({
      data: { id, img: [], imgMobile: [], imgPc: [] },
    });
    console.log(`${model}: created (${id})`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
