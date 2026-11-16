import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireEducatorAssessment } from "@/lib/access";
import { currentUser, jsonError, unauthorized } from "@/lib/http";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await currentUser();
    if (!user) return unauthorized();
    const { id } = await params;
    const assessment = await requireEducatorAssessment(user.id, user.role, id);
    const body = (await request.json().catch(() => ({}))) as { status?: "PUBLISHED" | "CLOSED" | "DRAFT" };
    const status = body.status ?? "PUBLISHED";
    if (status === "PUBLISHED" && assessment.questions.length === 0) {
      return NextResponse.json({ error: "Add at least one question before publishing." }, { status: 400 });
    }
    const updated = await prisma.assessment.update({
      where: { id },
      data: {
        status,
        publishedAt: status === "PUBLISHED" ? new Date() : assessment.publishedAt,
      },
    });
    return NextResponse.json({ assessment: updated });
  } catch (error) {
    return jsonError(error);
  }
}
