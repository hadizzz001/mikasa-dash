/**
 * One-off migration: convert Product.category from a single string (or null)
 * into an array of strings so an item can belong to many categories.
 *
 * Rules applied to every Product document:
 *   - already an array        -> kept as-is
 *   - non-empty string        -> wrapped into a single-element array
 *   - empty/null but has a
 *     `factory` value          -> seeded with [factory]
 *   - otherwise               -> []
 *
 * Run with:  node scripts/migrate-category-array.mjs
 *
 * Uses prisma.$runCommandRaw so it bypasses Prisma's schema validation
 * (old documents still hold a plain string, which a typed read would reject).
 */
import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// Prisma CLI auto-loads .env, but a plain `node` run does not — load it manually.
if (!process.env.DATABASE_URL) {
  try {
    const here = dirname(fileURLToPath(import.meta.url));
    const envText = readFileSync(join(here, '..', '.env'), 'utf8');
    for (const line of envText.split('\n')) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
      if (!match) continue;
      let value = match[2].trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[match[1]]) process.env[match[1]] = value;
    }
  } catch {
    // ignore: rely on the ambient environment
  }
}

const prisma = new PrismaClient();

async function main() {
  console.log('Converting Product.category to an array of strings...');

  const result = await prisma.$runCommandRaw({
    update: 'Product',
    updates: [
      {
        q: {},
        u: [
          {
            $set: {
              category: {
                $switch: {
                  branches: [
                    // already an array -> keep it
                    {
                      case: { $eq: [{ $type: '$category' }, 'array'] },
                      then: '$category',
                    },
                    // non-empty string -> wrap into a single-element array
                    {
                      case: {
                        $and: [
                          { $eq: [{ $type: '$category' }, 'string'] },
                          { $ne: ['$category', ''] },
                        ],
                      },
                      then: ['$category'],
                    },
                    // no category yet but a factory value exists -> use it
                    {
                      case: {
                        $and: [
                          { $eq: [{ $type: '$factory' }, 'string'] },
                          { $ne: ['$factory', ''] },
                        ],
                      },
                      then: ['$factory'],
                    },
                  ],
                  default: [],
                },
              },
            },
          },
        ],
        multi: true,
      },
    ],
  });

  const matched = result?.n ?? 0;
  const modified = result?.nModified ?? 0;
  console.log(`Done. Matched ${matched} product(s), modified ${modified}.`);
}

main()
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
