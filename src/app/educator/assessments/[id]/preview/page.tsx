import Link from "next/link";
import { AppHeader } from "@/components/site-chrome";
import { Badge, Button, Card } from "@/components/ui";
import { requireEducatorAssessment } from "@/lib/access";
import { requireEducator } from "@/lib/session";
import { scoringFormula } from "@/lib/utils";

export default async function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireEducator();
  const { id } = await params;
  const assessment = await requireEducatorAssessment(user.id, user.role, id);
  return (
    <div>
      <AppHeader />
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <Badge tone="warn">Student preview</Badge>
          <Link href={`/educator/assessments/${id}`}>
            <Button variant="secondary" size="sm">
              Back
            </Button>
          </Link>
        </div>
        <h1 className="serif text-3xl">{assessment.title}</h1>
        <p className="mt-2 text-muted">
          {assessment.questions.length} questions · {assessment.durationMinutes} minutes · {assessment.totalMarks}{" "}
          marks
        </p>
        <Card className="mt-6 p-5 text-sm text-muted">
          <p>{assessment.instructions}</p>
          <p className="mt-3">{scoringFormula(assessment.negativeMarking)}</p>
        </Card>
        <ol className="mt-6 space-y-4">
          {assessment.questions.map((q) => (
            <li key={q.id} className="rounded-lg border border-line bg-card p-4">
              <p className="text-xs text-muted">
                Q{q.position} · {q.type.replaceAll("_", " ")} · {q.marks} marks
              </p>
              <p className="mt-2">{q.prompt}</p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
