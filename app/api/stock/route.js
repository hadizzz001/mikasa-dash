// app/api/stock/route.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function PATCH(request, { params }) { 
const bodyText = await request.text(); // instead of request.json()
const [id, qty] = bodyText.split(',');

  try {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      return new Response(JSON.stringify({ error: 'Product not found' }), { status: 404 });
    }

    // Ensure it's type 'single' and stock is a string
    if (product.type !== 'single') {
      return new Response(JSON.stringify({ error: 'Invalid product type' }), { status: 400 });
    }

    const currentStock = parseInt(product.stock, 10);

    if (isNaN(currentStock) || currentStock < qty) {
      return new Response(JSON.stringify({ error: 'Insufficient stock' }), { status: 400 });
    }

    const updatedStock = String(currentStock - qty);

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: { stock: updatedStock },
    });

    return new Response(JSON.stringify(updatedProduct), { status: 200 });
  } catch (error) {
    console.error('Error in /api/stock PATCH:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
