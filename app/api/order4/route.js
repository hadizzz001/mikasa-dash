import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PATCH(request, { params }) {
  const bodyText = await request.text();  
  const [id, index] = bodyText.split(',');
 

  try {
    // Fetch the existing order
    const existingOrder = await prisma.order.findUnique({
      where: { id },
    });

    if (!existingOrder) {
      return new Response(JSON.stringify({ error: "Order not found" }), { status: 404 });
    }

    // Ensure userinfo is an array
    const userInfo = existingOrder.userInfo || [];

    // Check if the index is valid
    if (index < 0 || index >= userInfo.length) {
      return new Response(JSON.stringify({ error: "Invalid index" }), { status: 400 });
    }

    // Remove the item at the specified index
    userInfo.splice(index, 1);

    // Update the order with the new userinfo array
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        userInfo,
      },
    });

    return new Response(JSON.stringify(updatedOrder), { status: 200 });
  } catch (error) {
    console.error("Error updating order:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  }
}
