import Link from "next/link";
import { AppHeader } from "@/components/site-chrome";
import { Badge, Card } from "@/components/ui";
import { prisma } from "@/lib/db";
import { requireStudent } from "@/lib/session";
import { formatPercent } from "@/lib/utils";
import { PerformanceFilters } from "@/components/performance-filters";

export default async function PerformancePage({
  searchParams,
}: {
  searchParams: Promise<{ audience?: string; subject?: string; topic?: string }>;
}) {
  const user = await requireStudent();
  const filters = await searchParams;
  const attempts = await prisma.assessmentAttempt.findMany({
    where: {
      studentId: user.id,
      status: { in: ["SUBMITTED", "TIMED_OUT"] },
      assessment: {
        audience: filters.audience ? (filters.audience as "JEE" | "UPSC" | "COLLEGE") : undefined,
        subject: filters.subject ? { contains: filters.subject, mode: "insensitive" } : undefined,
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
    title: string;
    kind: string;
    note?: string;
  }> = [];
  for (const attempt of attempts) {
    for (const response of attempt.responses) {
      if (filters.topic && response.question.topic !== filters.topic) continue;
      const bucket = topicStats.get(response.question.topic) || { correct: 0, total: 0 };
      if (!response.awaitingReview) {
        bucket.total += 1;
        if (response.isCorrect) bucket.correct += 1;
        topicStats.set(response.question.topic, bucket);
      }
      if (response.isCorrect === false || (response.isCorrect == null && !response.awaitingReview)) {
        mistakes.push({
          attemptId: attempt.id,
          questionId: response.questionId,
          prompt: response.question.prompt,
          topic: response.question.topic,
          title: attempt.assessment.title,
          kind: response.isCorrect === false ? "incorrect" : "unanswered",
          note: attempt.notes.find((n) => n.questionId === response.questionId)?.noteText,
        });
      }
    }
  }
  const avg = attempts.length
    ? attempts.reduce((s, a) => s + (a.percentage || 0), 0) / attempts.length
    : null;

  return (
    <div>
      <AppHeader />
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="serif text-3xl">My Performance</h1>
        <p className="mt-1 text-sm text-muted">
          Percentages describe this log only. Small samples should not be read as statistical claims.
        </p>
        <PerformanceFilters />
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <Card className="p-4">
            <p className="text-sm text-muted">Attempts</p>
            <p className="serif text-3xl">{attempts.length}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted">Overall accuracy</p>
            <p className="serif text-3xl">{formatPercent(avg)}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted">Revision items</p>
            <p className="serif text-3xl">{mistakes.length}</p>
          </Card>
        </div>
        <h2 className="serif mt-10 text-2xl">Topic accuracy</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {[...topicStats.entries()].map(([topic, v]) => (
            <Card key={topic} className="p-4">
              <p>{topic}</p>
              <p className="text-sm text-muted">
                {v.total ? `${Math.round((v.correct / v.total) * 100)}% · ${v.total} items` : "n/a"}
              </p>
            </Card>
          ))}
        </div>
        <h2 className="serif mt-10 text-2xl">Attempt history</h2>
        <div className="mt-4 overflow-x-auto rounded-lg border border-line bg-card">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-line text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Assessment</th>
                <th className="px-4 py-3 font-medium">Track</th>
                <th className="px-4 py-3 font-medium">Score</th>
                <th className="px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {attempts.map((a) => (
                <tr key={a.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3">
                    <Link href={`/student/attempts/${a.id}/review`} className="text-accent">
                      {a.assessment.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{a.assessment.audience}</td>
                  <td className="px-4 py-3">{formatPercent(a.percentage)}</td>
                  <td className="px-4 py-3">{a.submittedAt?.toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <h2 className="serif mt-10 text-2xl">Mistake / revision list</h2>
        <div className="mt-4 space-y-3">
          {mistakes.map((item) => (
            <Card key={`${item.attemptId}-${item.questionId}`} className="p-4">
              <div className="flex items-center gap-2">
                <Badge tone={item.kind === "incorrect" ? "bad" : "warn"}>{item.kind}</Badge>
                <span className="text-xs text-muted">{item.topic}</span>
              </div>
              <p className="mt-2 text-sm">{item.prompt}</p>
              {item.note ? <p className="mt-1 text-sm text-muted">Note: {item.note}</p> : null}
              <Link
                className="mt-2 inline-block text-sm text-accent"
                href={`/student/attempts/${item.attemptId}/review#q-${item.questionId}`}
              >
                Open review
              </Link>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
