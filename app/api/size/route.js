import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req) {
  try {
    const sizes = await prisma.size.findMany({ orderBy: { sort: 'asc' } });
    return new Response(JSON.stringify(sizes), { status: 200 });
  } catch (error) {
    console.error('Error fetching sizes:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch sizes' }), { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { name, sort } = await req.json();

    const size = await prisma.size.create({ data: { name, sort } });
    return new Response(JSON.stringify({ message: 'Size created successfully', size }), {
      status: 201,
    });
  } catch (error) {
    console.error('Error creating size:', error);
    return new Response(JSON.stringify({ error: 'Failed to create size' }), { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) return new Response(JSON.stringify({ error: 'ID is required' }), { status: 400 });

    const { name, sort } = await req.json();

    const updatedSize = await prisma.size.update({
      where: { id },
      data: { name, sort },
    });
    return new Response(JSON.stringify({ message: 'Size updated successfully', updatedSize }), {
      status: 200,
    });
  } catch (error) {
    console.error('Error updating size:', error);
    return new Response(JSON.stringify({ error: 'Failed to update size' }), { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) return new Response(JSON.stringify({ error: 'ID is required' }), { status: 400 });

    const deletedSize = await prisma.size.delete({ where: { id } });
    return new Response(JSON.stringify({ message: 'Size deleted successfully', deletedSize }), {
      status: 200,
    });
  } catch (error) {
    console.error('Error deleting size:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete size' }), { status: 500 });
  }
}
