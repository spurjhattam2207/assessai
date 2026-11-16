import { JoinForm } from "@/components/join-form";
import { AppHeader } from "@/components/site-chrome";
import { Card } from "@/components/ui";
import { prisma } from "@/lib/db";
import { requireStudent } from "@/lib/session";
import { scoringFormula } from "@/lib/utils";

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  await requireStudent();
  const { code } = await searchParams;
  const assessment = code
    ? await prisma.assessment.findFirst({
        where: { accessCode: code.toUpperCase(), status: "PUBLISHED" },
        include: { _count: { select: { questions: true } } },
      })
    : null;

  return (
    <div>
      <AppHeader />
      <div className="mx-auto max-w-xl px-4 py-8">
        <h1 className="serif text-3xl">Join an assessment</h1>
        <JoinForm defaultCode={code || ""} />
        {assessment ? (
          <Card className="mt-6 p-5">
            <h2 className="serif text-2xl">{assessment.title}</h2>
            <p className="mt-2 text-sm text-muted">
              {assessment._count.questions} questions · {assessment.durationMinutes} minutes · {assessment.totalMarks}{" "}
              marks
            </p>
            <p className="mt-3 text-sm">{assessment.instructions}</p>
            <p className="mt-3 text-sm text-muted">{scoringFormula(assessment.negativeMarking)}</p>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
