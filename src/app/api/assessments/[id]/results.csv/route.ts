import { prisma } from "@/lib/db";
import { requireEducatorAssessment } from "@/lib/access";
import { currentUser, jsonError, unauthorized } from "@/lib/http";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await currentUser();
    if (!user) return unauthorized();
    const { id } = await params;
    await requireEducatorAssessment(user.id, user.role, id);
    const attempts = await prisma.assessmentAttempt.findMany({
      where: { assessmentId: id, status: { in: ["SUBMITTED", "TIMED_OUT"] } },
      include: { student: true },
      orderBy: { submittedAt: "desc" },
    });
    const header = "student,email,score,percentage,time_seconds,submitted_at,status";
    const rows = attempts.map((a) =>
      [
        csv(a.student.name),
        csv(a.student.email),
        a.score ?? "",
        a.percentage ?? "",
        a.totalTimeSeconds ?? "",
        a.submittedAt?.toISOString() ?? "",
        a.status,
      ].join(","),
    );
    return new Response([header, ...rows].join("\n"), {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="results-${id}.csv"`,
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}

function csv(value: string) {
  if (value.includes(",") || value.includes('"')) return `"${value.replaceAll('"', '""')}"`;
  return value;
}
