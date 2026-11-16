import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { canAccessPrivateNote } from "@/lib/access";
import { currentUser, jsonError, unauthorized } from "@/lib/http";

export async function PUT(request: Request) {
  try {
    const user = await currentUser();
    if (!user) return unauthorized();
    const body = (await request.json()) as {
      attemptId: string;
      questionId: string;
      noteText: string;
    };
    const attempt = await prisma.assessmentAttempt.findUnique({ where: { id: body.attemptId } });
    if (!attempt || !canAccessPrivateNote(attempt.studentId, user.id, user.role)) {
      return NextResponse.json({ error: "You can only annotate your own attempts." }, { status: 403 });
    }
    if (attempt.status === "IN_PROGRESS") {
      return NextResponse.json({ error: "Notes are available after submission." }, { status: 400 });
    }
    if (!body.noteText.trim()) {
      await prisma.questionNote.deleteMany({
        where: { studentId: user.id, attemptId: body.attemptId, questionId: body.questionId },
      });
      return NextResponse.json({ deleted: true });
    }
    const note = await prisma.questionNote.upsert({
      where: {
        studentId_attemptId_questionId: {
          studentId: user.id,
          attemptId: body.attemptId,
          questionId: body.questionId,
        },
      },
      update: { noteText: body.noteText },
      create: {
        studentId: user.id,
        attemptId: body.attemptId,
        questionId: body.questionId,
        noteText: body.noteText,
      },
    });
    return NextResponse.json({ note });
  } catch (error) {
    return jsonError(error);
  }
}
