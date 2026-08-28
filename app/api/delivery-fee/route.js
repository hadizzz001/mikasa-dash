import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - fetch the delivery fee (single record)
export async function GET(req) {
  try {
    const deliveryFee = await prisma.deliveryFee.findFirst();
    return new Response(JSON.stringify(deliveryFee), { status: 200 });
  } catch (error) {
    console.error('Error fetching delivery fee:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch delivery fee' }), { status: 500 });
  }
}

// POST - create or update the delivery fee (upsert: only 1 record ever)
export async function POST(req) {
  try {
    const body = await req.json();
    const fee = String(body?.fee ?? '').trim();

    if (fee === '' || isNaN(Number(fee)) || Number(fee) < 0) {
      return new Response(JSON.stringify({ error: 'Delivery fee must be a positive number' }), {
        status: 400,
      });
    }

    const existing = await prisma.deliveryFee.findFirst();

    let deliveryFee;
    if (existing) {
      deliveryFee = await prisma.deliveryFee.update({
        where: { id: existing.id },
        data: { fee },
      });
    } else {
      deliveryFee = await prisma.deliveryFee.create({ data: { fee } });
    }

    return new Response(
      JSON.stringify({ message: 'Delivery fee saved successfully', deliveryFee }),
      { status: 201 }
    );
  } catch (error) {
    console.error('Error saving delivery fee:', error);
    return new Response(JSON.stringify({ error: 'Failed to save delivery fee' }), { status: 500 });
  }
}
