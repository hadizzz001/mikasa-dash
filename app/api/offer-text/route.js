import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - fetch the offer text (returns the first/only record)
export async function GET(req) {
  try {
    const offerText = await prisma.offerText.findFirst();
    return new Response(JSON.stringify(offerText), { status: 200 });
  } catch (error) {
    console.error('Error fetching offer text:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch offer text' }), { status: 500 });
  }
}

// POST - create or update the offer text (upsert: only 1 record ever)
export async function POST(req) {
  try {
    const { text } = await req.json();

    // Check if a record already exists
    const existing = await prisma.offerText.findFirst();

    let offerText;
    if (existing) {
      // Update the existing record
      offerText = await prisma.offerText.update({
        where: { id: existing.id },
        data: { text },
      });
    } else {
      // Create a new record
      offerText = await prisma.offerText.create({
        data: { text },
      });
    }

    return new Response(JSON.stringify({ message: 'Offer text saved successfully', offerText }), {
      status: 201,
    });
  } catch (error) {
    console.error('Error saving offer text:', error);
    return new Response(JSON.stringify({ error: 'Failed to save offer text' }), { status: 500 });
  }
}
