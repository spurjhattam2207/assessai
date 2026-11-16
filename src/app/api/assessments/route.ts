import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { currentUser, jsonError, unauthorized } from "@/lib/http";
import { assessmentSchema } from "@/lib/validations";
import { generateAccessCode } from "@/lib/utils";

export async function GET() {
  const user = await currentUser();
  if (!user) return unauthorized();
  if (user.role === "EDUCATOR") {
    const assessments = await prisma.assessment.findMany({
      where: { creatorId: user.id },
      orderBy: { updatedAt: "desc" },
      include: { _count: { select: { attempts: true, questions: true } } },
    });
    return NextResponse.json({ assessments });
  }
  const assessments = await prisma.assessment.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    select: {
      id: true,
      title: true,
      audience: true,
      subject: true,
      durationMinutes: true,
      totalMarks: true,
      accessCode: true,
      difficulty: true,
      topics: true,
    },
  });
  return NextResponse.json({ assessments });
}

export async function POST(request: Request) {
  try {
    const user = await currentUser();
    if (!user) return unauthorized();
    if (user.role !== "EDUCATOR") {
      return NextResponse.json({ error: "Only educators can create assessments." }, { status: 403 });
    }
    const body = assessmentSchema.parse(await request.json());
    let accessCode = generateAccessCode();
    for (let i = 0; i < 5; i += 1) {
      const exists = await prisma.assessment.findUnique({ where: { accessCode } });
      if (!exists) break;
      accessCode = generateAccessCode();
    }
    const assessment = await prisma.assessment.create({
      data: {
        ...body,
        creatorId: user.id,
        accessCode,
      },
    });
    return NextResponse.json({ assessment });
  } catch (error) {
    return jsonError(error);
  }
}
