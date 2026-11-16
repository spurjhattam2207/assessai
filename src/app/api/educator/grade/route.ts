import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { currentUser, jsonError, unauthorized } from "@/lib/http";

export async function POST(request: Request) {
  try {
    const user = await currentUser();
    if (!user) return unauthorized();
    if (user.role !== "EDUCATOR") {
      return NextResponse.json({ error: "Educators only." }, { status: 403 });
    }
    const body = (await request.json()) as {
      responseId: string;
      marksAwarded: number;
      feedback?: string;
    };
    const response = await prisma.questionResponse.findUnique({
      where: { id: body.responseId },
      include: { attempt: { include: { assessment: true } } },
    });
    if (!response || response.attempt.assessment.creatorId !== user.id) {
      return NextResponse.json({ error: "You can only grade your own assessments." }, { status: 403 });
    }
    await prisma.manualGrade.upsert({
      where: { responseId: body.responseId },
      update: { marksAwarded: body.marksAwarded, feedback: body.feedback ?? "", educatorId: user.id },
      create: {
        responseId: body.responseId,
        educatorId: user.id,
        marksAwarded: body.marksAwarded,
        feedback: body.feedback ?? "",
      },
    });
    await prisma.questionResponse.update({
      where: { id: body.responseId },
      data: { awaitingReview: false, isCorrect: body.marksAwarded > 0, marksAwarded: body.marksAwarded },
    });
    const responses = await prisma.questionResponse.findMany({
      where: { attemptId: response.attemptId },
    });
    const score = responses.reduce((sum, row) => sum + row.marksAwarded, 0);
    const max = (response.attempt.snapshot as Array<{ marks: number }>).reduce((s, q) => s + q.marks, 0);
    await prisma.assessmentAttempt.update({
      where: { id: response.attemptId },
      data: {
        score,
        percentage: max ? (score / max) * 100 : 0,
        awaitingReviewCount: responses.filter((r) => r.awaitingReview).length,
      },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
