import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const sections = [
  { key: 'section1', order: 1 },
  { key: 'section2', order: 2 },
  { key: 'section3', order: 3 },
  { key: 'section4', order: 4 },
];

async function main() {
  for (const { key, order } of sections) {
    const existing = await prisma.section.findUnique({ where: { key } });
    if (existing) {
      console.log(`section: already exists (${key})`);
      continue;
    }
    await prisma.section.create({
      data: {
        key,
        order,
        img: [],
        title: '',
        description: '',
        url: key === 'section4' ? '' : null,
      },
    });
    console.log(`section: created (${key})`);
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
