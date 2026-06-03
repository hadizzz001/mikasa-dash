import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const keys = ['bestSeller', 'newArrival', 'offer'];

async function main() {
  for (const key of keys) {
    const existing = await prisma.otherBanner.findUnique({ where: { key } });
    if (existing) {
      console.log(`otherBanner: already exists (${key})`);
      continue;
    }
    await prisma.otherBanner.create({
      data: { key, img: [], percentage: key === 'offer' ? '' : null },
    });
    console.log(`otherBanner: created (${key})`);
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
