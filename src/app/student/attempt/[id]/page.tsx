import { redirect } from "next/navigation";
import { TestRunner } from "@/components/test-runner";
import { requireStudentAttempt } from "@/lib/access";
import { requireStudent } from "@/lib/session";
import { stripKeys } from "@/server/snapshot";
import type { Question } from "@prisma/client";

export default async function AttemptPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireStudent();
  const { id } = await params;
  const attempt = await requireStudentAttempt(user.id, user.role, id);
  if (attempt.status !== "IN_PROGRESS") {
    redirect(`/student/attempts/${id}/review`);
  }
  const snapshot = attempt.snapshot as Array<
    Question & { options: { id: string; text: string }[]; correctAnswer?: unknown; explanation?: string }
  >;
  const questions = stripKeys(snapshot).map((q) => ({
    id: q.id,
    position: q.position,
    type: q.type,
    prompt: q.prompt,
    options: Array.isArray(q.options) ? q.options : [],
    marks: q.marks,
  }));
  const initial: Record<
    string,
    { response: { optionIds?: string[]; value?: number | string; text?: string } | null; markedForReview: boolean; timeSpentSeconds: number }
  > = {};
  for (const row of attempt.responses) {
    initial[row.questionId] = {
      response: row.response as never,
      markedForReview: row.markedForReview,
      timeSpentSeconds: row.timeSpentSeconds,
    };
  }

  return (
    <div className="min-h-screen bg-paper">
      <div className="border-b border-line bg-card px-4 py-3 text-center text-sm">
        {attempt.assessment.title}
      </div>
      <TestRunner
        attemptId={attempt.id}
        durationMinutes={attempt.assessment.durationMinutes}
        startedAt={attempt.startedAt.toISOString()}
        questions={questions}
        initialResponses={initial}
      />
    </div>
  );
}
