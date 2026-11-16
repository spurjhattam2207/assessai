import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { canEditQuestions, requireEducatorAssessment } from "@/lib/access";
import { currentUser, jsonError, unauthorized } from "@/lib/http";
import { assessmentSchema, questionSchema } from "@/lib/validations";
import { stripKeys } from "@/server/snapshot";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await currentUser();
    if (!user) return unauthorized();
    const { id } = await params;
    const assessment = await prisma.assessment.findUnique({
      where: { id },
      include: { questions: { orderBy: { position: "asc" } }, _count: { select: { attempts: true } } },
    });
    if (!assessment) return NextResponse.json({ error: "Not found." }, { status: 404 });
    if (user.role === "EDUCATOR" && assessment.creatorId === user.id) {
      return NextResponse.json({ assessment });
    }
    if (assessment.status !== "PUBLISHED") {
      return NextResponse.json({ error: "Assessment is not available." }, { status: 403 });
    }
    return NextResponse.json({
      assessment: {
        ...assessment,
        questions: stripKeys(assessment.questions),
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await currentUser();
    if (!user) return unauthorized();
    const { id } = await params;
    const existing = await requireEducatorAssessment(user.id, user.role, id);
    const payload = await request.json();
    const meta = payload.meta ? assessmentSchema.partial().parse(payload.meta) : null;
    const questions = payload.questions
      ? payload.questions.map((q: unknown) => questionSchema.parse(q))
      : null;
    const attemptCount = await prisma.assessmentAttempt.count({ where: { assessmentId: id } });
    if (questions && !canEditQuestions(existing.status, attemptCount)) {
      return NextResponse.json(
        { error: "Questions are locked because students have already started this assessment." },
        { status: 409 },
      );
    }
    const updated = await prisma.$transaction(async (tx) => {
      if (meta) {
        await tx.assessment.update({ where: { id }, data: meta });
      }
      if (questions) {
        await tx.question.deleteMany({ where: { assessmentId: id } });
        if (questions.length) {
          await tx.question.createMany({
            data: questions.map((q: ReturnType<typeof questionSchema.parse>, index: number) => ({
              assessmentId: id,
              position: index + 1,
              type: q.type,
              prompt: q.prompt,
              options: q.options,
              correctAnswer: q.correctAnswer,
              explanation: q.explanation ?? "",
              topic: q.topic,
              difficulty: q.difficulty,
              marks: q.marks,
              negativeMarks: q.negativeMarks,
              tolerance: q.tolerance ?? null,
              flagForReview: q.flagForReview ?? false,
              generated: q.generated ?? false,
              sourceRef: q.sourceRef ?? null,
            })),
          });
        }
        const totalMarks = questions.reduce((sum: number, q: { marks: number }) => sum + q.marks, 0);
        await tx.assessment.update({
          where: { id },
          data: { totalMarks, version: { increment: 1 } },
        });
      }
      return tx.assessment.findUnique({
        where: { id },
        include: { questions: { orderBy: { position: "asc" } } },
      });
    });
    return NextResponse.json({ assessment: updated });
  } catch (error) {
    return jsonError(error);
  }
}
