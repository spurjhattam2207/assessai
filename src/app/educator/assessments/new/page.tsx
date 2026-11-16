import { AssessmentBuilder } from "@/components/assessment-builder";
import { AppHeader } from "@/components/site-chrome";
import { requireEducator } from "@/lib/session";

export default async function NewAssessmentPage() {
  await requireEducator();
  return (
    <div>
      <AppHeader />
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="serif mb-6 text-3xl">Create assessment</h1>
        <AssessmentBuilder />
      </div>
    </div>
  );
}
