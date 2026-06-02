// app/api/stock2/route.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function PATCH(request, { params }) {
  const bodyText = await request.text();  
  const [id, qtyStr, color, size] = bodyText.split(',');
  const quantity = parseInt(qtyStr, 10);

  try {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return new Response(JSON.stringify({ error: 'Product not found' }), { status: 404 });

    const colorList = product.color || [];
    const colorIndex = colorList.findIndex(c => c.color === color);
    if (colorIndex === -1) return new Response(JSON.stringify({ error: 'Color not found' }), { status: 400 });

    const sizes = colorList[colorIndex].sizes || [];
    const sizeIndex = sizes.findIndex(s => s.size === size);

    if (sizeIndex === -1) {
      return new Response(JSON.stringify({ error: 'Size not found' }), { status: 400 });
    }

    sizes[sizeIndex].qty += quantity;  // <-- changed from -= to +=
    colorList[colorIndex].sizes = sizes;

    const updated = await prisma.product.update({
      where: { id },
      data: { color: colorList },
    });

    return new Response(JSON.stringify(updated), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
