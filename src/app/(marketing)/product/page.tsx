import type { Metadata } from "next";

export const metadata: Metadata = { title: "Product" };

export default function ProductPage() {
  const sections = [
    {
      title: "Assessment creation",
      body: "Set audience, subject, topics, duration and marking. Add single-correct, multiple-select, numerical and short-answer items. Save drafts, preview the student view, then publish with a join code.",
    },
    {
      title: "AI-assisted drafts",
      body: "Generate a first pass from a topic or uploaded notes. Every item is editable. If live model credentials are missing, a labelled demo fixture is used instead of pretending a model ran.",
    },
    {
      title: "Test-taking",
      body: "One question at a time, a palette, mark-for-review, autosave and a timer. Submission is confirmed, graded on the server, and cannot be scored twice.",
    },
    {
      title: "Performance log",
      body: "Students keep an immutable attempt history, topic accuracy, a mistake list and private revision notes educators cannot see.",
    },
  ];
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="serif text-4xl">What AssessAI does</h1>
      <p className="mt-3 text-muted">
        One product for JEE, UPSC and college assessments — not three disconnected tools.
      </p>
      <div className="mt-10 space-y-8">
        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="serif text-2xl">{section.title}</h2>
            <p className="mt-2 text-muted">{section.body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
