import { NextResponse } from "next/server";
import { AttemptStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireStudentAttempt } from "@/lib/access";
import { gradeAttempt, type GradableQuestion, type StudentAnswer } from "@/lib/grading";
import { currentUser, jsonError, unauthorized } from "@/lib/http";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await currentUser();
    if (!user) return unauthorized();
    const { id } = await params;
    const attempt = await requireStudentAttempt(user.id, user.role, id);
    if (attempt.status !== "IN_PROGRESS") {
      return NextResponse.json({ attempt }, { status: 200 });
    }
    const body = (await request.json().catch(() => ({}))) as { reason?: "manual" | "timeout" };
    const snapshot = attempt.snapshot as GradableQuestion[];
    const latest = await prisma.questionResponse.findMany({ where: { attemptId: id } });
    const map: Record<string, StudentAnswer> = {};
    for (const row of latest) {
      map[row.questionId] = row.response as StudentAnswer;
    }
    const graded = gradeAttempt(snapshot, map);
    const submitted = await prisma.$transaction(async (tx) => {
      const current = await tx.assessmentAttempt.findUnique({ where: { id } });
      if (!current || current.status !== "IN_PROGRESS") return current;
      for (const question of snapshot) {
        const result = graded.perQuestion[question.id];
        await tx.questionResponse.update({
          where: { attemptId_questionId: { attemptId: id, questionId: question.id } },
          data: {
            isCorrect: result.isCorrect,
            awaitingReview: result.awaitingReview,
            marksAwarded: result.marksAwarded,
          },
        });
      }
      return tx.assessmentAttempt.update({
        where: { id },
        data: {
          status: body.reason === "timeout" ? AttemptStatus.TIMED_OUT : AttemptStatus.SUBMITTED,
          submittedAt: new Date(),
          score: graded.score,
          percentage: graded.percentage,
          correctCount: graded.correctCount,
          incorrectCount: graded.incorrectCount,
          unansweredCount: graded.unansweredCount,
          awaitingReviewCount: graded.awaitingReviewCount,
          totalTimeSeconds: Math.max(
            1,
            Math.round((Date.now() - current.startedAt.getTime()) / 1000),
          ),
        },
      });
    });
    return NextResponse.json({ attempt: submitted });
  } catch (error) {
    return jsonError(error);
  }
}
