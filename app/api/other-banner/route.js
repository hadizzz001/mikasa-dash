import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req) {
  try {
    const banners = await prisma.otherBanner.findMany();
    return new Response(JSON.stringify(banners), { status: 200 });
  } catch (error) {
    console.error('Error fetching other banners:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch other banners' }), { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { key, img, percentage } = await req.json();

    const banner = await prisma.otherBanner.create({ data: { key, img, percentage } });
    return new Response(JSON.stringify({ message: 'Banner created successfully', banner }), {
      status: 201,
    });
  } catch (error) {
    console.error('Error creating other banner:', error);
    return new Response(JSON.stringify({ error: 'Failed to create other banner' }), { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) return new Response(JSON.stringify({ error: 'ID is required' }), { status: 400 });

    const { img, percentage } = await req.json();

    const updatedBanner = await prisma.otherBanner.update({
      where: { id },
      data: { img, percentage },
    });
    return new Response(JSON.stringify({ message: 'Banner updated successfully', updatedBanner }), {
      status: 200,
    });
  } catch (error) {
    console.error('Error updating other banner:', error);
    return new Response(JSON.stringify({ error: 'Failed to update other banner' }), { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) return new Response(JSON.stringify({ error: 'ID is required' }), { status: 400 });

    const deletedBanner = await prisma.otherBanner.delete({ where: { id } });
    return new Response(JSON.stringify({ message: 'Banner deleted successfully', deletedBanner }), {
      status: 200,
    });
  } catch (error) {
    console.error('Error deleting other banner:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete other banner' }), { status: 500 });
  }
}
