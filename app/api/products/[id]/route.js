import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Update Product API
export async function PATCH(request, { params }) {
  const { id } = params;
  const {
    title,
    description,
    price,
    discount,
    img,
    category, 
    stock,
    stockEnabled,
    arrival ,
    color ,
    type ,
      factory,
      code,
            sale,
      noprice,
      percentage,
      tax,
      collectionMode,
      specs,

  } = await request.json();

  const normalizedStock =
    type === 'collection' ? null : (stockEnabled === false ? null : stock ?? null);

  // category can be many values: always store it as an array of strings
  const categoryArray = Array.isArray(category)
    ? category.filter(Boolean)
    : (category ? [category] : []);

  console.log("imgs are: ", img);
  

  try {
    // Update product and its specifications
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        title,
        description,
        price,
        discount,
        img,
        category: categoryArray, 
        stock: normalizedStock,
        stockEnabled: stockEnabled ?? stock != null,
        arrival ,
        color ,
        type ,
      factory,
      code,
            sale,
      noprice,
      percentage,
      tax,
      collectionMode: type === 'collection' ? (collectionMode || 'sizeColor') : null,
      specs,
      },
    });

    return new Response(JSON.stringify(updatedProduct), { status: 200 });
  } catch (error) {
    console.error('Error updating product:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to update product' }),
      { status: 500 }
    );
  }
}

// Delete Product API
export async function DELETE(request, { params }) {
  const { id } = params;

  try {
 

    // Delete the product
    await prisma.product.delete({
      where: { id },
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

