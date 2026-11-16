import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { Button, Card } from "@/components/ui";

const audiences = [
  {
    title: "JEE educators",
    body: "Subject, chapter and difficulty-wise MCQ and numerical practice with timed delivery.",
  },
  {
    title: "UPSC educators",
    body: "Prelims-style single and multiple-statement questions, topic quizzes and mocks.",
  },
  {
    title: "College faculty",
    body: "Course and module quizzes, objective items and short answers awaiting review.",
  },
];

const faqs = [
  {
    q: "Does AI publish questions on its own?",
    a: "No. Generated items land in an editable draft. Educators review, correct and publish.",
  },
  {
    q: "Can students see answers during a test?",
    a: "Answer keys stay on the server until the attempt is submitted or times out.",
  },
  {
    q: "Is pricing live?",
    a: "The pricing page is indicative. This MVP does not collect payments.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main>
        <section className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-[1.1fr_0.9fr] md:items-center">
          <div>
            <h1 className="serif text-4xl leading-tight md:text-5xl">Better assessments. Clearer progress.</h1>
            <p className="mt-4 max-w-xl text-lg text-muted">
              Create focused quizzes, deliver assessments and help every learner understand what to improve next.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/signin?demo=1">
                <Button>Explore the demo</Button>
              </Link>
              <Link href="/signin?next=/educator/assessments/new">
                <Button variant="secondary">Create an assessment</Button>
              </Link>
            </div>
          </div>
          <Card className="p-5 shadow-sm">
            <p className="text-xs text-muted">Question 2 of 6 · Current Electricity</p>
            <p className="serif mt-3 text-lg">
              A wire of resistance 4 Ω is stretched to twice its length. If volume is constant, the new resistance is:
            </p>
            <div className="mt-4 space-y-2 text-sm">
              {["4 Ω", "8 Ω", "16 Ω", "2 Ω"].map((option, i) => (
                <div
                  key={option}
                  className={`rounded-md border px-3 py-2 ${i === 2 ? "border-accent bg-indigo-50" : "border-line"}`}
                >
                  {String.fromCharCode(65 + i)}. {option}
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-muted">Student test-taking view · remaining 12:40</p>
          </Card>
        </section>

        <section className="border-y border-line bg-card">
          <div className="mx-auto grid max-w-6xl gap-4 px-4 py-12 md:grid-cols-3">
            {audiences.map((item) => (
              <div key={item.title} className="rounded-lg border border-line p-5">
                <h2 className="serif text-xl">{item.title}</h2>
                <p className="mt-2 text-sm text-muted">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="serif text-3xl">The loop that matters</h2>
          <ol className="mt-6 grid gap-4 md:grid-cols-4">
            {[
              "Educator writes or generates a draft",
              "Questions are reviewed and published",
              "Student attempts a focused test",
              "Results, explanations and a revision log stay on record",
            ].map((step, i) => (
              <li key={step} className="rounded-lg border border-line bg-card p-4">
                <span className="text-sm text-accent">{i + 1}</span>
                <p className="mt-2 text-sm">{step}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-16">
          <h2 className="serif text-3xl">Questions</h2>
          <div className="mt-6 space-y-4">
            {faqs.map((item) => (
              <div key={item.q} className="border-b border-line pb-4">
                <h3 className="font-medium">{item.q}</h3>
                <p className="mt-1 text-sm text-muted">{item.a}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
