import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function PATCH(req, { params }) {
  const { id } = params;
  const { sort } = await req.json();

  try {
    const updated = await prisma.sub.update({
      where: { id },
      data: { sort: Number(sort) },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update failed:", error);
    return NextResponse.json({ error: "Failed to update sort" }, { status: 500 });
  }
}
