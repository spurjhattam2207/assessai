import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="serif text-4xl">About AssessAI</h1>
      <p className="mt-4 text-lg text-muted">
        AssessAI is building practical assessment tools for educators and learners across competitive exam
        preparation and higher education. We are focused on making assessment creation simpler and learning
        progress easier to understand.
      </p>
      <p className="mt-4 text-muted">
        This is an early product. We do not claim institutional partnerships, live student counts or guaranteed
        score improvements.
      </p>
      <p className="mt-6">
        <Link href="/contact" className="text-accent">
          Contact
        </Link>
      </p>
    </div>
  );
}
