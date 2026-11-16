import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireStudentAttempt } from "@/lib/access";
import { currentUser, jsonError, unauthorized } from "@/lib/http";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await currentUser();
    if (!user) return unauthorized();
    const { id } = await params;
    const attempt = await requireStudentAttempt(user.id, user.role, id);
    if (attempt.status !== "IN_PROGRESS") {
      return NextResponse.json({ error: "This attempt is already submitted." }, { status: 409 });
    }
    const body = (await request.json()) as {
      questionId: string;
      response?: object | null;
      markedForReview?: boolean;
      timeSpentSeconds?: number;
    };
    const updated = await prisma.questionResponse.update({
      where: { attemptId_questionId: { attemptId: id, questionId: body.questionId } },
      data: {
        response: body.response ?? undefined,
        markedForReview: body.markedForReview,
        timeSpentSeconds: body.timeSpentSeconds ?? undefined,
      },
    });
    return NextResponse.json({ response: updated });
  } catch (error) {
    return jsonError(error);
  }
}
