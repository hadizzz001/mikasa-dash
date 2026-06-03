import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req) {
  try {
    const sections = await prisma.section.findMany({ orderBy: { order: 'asc' } });
    return new Response(JSON.stringify(sections), { status: 200 });
  } catch (error) {
    console.error('Error fetching sections:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch sections' }), { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { key, order, img, title, description, value, url } = await req.json();

    const section = await prisma.section.create({
      data: { key, order, img, title, description, value, url },
    });
    return new Response(JSON.stringify({ message: 'Section created successfully', section }), {
      status: 201,
    });
  } catch (error) {
    console.error('Error creating section:', error);
    return new Response(JSON.stringify({ error: 'Failed to create section' }), { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) return new Response(JSON.stringify({ error: 'ID is required' }), { status: 400 });

    const { img, title, description, value, url: linkUrl } = await req.json();

    const updatedSection = await prisma.section.update({
      where: { id },
      data: { img, title, description, value, url: linkUrl },
    });
    return new Response(JSON.stringify({ message: 'Section updated successfully', updatedSection }), {
      status: 200,
    });
  } catch (error) {
    console.error('Error updating section:', error);
    return new Response(JSON.stringify({ error: 'Failed to update section' }), { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) return new Response(JSON.stringify({ error: 'ID is required' }), { status: 400 });

    const deletedSection = await prisma.section.delete({ where: { id } });
    return new Response(JSON.stringify({ message: 'Section deleted successfully', deletedSection }), {
      status: 200,
    });
  } catch (error) {
    console.error('Error deleting section:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete section' }), { status: 500 });
  }
}
