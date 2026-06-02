import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req) {
  try {
    const categories = await prisma.offer.findMany();
    return new Response(JSON.stringify(categories), { status: 200 });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch categories' }), { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { code, per } = await req.json(); 
    
    const category = await prisma.offer.create({ data: { code, per } });
    return new Response(JSON.stringify({ message: 'Category created successfully', category }), {
      status: 201,
    });
  } catch (error) {
    console.error('Error creating category:', error);
    return new Response(JSON.stringify({ error: 'Failed to create category' }), { status: 500 });
  }
}

export async function PATCH(req) {

  try {
    
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) return new Response(JSON.stringify({ error: 'ID is required' }), { status: 400 });
 
    const { code, per } = await req.json(); 


    const updatedCategory = await prisma.offer.update({
      where: { id },
      data: { code, per },
    });
    return new Response(JSON.stringify({ message: 'Category updated successfully', updatedCategory }), {
      status: 200,
    });
  } catch (error) {
    console.error('Error updating category:', error);
    return new Response(JSON.stringify({ error: 'Failed to update category' }), { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) return new Response(JSON.stringify({ error: 'ID is required' }), { status: 400 });

    const deletedCategory = await prisma.offer.delete({ where: { id } });
    return new Response(JSON.stringify({ message: 'Category deleted successfully', deletedCategory }), {
      status: 200,
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete category' }), { status: 500 });
  }
}
