import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

export const DELETE = async () => {
  try {
    await prisma.$connect();  // ✅ DIRECT CONNECT HERE

    const result = await prisma.banner1.deleteMany(); 

    return NextResponse.json({
      message: "All orders deleted successfully",
      deletedCount: result.count,
    });
  } catch (err) {
    console.error("Delete Error:", err); // ✅ Log the real issue
    return NextResponse.json({ message: "Error deleting orders", err }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
};


