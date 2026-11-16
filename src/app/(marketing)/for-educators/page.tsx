import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui";

export const metadata: Metadata = { title: "For educators" };

export default function EducatorsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="serif text-4xl">Build assessments in minutes.</h1>
      <p className="mt-4 text-lg text-muted">
        Start from a topic or your own material, review AI-assisted questions and publish when they are ready.
      </p>
      <ul className="mt-8 space-y-3 text-muted">
        <li>Create for JEE, UPSC or a college course without changing products.</li>
        <li>Edit every prompt, option, mark and explanation before anyone sits the paper.</li>
        <li>Share a link or a short join code. See who submitted, average score and time taken.</li>
        <li>Export a CSV of results. Student revision notes stay private to the student.</li>
      </ul>
      <div className="mt-8">
        <Link href="/signin?demo=educator">
          <Button>Open the educator demo</Button>
        </Link>
      </div>
    </div>
  );
}
