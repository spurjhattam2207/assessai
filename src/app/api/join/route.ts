import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { currentUser, jsonError, unauthorized } from "@/lib/http";
import { snapshotQuestions } from "@/server/snapshot";

export async function POST(request: Request) {
  try {
    const user = await currentUser();
    if (!user) return unauthorized();
    if (user.role !== "STUDENT") {
      return NextResponse.json({ error: "Only students can join assessments." }, { status: 403 });
    }
    const { code, assessmentId } = (await request.json()) as { code?: string; assessmentId?: string };
    const assessment = await prisma.assessment.findFirst({
      where: {
        status: "PUBLISHED",
        ...(assessmentId
          ? { id: assessmentId }
          : { accessCode: (code || "").trim().toUpperCase() }),
      },
      include: { questions: { orderBy: { position: "asc" } } },
    });
    if (!assessment) {
      return NextResponse.json({ error: "No published assessment matches that code." }, { status: 404 });
    }
    const existing = await prisma.assessmentAttempt.findUnique({
      where: { assessmentId_studentId: { assessmentId: assessment.id, studentId: user.id } },
    });
    if (existing) {
      return NextResponse.json({ attempt: existing, assessmentId: assessment.id });
    }
    const attempt = await prisma.assessmentAttempt.create({
      data: {
        assessmentId: assessment.id,
        studentId: user.id,
        snapshot: snapshotQuestions(assessment.questions),
        responses: {
          create: assessment.questions.map((q) => ({
            questionId: q.id,
            timeSpentSeconds: 0,
          })),
        },
      },
    });
    return NextResponse.json({ attempt, assessmentId: assessment.id });
  } catch (error) {
    return jsonError(error);
  }
}
