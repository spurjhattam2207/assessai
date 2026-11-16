import Link from "next/link";
import { AppHeader } from "@/components/site-chrome";
import { Badge, Button, Card } from "@/components/ui";
import { requireEducatorAssessment } from "@/lib/access";
import { prisma } from "@/lib/db";
import { requireEducator } from "@/lib/session";
import { formatDuration, formatPercent, scoringFormula } from "@/lib/utils";
import { GradeShortAnswers } from "@/components/grade-short-answers";

export default async function AssessmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireEducator();
  const { id } = await params;
  const assessment = await requireEducatorAssessment(user.id, user.role, id);
  const attempts = await prisma.assessmentAttempt.findMany({
    where: { assessmentId: id },
    include: {
      student: true,
      responses: { include: { question: true, grade: true } },
    },
    orderBy: { submittedAt: "desc" },
  });
  const submitted = attempts.filter((a) => a.status !== "IN_PROGRESS");
  const avg =
    submitted.length === 0
      ? null
      : submitted.reduce((s, a) => s + (a.percentage || 0), 0) / submitted.length;
  const origin = process.env.AUTH_URL || "";
  const share = `${origin}/join/${assessment.accessCode}`;
  const pending = submitted.flatMap((a) =>
    a.responses
      .filter((r) => r.awaitingReview)
      .map((r) => ({
        responseId: r.id,
        student: a.student.name,
        prompt: r.question.prompt,
        answer: (r.response as { text?: string } | null)?.text || "",
        marks: r.question.marks,
      })),
  );

  return (
    <div>
      <AppHeader />
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Badge>{assessment.status.toLowerCase()}</Badge>
            <h1 className="serif mt-2 text-3xl">{assessment.title}</h1>
            <p className="text-muted">
              {assessment.subject} · {assessment.audience} · join code {assessment.accessCode}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/educator/assessments/${id}/edit`}>
              <Button variant="secondary">Edit</Button>
            </Link>
            <Link href={`/educator/assessments/${id}/preview`}>
              <Button variant="secondary">Preview</Button>
            </Link>
            <a href={`/api/assessments/${id}/results.csv`}>
              <Button variant="secondary">Export CSV</Button>
            </a>
          </div>
        </div>
        <Card className="mt-6 p-5">
          <p className="text-sm text-muted">Share with students</p>
          <p className="mt-1 font-medium break-all">{share || `/join/${assessment.accessCode}`}</p>
          <p className="mt-2 text-sm text-muted">{scoringFormula(assessment.negativeMarking)}</p>
        </Card>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          {[
            ["Participants", attempts.length],
            ["Submitted", submitted.length],
            ["Average", formatPercent(avg)],
            ["Completion", attempts.length ? formatPercent((submitted.length / attempts.length) * 100) : "—"],
          ].map(([label, value]) => (
            <Card key={String(label)} className="p-4">
              <p className="text-sm text-muted">{label}</p>
              <p className="serif mt-1 text-2xl">{value}</p>
            </Card>
          ))}
        </div>
        {pending.length ? <GradeShortAnswers items={pending} /> : null}
        <div className="mt-8 overflow-x-auto rounded-lg border border-line bg-card">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-line text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Student</th>
                <th className="px-4 py-3 font-medium">Score</th>
                <th className="px-4 py-3 font-medium">Percentage</th>
                <th className="px-4 py-3 font-medium">Time</th>
                <th className="px-4 py-3 font-medium">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {attempts.map((a) => (
                <tr key={a.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3">{a.student.name}</td>
                  <td className="px-4 py-3">{a.score ?? "In progress"}</td>
                  <td className="px-4 py-3">{formatPercent(a.percentage)}</td>
                  <td className="px-4 py-3">{formatDuration(a.totalTimeSeconds)}</td>
                  <td className="px-4 py-3">{a.submittedAt ? a.submittedAt.toLocaleString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
