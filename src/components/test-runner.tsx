"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card } from "./ui";

type Question = {
  id: string;
  position: number;
  type: "SINGLE_MCQ" | "MULTI_MCQ" | "NUMERICAL" | "SHORT_ANSWER";
  prompt: string;
  options: { id: string; text: string }[];
  marks: number;
};

type ResponseState = {
  response: { optionIds?: string[]; value?: number | string; text?: string } | null;
  markedForReview: boolean;
  timeSpentSeconds: number;
};

export function TestRunner({
  attemptId,
  durationMinutes,
  startedAt,
  questions,
  initialResponses,
}: {
  attemptId: string;
  durationMinutes: number;
  startedAt: string;
  questions: Question[];
  initialResponses: Record<string, ResponseState>;
}) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [responses, setResponses] = useState(initialResponses);
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState("");
  const [remaining, setRemaining] = useState(() => remainingMs(startedAt, durationMinutes));
  const lastTick = useRef(Date.now());
  const question = questions[index];

  useEffect(() => {
    const timer = setInterval(() => {
      const ms = remainingMs(startedAt, durationMinutes);
      setRemaining(ms);
      const now = Date.now();
      const delta = Math.round((now - lastTick.current) / 1000);
      lastTick.current = now;
      if (delta > 0 && question) {
        setResponses((current) => ({
          ...current,
          [question.id]: {
            ...current[question.id],
            timeSpentSeconds: (current[question.id]?.timeSpentSeconds || 0) + delta,
          },
        }));
      }
      if (ms <= 0) {
        submit("timeout");
      }
    }, 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question?.id, startedAt, durationMinutes]);

  useEffect(() => {
    const handle = setInterval(() => {
      const current = questions[index];
      if (!current) return;
      const state = responses[current.id];
      fetch(`/api/attempts/${attemptId}/responses`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: current.id,
          response: state?.response ?? null,
          markedForReview: state?.markedForReview ?? false,
          timeSpentSeconds: state?.timeSpentSeconds ?? 0,
        }),
      });
    }, 4000);
    return () => clearInterval(handle);
  }, [attemptId, index, questions, responses]);

  const counts = useMemo(() => {
    let answered = 0;
    let marked = 0;
    for (const q of questions) {
      const r = responses[q.id];
      if (isAnswered(q, r?.response)) answered += 1;
      if (r?.markedForReview) marked += 1;
    }
    return { answered, unanswered: questions.length - answered, marked };
  }, [questions, responses]);

  function patch(questionId: string, next: Partial<ResponseState>) {
    setResponses((current) => ({
      ...current,
      [questionId]: { ...current[questionId], ...next },
    }));
  }

  async function submit(reason: "manual" | "timeout") {
    setError("");
    const res = await fetch(`/api/attempts/${attemptId}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not submit.");
      return;
    }
    router.push(`/student/attempts/${attemptId}/review`);
  }

  const minutes = Math.max(0, Math.floor(remaining / 60000));
  const seconds = Math.max(0, Math.floor((remaining % 60000) / 1000));

  return (
    <div className="mx-auto grid max-w-5xl gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_240px]">
      <div>
        <div className="mb-4 flex items-center justify-between text-sm">
          <p>
            Question {index + 1} of {questions.length}
          </p>
          <p className={remaining < 60000 ? "text-bad" : ""}>
            {minutes}:{seconds.toString().padStart(2, "0")} remaining
          </p>
        </div>
        <Card className="p-5">
          <p className="serif text-lg">{question.prompt}</p>
          <p className="mt-1 text-xs text-muted">{question.marks} marks</p>
          <div className="mt-4 space-y-2">
            {(question.type === "SINGLE_MCQ" || question.type === "MULTI_MCQ") &&
              question.options.map((option) => {
                const selected = responses[question.id]?.response?.optionIds || [];
                const checked = selected.includes(option.id);
                return (
                  <label key={option.id} className="flex cursor-pointer items-start gap-3 rounded-md border border-line p-3">
                    <input
                      type={question.type === "SINGLE_MCQ" ? "radio" : "checkbox"}
                      checked={checked}
                      onChange={() => {
                        const optionIds =
                          question.type === "SINGLE_MCQ"
                            ? [option.id]
                            : checked
                              ? selected.filter((id) => id !== option.id)
                              : [...selected, option.id];
                        patch(question.id, { response: { optionIds } });
                      }}
                    />
                    <span>
                      <strong className="mr-2">{option.id}.</strong>
                      {option.text}
                    </span>
                  </label>
                );
              })}
            {question.type === "NUMERICAL" ? (
              <input
                className="h-11 w-full rounded-md border border-line px-3"
                type="number"
                value={responses[question.id]?.response?.value ?? ""}
                onChange={(e) => patch(question.id, { response: { value: e.target.value } })}
              />
            ) : null}
            {question.type === "SHORT_ANSWER" ? (
              <textarea
                className="min-h-32 w-full rounded-md border border-line p-3"
                value={responses[question.id]?.response?.text ?? ""}
                onChange={(e) => patch(question.id, { response: { text: e.target.value } })}
              />
            ) : null}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button type="button" variant="secondary" disabled={index === 0} onClick={() => setIndex(index - 1)}>
              Previous
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={index === questions.length - 1}
              onClick={() => setIndex(index + 1)}
            >
              Next
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => patch(question.id, { markedForReview: !responses[question.id]?.markedForReview })}
            >
              {responses[question.id]?.markedForReview ? "Unmark" : "Mark for review"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => patch(question.id, { response: null })}>
              Clear
            </Button>
            <Button type="button" onClick={() => setConfirm(true)}>
              Submit
            </Button>
          </div>
          {error ? <p className="mt-3 text-sm text-bad">{error}</p> : null}
        </Card>
      </div>
      <aside>
        <p className="mb-2 text-sm text-muted">Question palette</p>
        <div className="grid grid-cols-5 gap-2">
          {questions.map((q, i) => {
            const state = responses[q.id];
            const answered = isAnswered(q, state?.response);
            const tone = state?.markedForReview
              ? "bg-amber-100 border-amber-300"
              : answered
                ? "bg-emerald-100 border-emerald-300"
                : "bg-white border-line";
            return (
              <button
                key={q.id}
                type="button"
                className={`h-9 rounded border text-sm ${tone} ${i === index ? "ring-2 ring-accent" : ""}`}
                onClick={() => setIndex(i)}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-muted">
          {counts.answered} answered · {counts.unanswered} unanswered · {counts.marked} marked
        </p>
      </aside>
      {confirm ? (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-ink/40 p-4">
          <Card className="max-w-md p-6">
            <h2 className="serif text-xl">Submit this assessment?</h2>
            <p className="mt-2 text-sm text-muted">
              {counts.answered} answered, {counts.unanswered} unanswered. You cannot change answers after submit.
            </p>
            <div className="mt-5 flex gap-2">
              <Button type="button" onClick={() => submit("manual")}>
                Submit now
              </Button>
              <Button type="button" variant="secondary" onClick={() => setConfirm(false)}>
                Continue working
              </Button>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}

function remainingMs(startedAt: string, durationMinutes: number) {
  const end = new Date(startedAt).getTime() + durationMinutes * 60_000;
  return end - Date.now();
}

function isAnswered(question: Question, response: ResponseState["response"]) {
  if (!response) return false;
  if (question.type === "SINGLE_MCQ" || question.type === "MULTI_MCQ") {
    return (response.optionIds || []).length > 0;
  }
  if (question.type === "NUMERICAL") return response.value !== undefined && response.value !== "";
  return Boolean(response.text && response.text.trim());
}
