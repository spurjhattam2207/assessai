import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui";

export const metadata: Metadata = { title: "For students" };

export default function StudentsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="serif text-4xl">Every attempt becomes useful feedback.</h1>
      <p className="mt-4 text-lg text-muted">
        Review mistakes, track topic-wise accuracy and keep personal revision notes in one place.
      </p>
      <ul className="mt-8 space-y-3 text-muted">
        <li>Join with a code, read the scoring rules, then work through a quiet test interface.</li>
        <li>After submit, see what you chose, what was correct, and the explanation.</li>
        <li>My Performance keeps history, topic accuracy and a revision list — without implying more than the sample size supports.</li>
      </ul>
      <div className="mt-8">
        <Link href="/signin?demo=student">
          <Button>Open the student demo</Button>
        </Link>
      </div>
    </div>
  );
}
