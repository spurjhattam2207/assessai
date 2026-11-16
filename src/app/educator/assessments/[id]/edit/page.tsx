import { AssessmentBuilder } from "@/components/assessment-builder";
import { AppHeader } from "@/components/site-chrome";
import { requireEducatorAssessment } from "@/lib/access";
import { requireEducator } from "@/lib/session";

export default async function EditAssessmentPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireEducator();
  const { id } = await params;
  const assessment = await requireEducatorAssessment(user.id, user.role, id);
  return (
    <div>
      <AppHeader />
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="serif mb-6 text-3xl">Edit assessment</h1>
        <AssessmentBuilder
          initial={{
            id: assessment.id,
            title: assessment.title,
            description: assessment.description,
            audience: assessment.audience,
            subject: assessment.subject,
            topics: assessment.topics,
            difficulty: assessment.difficulty,
            durationMinutes: assessment.durationMinutes,
            negativeMarking: assessment.negativeMarking,
            instructions: assessment.instructions,
            accessMode: assessment.accessMode,
            status: assessment.status,
            questions: assessment.questions.map((q) => ({
              id: q.id,
              type: q.type,
              prompt: q.prompt,
              options: q.options as { id: string; text: string }[],
              correctAnswer: q.correctAnswer as { optionIds?: string[]; value?: number; text?: string },
              explanation: q.explanation,
              topic: q.topic,
              difficulty: q.difficulty,
              marks: q.marks,
              negativeMarks: q.negativeMarks,
              tolerance: q.tolerance,
              flagForReview: q.flagForReview,
              generated: q.generated,
            })),
          }}
        />
      </div>
    </div>
  );
}
