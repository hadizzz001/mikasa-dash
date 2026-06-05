import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - fetch the privacy content (returns the first/only record)
export async function GET(req) {
  try {
    const privacy = await prisma.privacy.findFirst();
    return new Response(JSON.stringify(privacy), { status: 200 });
  } catch (error) {
    console.error('Error fetching privacy:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch privacy' }), { status: 500 });
  }
}

// POST - create or update the privacy content (upsert: only 1 record ever)
export async function POST(req) {
  try {
    const { description } = await req.json();

    // Check if a record already exists
    const existing = await prisma.privacy.findFirst();

    let privacy;
    if (existing) {
      // Update the existing record
      privacy = await prisma.privacy.update({
        where: { id: existing.id },
        data: { description },
      });
    } else {
      // Create a new record
      privacy = await prisma.privacy.create({
        data: { description },
      });
    }

    return new Response(JSON.stringify({ message: 'Privacy saved successfully', privacy }), {
      status: 201,
    });
  } catch (error) {
    console.error('Error saving privacy:', error);
    return new Response(JSON.stringify({ error: 'Failed to save privacy' }), { status: 500 });
  }
}
