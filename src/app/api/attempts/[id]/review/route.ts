import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireStudentAttempt } from "@/lib/access";
import { currentUser, jsonError, unauthorized } from "@/lib/http";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await currentUser();
    if (!user) return unauthorized();
    const { id } = await params;
    const attempt = await requireStudentAttempt(user.id, user.role, id);
    if (attempt.status === "IN_PROGRESS") {
      return NextResponse.json({ error: "Submit the assessment before reviewing answers." }, { status: 403 });
    }
    const notes = await prisma.questionNote.findMany({
      where: { attemptId: id, studentId: user.id },
    });
    return NextResponse.json({ attempt, notes });
  } catch (error) {
    return jsonError(error);
  }
}
