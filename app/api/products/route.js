import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      title,
      description,
      price,
      discount,
      img,
      category,
      stock,
      stockEnabled,
      arrival,
      type,
      sub,
      factory,
      views,
      orders,
      code,
      sale,
      noprice,
      percentage,
      tax,
      color,
      specs,
    } = body;

    const normalizedStock =
      type === 'collection' ? null : (stockEnabled === false ? null : stock ?? null);

    console.log("body are: ", body);

    const product = await prisma.product.create({
      data: {
        title,
        description,
        price,
        discount,
        img,
        category,
        stock: normalizedStock,
        stockEnabled: stockEnabled ?? stock != null,
        arrival,
        type,
        sub,
        factory,
        views,
        orders,
        code,
        sale,
        noprice,
        percentage,
        tax,
        color,
        specs,
      },
    });



    return new Response(JSON.stringify({ message: 'Product created successfully', product }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating product:', error);
    return new Response(JSON.stringify({ error: 'Failed to create product' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function GET(req) {
  try {
    const products = await prisma.product.findMany({
      orderBy: { id: 'desc' }
    });

    return new Response(JSON.stringify(products), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch products' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}







export async function DELETE(request, { params }) {

  try {

    await prisma.product.deleteMany({
    });

    return new Response(
      JSON.stringify({ message: 'Product deleted successfully' }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting product:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to delete product' }),
      { status: 500 }
    );
  }
}







export async function PATCH(req) {
  try {
    const updated = await prisma.product.updateMany({
      data: {
        views: "40",
        orders: "40",
      },
    });

    return new Response(
      JSON.stringify({
        message: 'All products updated successfully',
        count: updated.count,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error updating products:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to update products' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
