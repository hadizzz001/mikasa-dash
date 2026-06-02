import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req) {
  try {
    const colors = await prisma.color.findMany({ orderBy: { sort: 'asc' } });
    return new Response(JSON.stringify(colors), { status: 200 });
  } catch (error) {
    console.error('Error fetching colors:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch colors' }), { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { name, code, img, sort } = await req.json();

    const color = await prisma.color.create({ data: { name, code, img: img || [], sort } });
    return new Response(JSON.stringify({ message: 'Color created successfully', color }), {
      status: 201,
    });
  } catch (error) {
    console.error('Error creating color:', error);
    return new Response(JSON.stringify({ error: 'Failed to create color' }), { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) return new Response(JSON.stringify({ error: 'ID is required' }), { status: 400 });

    const { name, code, img, sort } = await req.json();

    const updatedColor = await prisma.color.update({
      where: { id },
      data: { name, code, img, sort },
    });
    return new Response(JSON.stringify({ message: 'Color updated successfully', updatedColor }), {
      status: 200,
    });
  } catch (error) {
    console.error('Error updating color:', error);
    return new Response(JSON.stringify({ error: 'Failed to update color' }), { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) return new Response(JSON.stringify({ error: 'ID is required' }), { status: 400 });

    const deletedColor = await prisma.color.delete({ where: { id } });
    return new Response(JSON.stringify({ message: 'Color deleted successfully', deletedColor }), {
      status: 200,
    });
  } catch (error) {
    console.error('Error deleting color:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete color' }), { status: 500 });
  }
}
