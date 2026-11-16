import Link from "next/link";
import { AppHeader } from "@/components/site-chrome";
import { DemoBanner } from "@/components/demo-banner";
import { Badge, Button, Card } from "@/components/ui";
import { prisma } from "@/lib/db";
import { requireStudent } from "@/lib/session";
import { formatPercent } from "@/lib/utils";

export default async function StudentHome() {
  const user = await requireStudent();
  const attempts = await prisma.assessmentAttempt.findMany({
    where: { studentId: user.id },
    include: { assessment: true },
    orderBy: { startedAt: "desc" },
  });
  const published = await prisma.assessment.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    take: 6,
  });
  const done = attempts.filter((a) => a.percentage != null);
  const avg = done.length ? done.reduce((s, a) => s + (a.percentage || 0), 0) / done.length : null;

  return (
    <div>
      {user.isDemo ? <DemoBanner /> : null}
      <AppHeader />
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="serif text-3xl">Hello, {user.name}</h1>
            <p className="text-muted">Join an assessment or continue a saved attempt.</p>
          </div>
          <Link href="/student/join">
            <Button>Join with a code</Button>
          </Link>
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <Card className="p-4">
            <p className="text-sm text-muted">Attempts</p>
            <p className="serif text-3xl">{attempts.length}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted">Recent average</p>
            <p className="serif text-3xl">{formatPercent(avg)}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted">Open papers</p>
            <p className="serif text-3xl">{published.length}</p>
          </Card>
        </div>
        <h2 className="serif mt-10 text-2xl">Available assessments</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {published.map((a) => (
            <Card key={a.id} className="p-4">
              <p className="font-medium">{a.title}</p>
              <p className="text-sm text-muted">
                {a.subject} · {a.durationMinutes} min · code {a.accessCode}
              </p>
              <Link href={`/student/join?code=${a.accessCode}`} className="mt-3 inline-block text-sm text-accent">
                Open instructions
              </Link>
            </Card>
          ))}
        </div>
        <h2 className="serif mt-10 text-2xl">Recent attempts</h2>
        <div className="mt-4 space-y-2">
          {attempts.map((a) => (
            <Card key={a.id} className="flex items-center justify-between p-4">
              <div>
                <p>{a.assessment.title}</p>
                <p className="text-sm text-muted">
                  {a.status === "IN_PROGRESS" ? "In progress" : formatPercent(a.percentage)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge>{a.status.toLowerCase().replace("_", " ")}</Badge>
                <Link
                  href={
                    a.status === "IN_PROGRESS"
                      ? `/student/attempt/${a.id}`
                      : `/student/attempts/${a.id}/review`
                  }
                  className="text-sm text-accent"
                >
                  {a.status === "IN_PROGRESS" ? "Continue" : "Review"}
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
