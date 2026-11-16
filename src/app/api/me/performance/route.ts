import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { currentUser, unauthorized } from "@/lib/http";

export async function GET(request: Request) {
  const user = await currentUser();
  if (!user) return unauthorized();
  if (user.role !== "STUDENT") {
    return NextResponse.json({ error: "Students only." }, { status: 403 });
  }
  const { searchParams } = new URL(request.url);
  const audience = searchParams.get("audience") || undefined;
  const subject = searchParams.get("subject") || undefined;
  const topic = searchParams.get("topic") || undefined;
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const attempts = await prisma.assessmentAttempt.findMany({
    where: {
      studentId: user.id,
      status: { in: ["SUBMITTED", "TIMED_OUT"] },
      submittedAt: {
        gte: from ? new Date(from) : undefined,
        lte: to ? new Date(to) : undefined,
      },
      assessment: {
        audience: audience as "JEE" | "UPSC" | "COLLEGE" | undefined,
        subject: subject ? { contains: subject, mode: "insensitive" } : undefined,
      },
    },
    include: {
      assessment: true,
      responses: { include: { question: true } },
      notes: true,
    },
    orderBy: { submittedAt: "desc" },
  });

  const topicStats = new Map<string, { correct: number; total: number }>();
  const mistakes: Array<{
    attemptId: string;
    questionId: string;
    prompt: string;
    topic: string;
    assessmentTitle: string;
    kind: "incorrect" | "unanswered";
  }> = [];

  for (const attempt of attempts) {
    for (const response of attempt.responses) {
      const t = response.question.topic;
      if (topic && t !== topic) continue;
      const bucket = topicStats.get(t) || { correct: 0, total: 0 };
      if (!response.awaitingReview) {
        bucket.total += 1;
        if (response.isCorrect) bucket.correct += 1;
      }
      topicStats.set(t, bucket);
      if (response.isCorrect === false || (response.isCorrect == null && !response.awaitingReview)) {
        mistakes.push({
          attemptId: attempt.id,
          questionId: response.questionId,
          prompt: response.question.prompt,
          topic: t,
          assessmentTitle: attempt.assessment.title,
          kind: response.isCorrect === false ? "incorrect" : "unanswered",
        });
      }
    }
  }

  const scored = attempts.filter((a) => a.percentage != null);
  const overallAccuracy =
    scored.length === 0 ? 0 : scored.reduce((sum, a) => sum + (a.percentage || 0), 0) / scored.length;

  return NextResponse.json({
    attempts,
    overallAccuracy,
    topicAccuracy: [...topicStats.entries()].map(([name, value]) => ({
      topic: name,
      accuracy: value.total ? (value.correct / value.total) * 100 : 0,
      sampleSize: value.total,
    })),
    mistakes,
  });
}
