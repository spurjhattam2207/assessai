import Link from "next/link";
import { AppHeader } from "@/components/site-chrome";
import { Badge, Card } from "@/components/ui";
import { PrivateNote } from "@/components/private-note";
import { requireStudentAttempt } from "@/lib/access";
import { prisma } from "@/lib/db";
import { requireStudent } from "@/lib/session";
import { formatDuration, formatPercent, scoringFormula } from "@/lib/utils";

export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireStudent();
  const { id } = await params;
  const attempt = await requireStudentAttempt(user.id, user.role, id);
  if (attempt.status === "IN_PROGRESS") {
    return <p className="p-8">Submit the assessment before reviewing answers.</p>;
  }
  const notes = await prisma.questionNote.findMany({
    where: { attemptId: id, studentId: user.id },
  });
  const noteMap = Object.fromEntries(notes.map((n) => [n.questionId, n.noteText]));
  const snapshot = attempt.snapshot as Array<{
    id: string;
    position: number;
    prompt: string;
    type: string;
    options: { id: string; text: string }[];
    correctAnswer: { optionIds?: string[]; value?: number; text?: string };
    explanation: string;
    topic: string;
    marks: number;
  }>;
  const responseMap = Object.fromEntries(attempt.responses.map((r) => [r.questionId, r]));
  const topicBuckets = new Map<string, { correct: number; total: number }>();
  for (const q of snapshot) {
    const r = responseMap[q.id];
    const bucket = topicBuckets.get(q.topic) || { correct: 0, total: 0 };
    if (r && !r.awaitingReview) {
      bucket.total += 1;
      if (r.isCorrect) bucket.correct += 1;
    }
    topicBuckets.set(q.topic, bucket);
  }

  return (
    <div>
      <AppHeader />
      <div className="mx-auto max-w-3xl px-4 py-8">
        <Link href="/student/performance" className="text-sm text-accent">
          My Performance
        </Link>
        <h1 className="serif mt-2 text-3xl">{attempt.assessment.title}</h1>
        <p className="text-muted">
          Score {attempt.score} ({formatPercent(attempt.percentage)}) · {attempt.correctCount} correct ·{" "}
          {attempt.incorrectCount} incorrect · {attempt.unansweredCount} unanswered · {formatDuration(attempt.totalTimeSeconds)}
        </p>
        <p className="mt-2 text-sm text-muted">{scoringFormula(attempt.assessment.negativeMarking)}</p>
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {[...topicBuckets.entries()].map(([topic, v]) => (
            <Card key={topic} className="p-4">
              <p className="text-sm">{topic}</p>
              <p className="text-muted text-sm">
                {v.total ? `${Math.round((v.correct / v.total) * 100)}% of ${v.total} auto-graded items` : "Awaiting review"}
              </p>
            </Card>
          ))}
        </div>
        <div className="mt-8 space-y-4">
          {snapshot.map((q) => {
            const r = responseMap[q.id];
            const tone = r?.awaitingReview ? "warn" : r?.isCorrect ? "ok" : r?.isCorrect === false ? "bad" : "neutral";
            const selected = formatAnswer(q, r?.response);
            const correct = formatCorrect(q);
            return (
              <Card key={q.id} id={`q-${q.id}`} className="p-5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-muted">
                    Q{q.position} · {q.topic}
                  </p>
                  <Badge tone={tone}>
                    {r?.awaitingReview ? "Awaiting educator review" : r?.isCorrect ? "Correct" : r?.isCorrect === false ? "Incorrect" : "Unanswered"}
                  </Badge>
                </div>
                <p className="mt-2">{q.prompt}</p>
                <p className="mt-3 text-sm">Your answer: {selected}</p>
                <p className="text-sm">Correct answer: {correct}</p>
                <p className="mt-2 text-sm text-muted">{q.explanation}</p>
                <p className="mt-1 text-xs text-muted">Time on item: {r?.timeSpentSeconds ?? 0}s</p>
                <PrivateNote attemptId={id} questionId={q.id} initial={noteMap[q.id] || ""} />
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function formatAnswer(q: { type: string; options: { id: string; text: string }[] }, response: unknown) {
  const value = response as { optionIds?: string[]; value?: number | string; text?: string } | null;
  if (!value) return "—";
  if (value.optionIds?.length) {
    return value.optionIds
      .map((id) => `${id}. ${q.options.find((o) => o.id === id)?.text || ""}`)
      .join("; ");
  }
  if (value.value != null) return String(value.value);
  if (value.text) return value.text;
  return "—";
}

function formatCorrect(q: { options: { id: string; text: string }[]; correctAnswer: { optionIds?: string[]; value?: number; text?: string } }) {
  if (q.correctAnswer.optionIds?.length) {
    return q.correctAnswer.optionIds
      .map((id) => `${id}. ${q.options.find((o) => o.id === id)?.text || ""}`)
      .join("; ");
  }
  if (q.correctAnswer.value != null) return String(q.correctAnswer.value);
  return "Marked by educator";
}
