/**
 * One-time migration script:
 *
 * Backfills `percentage` for each size in collection variants and recomputes
 * the read-only `discount` field (final price after %).
 *
 * Legacy schema (collection variants):
 *   sizes: [{ size, qty, price, discount }]    // `discount` actually held the % value (<=100)
 *
 * New schema:
 *   sizes: [{ size, qty, price, percentage, discount }]
 *     - percentage: discount % (e.g. "10")
 *     - discount:   final price after % (e.g. "90.00")
 *
 * Rules:
 *   - If `percentage` already exists -> keep, only recompute final `discount`.
 *   - Else if legacy `discount` is a number 0..100 -> treat as percentage.
 *   - Else -> percentage = "0".
 *   - When percentage is 0/empty -> discount = "" (no discount).
 *   - Top-level Product.percentage:
 *       - For collection: derived from sizes (single value or "min-max"). If all 0 -> "0".
 *       - For single: leave as is; if missing, set to "0".
 *
 * Run:  node prisma/migrate-percentage.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function computeFinalPrice(price, pct) {
  const p = Number(price);
  const r = Number(pct);
  if (!p || !r || r <= 0) return '';
  return (p - (p * r) / 100).toFixed(2);
}

function normalizeSize(sz) {
  const hasNewPct = sz.percentage !== undefined && sz.percentage !== null && sz.percentage !== '';
  let percentage;
  if (hasNewPct) {
    percentage = String(sz.percentage);
  } else if (
    sz.discount !== undefined &&
    sz.discount !== null &&
    sz.discount !== '' &&
    !isNaN(Number(sz.discount)) &&
    Number(sz.discount) >= 0 &&
    Number(sz.discount) <= 100
  ) {
    // legacy: `discount` stored the percentage value
    percentage = String(Number(sz.discount));
  } else {
    percentage = '0';
  }

  const finalPrice = computeFinalPrice(sz.price, percentage);

  return {
    size: sz.size ?? '',
    qty: sz.qty ?? '',
    price: sz.price ?? '',
    percentage,
    discount: finalPrice, // empty if percentage is 0
  };
}

async function main() {
  const products = await prisma.product.findMany();
  console.log(`Found ${products.length} products. Starting migration...`);

  let updated = 0;
  let skipped = 0;

  for (const product of products) {
    const data = {};

    // ---- Collection variants ----
    if (product.type === 'collection' && Array.isArray(product.color) && product.color.length > 0) {
      const newColor = product.color.map((variant) => ({
        ...variant,
        sizes: Array.isArray(variant.sizes) ? variant.sizes.map(normalizeSize) : [],
      }));

      data.color = newColor;

      // Top-level percentage from sizes
      const pctsRaw = newColor.flatMap((v) => v.sizes.map((s) => Number(s.percentage) || 0));
      const positivePcts = pctsRaw.filter((p) => p > 0);
      let topPct;
      if (positivePcts.length === 0) {
        topPct = '0';
      } else {
        const min = Math.min(...positivePcts);
        const max = Math.max(...positivePcts);
        topPct = min === max ? String(min) : `${min}-${max}`;
      }
      data.percentage = topPct;

      // Top-level discount = min final price (matches save logic) when range exists
      const finalPrices = newColor
        .flatMap((v) => v.sizes.map((s) => Number(s.discount) || Number(s.price) || 0))
        .filter((p) => p > 0);
      if (finalPrices.length > 0) {
        const minF = Math.min(...finalPrices).toFixed(2);
        const maxF = Math.max(...finalPrices).toFixed(2);
        data.discount = minF !== maxF ? minF : null;
        data.price = minF;
      }
    }

    // ---- Single products ----
    else {
      // Ensure percentage is at least "0" if missing
      if (
        product.percentage === undefined ||
        product.percentage === null ||
        product.percentage === ''
      ) {
        data.percentage = '0';
      }

      // Recompute discount (final price) if percentage > 0
      const pct = Number(data.percentage ?? product.percentage);
      if (pct > 0 && product.price) {
        data.discount = computeFinalPrice(product.price, pct);
      } else if (pct === 0) {
        data.discount = null;
      }
    }

    if (Object.keys(data).length === 0) {
      skipped++;
      continue;
    }

    try {
      await prisma.product.update({ where: { id: product.id }, data });
      updated++;
      console.log(`✅ ${product.id}  ${product.title}  -> percentage=${data.percentage ?? '(unchanged)'}`);
    } catch (err) {
      console.error(`❌ Failed to update ${product.id}:`, err.message);
    }
  }

  console.log(`\nDone. Updated: ${updated}, Skipped: ${skipped}, Total: ${products.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
