import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ---- Reference data (must match existing Color / Size / Factory records) ----
const COLORS = {
  Red: '#d36464',
  gray: '#c2c2c2',
  Black: '#000000',
  Offwhite: '#fffbeb',
};
const SIZES = ['Small', 'Large'];
const CATEGORIES = [
  'LIVING ROOM',
  'KITCHEN & DINING',
  'BATHROOM',
  'BEDROOM',
  'STORAGE & ORGANIZATION',
  'SEASONAL & GIFTS',
];

const IMAGES = [
  'https://res.cloudinary.com/dh2c4clxo/image/upload/v1780502438/Minimal_Bowl_grande-removebg-preview_copy_bkpjyu.png',
  'https://res.cloudinary.com/dh2c4clxo/image/upload/v1780502439/Minimal_Bowl_grande-removebg-preview_qmxkyx.png',
  'https://res.cloudinary.com/dh2c4clxo/image/upload/v1780502456/entry_ci8bs1.jpg',
  'https://res.cloudinary.com/dh2c4clxo/image/upload/v1780502458/furnt_aguwjf.jpg',
  'https://res.cloudinary.com/dh2c4clxo/image/upload/v1780502337/Minimal_Bowl_grande-removebg-preview_copy_pusscl.png',
  'https://res.cloudinary.com/dh2c4clxo/image/upload/v1780502338/Minimal_Bowl_grande-removebg-preview_zmzdwp.png',
];

// pick `n` images starting at an offset (wraps around)
const pickImages = (offset, n) =>
  Array.from({ length: n }, (_, i) => IMAGES[(offset + i) % IMAGES.length]);

// final price after percentage discount
const finalPrice = (price, percentage) => {
  const p = Number(price);
  const pct = Number(percentage);
  return pct > 0 ? (p - (p * pct) / 100).toFixed(2) : p.toFixed(2);
};

const makeSize = (size, qty, price, percentage = '') => ({
  size,
  qty: String(qty),
  price: String(price),
  percentage: percentage ? String(percentage) : '',
  discount: percentage ? finalPrice(price, percentage) : '',
});

// Build collection-level price / discount / percentage from variants (mirrors the UI logic)
const summarizeCollection = (variants) => {
  const finals = variants.flatMap((v) =>
    v.sizes
      .map((sz) => Number(finalPrice(sz.price, sz.percentage)))
      .filter((n) => n > 0)
  );
  const min = finals.length ? Math.min(...finals).toFixed(2) : '0';
  const max = finals.length ? Math.max(...finals).toFixed(2) : '0';
  const pcts = variants
    .flatMap((v) => v.sizes.map((sz) => Number(sz.percentage) || 0))
    .filter((n) => n > 0);
  let percentage = null;
  if (pcts.length) {
    const mn = Math.min(...pcts);
    const mx = Math.max(...pcts);
    percentage = mn === mx ? String(mn) : `${mn}-${mx}`;
  }
  return {
    price: min,
    discount: min !== max ? min : null,
    percentage,
  };
};

const products = [];
let imgOffset = 0;

// ---------- 5 SINGLE products ----------
const singleDefs = [
  { title: 'Ceramic Coffee Mug', code: 'SNG-1001', price: 12, pct: 0, stock: 40, track: true },
  { title: 'Stainless Steel Kettle', code: 'SNG-1002', price: 45, pct: 10, stock: 18, track: true },
  { title: 'Bamboo Cutting Board', code: 'SNG-1003', price: 22, pct: 0, stock: 0, track: false },
  { title: 'Glass Storage Jar', code: 'SNG-1004', price: 9.5, pct: 15, stock: 60, track: true },
  { title: 'Cotton Bath Towel', code: 'SNG-1005', price: 18, pct: 20, stock: 25, track: true },
];
singleDefs.forEach((d, i) => {
  const cat = CATEGORIES[i % CATEGORIES.length];
  products.push({
    title: d.title,
    code: d.code,
    description: `<p>${d.title} — a quality single product.</p>`,
    price: Number(d.price).toFixed(2),
    discount: d.pct > 0 ? finalPrice(d.price, d.pct) : null,
    percentage: d.pct > 0 ? String(d.pct) : null,
    img: pickImages((imgOffset += 1), 3),
    category: null,
    stock: d.track ? String(d.stock) : null,
    stockEnabled: d.track,
    color: null,
    type: 'single',
    collectionMode: null,
    factory: cat,
    arrival: i % 2 === 0 ? 'yes' : 'no',
    sale: i % 3 === 0 ? 'yes' : 'no',
    noprice: 'no',
    tax: 'no',
    specs: null,
  });
});

// ---------- 5 COLLECTION: size & color ----------
const sizeColorDefs = [
  { title: 'Modern Dinner Plate Set', code: 'SC-2001', track: true },
  { title: 'Linen Throw Pillow', code: 'SC-2002', track: true },
  { title: 'Velvet Cushion Cover', code: 'SC-2003', track: true },
  { title: 'Woven Floor Basket', code: 'SC-2004', track: false },
  { title: 'Quilted Bed Runner', code: 'SC-2005', track: true },
];
sizeColorDefs.forEach((d, i) => {
  const cat = CATEGORIES[i % CATEGORIES.length];
  const colorNames = ['Black', 'Offwhite', 'Red'].slice(0, 2 + (i % 2));
  const variants = colorNames.map((cn, ci) => ({
    color: cn,
    colorCode: COLORS[cn],
    colorImg: '',
    images: pickImages((imgOffset += 2), 2),
    sizes: [
      makeSize('Small', d.track ? 10 + ci * 3 : 0, 14 + ci * 2, ci === 0 ? 10 : ''),
      makeSize('Large', d.track ? 6 + ci * 2 : 0, 24 + ci * 3, ci === 1 ? 15 : ''),
    ],
  }));
  const sum = summarizeCollection(variants);
  products.push({
    title: d.title,
    code: d.code,
    description: `<p>${d.title} — available in multiple colors and sizes.</p>`,
    ...sum,
    img: variants.flatMap((v) => v.images),
    category: null,
    stock: null,
    stockEnabled: d.track,
    color: variants,
    type: 'collection',
    collectionMode: 'sizeColor',
    factory: cat,
    arrival: i % 2 === 1 ? 'yes' : 'no',
    sale: i % 2 === 0 ? 'yes' : 'no',
    noprice: 'no',
    tax: 'no',
    specs: null,
  });
});

// ---------- 5 COLLECTION: color only ----------
const colorOnlyDefs = [
  { title: 'Scented Pillar Candle', code: 'CO-3001', track: true },
  { title: 'Ceramic Plant Pot', code: 'CO-3002', track: true },
  { title: 'Decorative Wall Clock', code: 'CO-3003', track: false },
  { title: 'Soft Knit Blanket', code: 'CO-3004', track: true },
  { title: 'Matte Serving Bowl', code: 'CO-3005', track: true },
];
colorOnlyDefs.forEach((d, i) => {
  const cat = CATEGORIES[i % CATEGORIES.length];
  const colorNames = ['Red', 'gray', 'Black', 'Offwhite'].slice(0, 2 + (i % 3));
  const variants = colorNames.map((cn, ci) => ({
    color: cn,
    colorCode: COLORS[cn],
    colorImg: '',
    images: pickImages((imgOffset += 1), 2),
    // color-only => a single size row with an empty size name
    sizes: [makeSize('', d.track ? 8 + ci * 4 : 0, 20 + ci * 5, ci % 2 === 0 ? 10 : '')],
  }));
  const sum = summarizeCollection(variants);
  products.push({
    title: d.title,
    code: d.code,
    description: `<p>${d.title} — choose your color.</p>`,
    ...sum,
    img: variants.flatMap((v) => v.images),
    category: null,
    stock: null,
    stockEnabled: d.track,
    color: variants,
    type: 'collection',
    collectionMode: 'colorOnly',
    factory: cat,
    arrival: i % 3 === 0 ? 'yes' : 'no',
    sale: i % 2 === 1 ? 'yes' : 'no',
    noprice: 'no',
    tax: 'no',
    specs: null,
  });
});

// ---------- 5 COLLECTION: size only ----------
const sizeOnlyDefs = [
  { title: 'Storage Box Organizer', code: 'SO-4001', track: true },
  { title: 'Kitchen Apron', code: 'SO-4002', track: true },
  { title: 'Microfiber Floor Mat', code: 'SO-4003', track: false },
  { title: 'Reusable Food Wrap', code: 'SO-4004', track: true },
  { title: 'Insulated Lunch Bag', code: 'SO-4005', track: true },
];
sizeOnlyDefs.forEach((d, i) => {
  const cat = CATEGORIES[i % CATEGORIES.length];
  const variant = {
    color: '',
    colorCode: '',
    colorImg: '',
    images: pickImages((imgOffset += 2), 3),
    sizes: [
      makeSize('Small', d.track ? 15 : 0, 11 + i, i % 2 === 0 ? 10 : ''),
      makeSize('Large', d.track ? 9 : 0, 19 + i, i % 2 === 1 ? 15 : ''),
    ],
  };
  const variants = [variant];
  const sum = summarizeCollection(variants);
  products.push({
    title: d.title,
    code: d.code,
    description: `<p>${d.title} — available in multiple sizes.</p>`,
    ...sum,
    img: variant.images,
    category: null,
    stock: null,
    stockEnabled: d.track,
    color: variants,
    type: 'collection',
    collectionMode: 'sizeOnly',
    factory: cat,
    arrival: i % 2 === 0 ? 'yes' : 'no',
    sale: i % 3 === 1 ? 'yes' : 'no',
    noprice: 'no',
    tax: 'no',
    specs: null,
  });
});

async function main() {
  console.log(`Seeding ${products.length} products...`);
  const result = await prisma.product.createMany({ data: products });
  console.log('Inserted:', result.count);
  const byMode = await prisma.product.groupBy({
    by: ['type', 'collectionMode'],
    _count: { _all: true },
  });
  console.log('Totals by type/mode:', JSON.stringify(byMode));
  console.log('Total products now:', await prisma.product.count());
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
