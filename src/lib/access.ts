import { Role } from "@prisma/client";
import { prisma } from "./db";

export class AccessError extends Error {
  status: number;
  constructor(message: string, status = 403) {
    super(message);
    this.status = status;
  }
}

export async function requireEducatorAssessment(
  userId: string,
  role: Role | "EDUCATOR" | "STUDENT",
  assessmentId: string,
) {
  if (role !== "EDUCATOR") {
    throw new AccessError("Only educators can manage assessments.", 403);
  }
  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    include: { questions: { orderBy: { position: "asc" } } },
  });
  if (!assessment) throw new AccessError("Assessment not found.", 404);
  if (assessment.creatorId !== userId) {
    throw new AccessError("You can only manage assessments you created.", 403);
  }
  return assessment;
}

export async function requireStudentAttempt(
  userId: string,
  role: Role | "EDUCATOR" | "STUDENT",
  attemptId: string,
) {
  if (role !== "STUDENT") {
    throw new AccessError("Only students can access this attempt.", 403);
  }
  const attempt = await prisma.assessmentAttempt.findUnique({
    where: { id: attemptId },
    include: {
      assessment: true,
      responses: true,
      student: true,
    },
  });
  if (!attempt) throw new AccessError("Attempt not found.", 404);
  if (attempt.studentId !== userId) {
    throw new AccessError("You can only access your own attempts.", 403);
  }
  return attempt;
}

export function canEditQuestions(status: string, attemptCount: number) {
  if (status === "DRAFT") return true;
  if (status === "PUBLISHED" && attemptCount === 0) return true;
  return false;
}

export function canAccessPrivateNote(noteStudentId: string, requesterId: string, requesterRole: string) {
  return requesterRole === "STUDENT" && noteStudentId === requesterId;
}
