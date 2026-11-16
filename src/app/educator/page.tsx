import Link from "next/link";
import { requireEducator } from "@/lib/session";
import { prisma } from "@/lib/db";
import { Badge, Button, Card } from "@/components/ui";
import { audienceLabel, formatPercent } from "@/lib/utils";
import { AppHeader } from "@/components/site-chrome";
import { DemoBanner } from "@/components/demo-banner";

export default async function EducatorHome() {
  const user = await requireEducator();
  const assessments = await prisma.assessment.findMany({
    where: { creatorId: user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { attempts: true, questions: true } },
      attempts: { where: { status: { in: ["SUBMITTED", "TIMED_OUT"] } }, select: { percentage: true } },
    },
  });
  const published = assessments.filter((a) => a.status === "PUBLISHED").length;
  const attempts = assessments.reduce((sum, a) => sum + a._count.attempts, 0);

  return (
    <div>
      {user.isDemo ? <DemoBanner /> : null}
      <AppHeader />
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="serif text-3xl">Hello, {user.name}</h1>
            <p className="mt-1 text-muted">Create, review and publish assessments.</p>
          </div>
          <Link href="/educator/assessments/new">
            <Button>Create assessment</Button>
          </Link>
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <Card className="p-4">
            <p className="text-sm text-muted">Assessments</p>
            <p className="serif mt-1 text-3xl">{assessments.length}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted">Published</p>
            <p className="serif mt-1 text-3xl">{published}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted">Attempts recorded</p>
            <p className="serif mt-1 text-3xl">{attempts}</p>
          </Card>
        </div>
        <h2 className="serif mt-10 text-2xl">Recent assessments</h2>
        <div className="mt-4 overflow-x-auto rounded-lg border border-line bg-card">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-line text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Audience</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Attempts</th>
                <th className="px-4 py-3 font-medium">Avg</th>
              </tr>
            </thead>
            <tbody>
              {assessments.map((a) => {
                const scored = a.attempts.filter((x) => x.percentage != null);
                const avg = scored.length
                  ? scored.reduce((s, x) => s + (x.percentage || 0), 0) / scored.length
                  : null;
                const tone =
                  a.status === "PUBLISHED" ? "ok" : a.status === "DRAFT" ? "warn" : "neutral";
                return (
                  <tr key={a.id} className="border-b border-line last:border-0">
                    <td className="px-4 py-3">
                      <Link href={`/educator/assessments/${a.id}`} className="text-accent">
                        {a.title}
                      </Link>
                      <p className="text-xs text-muted">{a.subject}</p>
                    </td>
                    <td className="px-4 py-3">{audienceLabel(a.audience)}</td>
                    <td className="px-4 py-3">
                      <Badge tone={tone}>{a.status.toLowerCase()}</Badge>
                    </td>
                    <td className="px-4 py-3">{a._count.attempts}</td>
                    <td className="px-4 py-3">{formatPercent(avg)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
