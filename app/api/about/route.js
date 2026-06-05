import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - fetch the about content (returns the first/only record)
export async function GET(req) {
  try {
    const about = await prisma.about.findFirst();
    return new Response(JSON.stringify(about), { status: 200 });
  } catch (error) {
    console.error('Error fetching about:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch about' }), { status: 500 });
  }
}

// POST - create or update the about content (upsert: only 1 record ever)
export async function POST(req) {
  try {
    const { description, img } = await req.json();

    // Check if a record already exists
    const existing = await prisma.about.findFirst();

    let about;
    if (existing) {
      // Update the existing record
      about = await prisma.about.update({
        where: { id: existing.id },
        data: { description, img: img || [] },
      });
    } else {
      // Create a new record
      about = await prisma.about.create({
        data: { description, img: img || [] },
      });
    }

    return new Response(JSON.stringify({ message: 'About saved successfully', about }), {
      status: 201,
    });
  } catch (error) {
    console.error('Error saving about:', error);
    return new Response(JSON.stringify({ error: 'Failed to save about' }), { status: 500 });
  }
}
