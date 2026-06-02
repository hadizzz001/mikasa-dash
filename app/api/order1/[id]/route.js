import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PATCH(request, { params }) {
    const { id } = params;
    const { num } = await request.json();
  
    try {
      const order = await prisma.order.update({
        where: { id },
        data: {
          num: num, // Update the num field
        },
      });
  
      return new Response(JSON.stringify(order), { status: 200 });
    } catch (error) {
      console.error("Error updating order:", error);
      return new Response(JSON.stringify({ error: 'Failed to update order' }), { status: 500 });
    }
  }