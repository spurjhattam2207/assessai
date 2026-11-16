"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button, Card, FieldError, Input, Label, Textarea } from "./ui";

type Question = {
  id?: string;
  type: "SINGLE_MCQ" | "MULTI_MCQ" | "NUMERICAL" | "SHORT_ANSWER";
  prompt: string;
  options: { id: string; text: string }[];
  correctAnswer: { optionIds?: string[]; value?: number; text?: string };
  explanation: string;
  topic: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  marks: number;
  negativeMarks: number;
  tolerance?: number | null;
  flagForReview?: boolean;
  generated?: boolean;
};

const blankQuestion = (topic: string): Question => ({
  type: "SINGLE_MCQ",
  prompt: "",
  options: [
    { id: "A", text: "" },
    { id: "B", text: "" },
    { id: "C", text: "" },
    { id: "D", text: "" },
  ],
  correctAnswer: { optionIds: ["A"] },
  explanation: "",
  topic,
  difficulty: "MEDIUM",
  marks: 4,
  negativeMarks: 1,
});

export function AssessmentBuilder({
  initial,
}: {
  initial?: {
    id: string;
    title: string;
    description: string;
    audience: string;
    subject: string;
    topics: string[];
    difficulty: string;
    durationMinutes: number;
    negativeMarking: boolean;
    instructions: string;
    accessMode: string;
    questions: Question[];
    status: string;
  };
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [id, setId] = useState(initial?.id || "");
  const [meta, setMeta] = useState({
    title: initial?.title || "",
    description: initial?.description || "",
    audience: initial?.audience || "JEE",
    subject: initial?.subject || "",
    topics: (initial?.topics || []).join(", "),
    difficulty: initial?.difficulty || "MEDIUM",
    durationMinutes: initial?.durationMinutes || 30,
    negativeMarking: initial?.negativeMarking || false,
    instructions: initial?.instructions || "",
    accessMode: initial?.accessMode || "SIGNED_IN",
  });
  const [questions, setQuestions] = useState<Question[]>(initial?.questions || []);
  const [gen, setGen] = useState({
    questionCount: 5,
    types: "SINGLE_MCQ",
    language: "English",
    customInstructions: "",
  });
  const topicList = useMemo(
    () =>
      meta.topics
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    [meta.topics],
  );

  function payloadMeta() {
    return {
      ...meta,
      durationMinutes: Number(meta.durationMinutes),
      topics: topicList,
    };
  }

  async function ensureDraft() {
    if (id) return id;
    const res = await fetch("/api/assessments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payloadMeta()),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Could not create assessment.");
    setId(data.assessment.id);
    return data.assessment.id as string;
  }

  async function save(publish = false) {
    setSaving(true);
    setError("");
    try {
      const assessmentId = await ensureDraft();
      const res = await fetch(`/api/assessments/${assessmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meta: payloadMeta(), questions }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (publish) {
        const pub = await fetch(`/api/assessments/${assessmentId}/publish`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "PUBLISHED" }),
        });
        const pubData = await pub.json();
        if (!pub.ok) throw new Error(pubData.error);
        router.push(`/educator/assessments/${assessmentId}`);
        return;
      }
      router.push(`/educator/assessments/${assessmentId}/edit`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function generate(file?: File) {
    setGenerating(true);
    setError("");
    setNotice("");
    try {
      const assessmentId = await ensureDraft();
      const form = new FormData();
      form.set(
        "payload",
        JSON.stringify({
          audience: meta.audience,
          subject: meta.subject || meta.audience,
          topics: topicList.length ? topicList : [meta.subject || "General"],
          difficulty: meta.difficulty,
          questionCount: Number(gen.questionCount),
          types: gen.types.split(",").filter(Boolean),
          language: gen.language,
          customInstructions: gen.customInstructions,
        }),
      );
      if (file) form.set("file", file);
      const res = await fetch(`/api/assessments/${assessmentId}/generate`, { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed.");
      setQuestions((current) => [
        ...current,
        ...data.questions.map((q: Question) => ({ ...q, generated: true, flagForReview: true })),
      ]);
      setNotice(data.notice);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed.");
    } finally {
      setGenerating(false);
    }
  }

  function updateQuestion(index: number, patch: Partial<Question>) {
    setQuestions((current) => current.map((q, i) => (i === index ? { ...q, ...patch } : q)));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-6">
        <Card className="space-y-4 p-5">
          <div>
            <Label>Title</Label>
            <Input value={meta.title} onChange={(e) => setMeta({ ...meta, title: e.target.value })} required />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Audience</Label>
              <select
                className="h-11 w-full rounded-md border border-line bg-white px-3 text-sm"
                value={meta.audience}
                onChange={(e) => setMeta({ ...meta, audience: e.target.value })}
              >
                <option value="JEE">JEE</option>
                <option value="UPSC">UPSC</option>
                <option value="COLLEGE">College</option>
              </select>
            </div>
            <div>
              <Label>Subject / course</Label>
              <Input value={meta.subject} onChange={(e) => setMeta({ ...meta, subject: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Topics (comma separated)</Label>
            <Input value={meta.topics} onChange={(e) => setMeta({ ...meta, topics: e.target.value })} />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label>Difficulty</Label>
              <select
                className="h-11 w-full rounded-md border border-line bg-white px-3 text-sm"
                value={meta.difficulty}
                onChange={(e) => setMeta({ ...meta, difficulty: e.target.value })}
              >
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
            </div>
            <div>
              <Label>Duration (minutes)</Label>
              <Input
                type="number"
                min={5}
                value={meta.durationMinutes}
                onChange={(e) => setMeta({ ...meta, durationMinutes: Number(e.target.value) })}
              />
            </div>
            <label className="mt-7 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={meta.negativeMarking}
                onChange={(e) => setMeta({ ...meta, negativeMarking: e.target.checked })}
              />
              Negative marking
            </label>
          </div>
          <div>
            <Label>Instructions</Label>
            <Textarea value={meta.instructions} onChange={(e) => setMeta({ ...meta, instructions: e.target.value })} />
          </div>
        </Card>

        <div className="flex items-center justify-between">
          <h2 className="serif text-2xl">Questions</h2>
          <Button type="button" variant="secondary" onClick={() => setQuestions((q) => [...q, blankQuestion(topicList[0] || meta.subject)])}>
            Add question
          </Button>
        </div>
        {questions.map((question, index) => (
          <Card key={index} className="space-y-3 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-muted">
                Question {index + 1}
                {question.generated ? " · AI draft" : ""}
                {question.flagForReview ? " · flagged for review" : ""}
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setQuestions((qs) => [...qs.slice(0, index + 1), { ...question }, ...qs.slice(index + 1)])}
                >
                  Duplicate
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setQuestions((qs) => qs.filter((_, i) => i !== index))}
                >
                  Remove
                </Button>
              </div>
            </div>
            <select
              className="h-11 rounded-md border border-line bg-white px-3 text-sm"
              value={question.type}
              onChange={(e) => updateQuestion(index, { type: e.target.value as Question["type"] })}
            >
              <option value="SINGLE_MCQ">Single-correct MCQ</option>
              <option value="MULTI_MCQ">Multiple-select MCQ</option>
              <option value="NUMERICAL">Numerical</option>
              <option value="SHORT_ANSWER">Short answer</option>
            </select>
            <Textarea
              placeholder="Prompt"
              value={question.prompt}
              onChange={(e) => updateQuestion(index, { prompt: e.target.value })}
            />
            {(question.type === "SINGLE_MCQ" || question.type === "MULTI_MCQ") &&
              question.options.map((option, oi) => (
                <div key={option.id} className="flex items-center gap-2">
                  <input
                    type={question.type === "SINGLE_MCQ" ? "radio" : "checkbox"}
                    checked={question.correctAnswer.optionIds?.includes(option.id) || false}
                    onChange={(e) => {
                      const current = question.correctAnswer.optionIds || [];
                      const optionIds =
                        question.type === "SINGLE_MCQ"
                          ? [option.id]
                          : e.target.checked
                            ? [...current, option.id]
                            : current.filter((id) => id !== option.id);
                      updateQuestion(index, { correctAnswer: { ...question.correctAnswer, optionIds } });
                    }}
                  />
                  <span className="w-5 text-sm">{option.id}</span>
                  <Input
                    value={option.text}
                    onChange={(e) => {
                      const options = question.options.map((o, i) => (i === oi ? { ...o, text: e.target.value } : o));
                      updateQuestion(index, { options });
                    }}
                  />
                </div>
              ))}
            {question.type === "NUMERICAL" ? (
              <div className="grid gap-3 md:grid-cols-2">
                <Input
                  type="number"
                  placeholder="Correct value"
                  value={question.correctAnswer.value ?? ""}
                  onChange={(e) =>
                    updateQuestion(index, { correctAnswer: { value: Number(e.target.value) } })
                  }
                />
                <Input
                  type="number"
                  placeholder="Tolerance"
                  value={question.tolerance ?? 0}
                  onChange={(e) => updateQuestion(index, { tolerance: Number(e.target.value) })}
                />
              </div>
            ) : null}
            <Input
              placeholder="Explanation"
              value={question.explanation}
              onChange={(e) => updateQuestion(index, { explanation: e.target.value })}
            />
            <div className="grid gap-3 md:grid-cols-4">
              <Input
                placeholder="Topic"
                value={question.topic}
                onChange={(e) => updateQuestion(index, { topic: e.target.value })}
              />
              <Input
                type="number"
                value={question.marks}
                onChange={(e) => updateQuestion(index, { marks: Number(e.target.value) })}
              />
              <Input
                type="number"
                value={question.negativeMarks}
                onChange={(e) => updateQuestion(index, { negativeMarks: Number(e.target.value) })}
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={question.flagForReview || false}
                  onChange={(e) => updateQuestion(index, { flagForReview: e.target.checked })}
                />
                Flag for review
              </label>
            </div>
          </Card>
        ))}
        <FieldError>{error}</FieldError>
        {notice ? <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-warn">{notice}</p> : null}
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" disabled={saving} onClick={() => save(false)}>
            {saving ? "Saving…" : "Save draft"}
          </Button>
          {id ? (
            <Button type="button" variant="ghost" onClick={() => router.push(`/educator/assessments/${id}/preview`)}>
              Preview
            </Button>
          ) : null}
          <Button type="button" disabled={saving} onClick={() => save(true)}>
            Publish
          </Button>
        </div>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-6 h-fit">
        <Card className="space-y-3 p-5">
          <h2 className="serif text-xl">AI draft</h2>
          <p className="text-xs text-muted">
            AI-generated questions and explanations are drafts. Educators should verify correctness and suitability
            before publishing.
          </p>
          <Input
            type="number"
            min={1}
            max={20}
            value={gen.questionCount}
            onChange={(e) => setGen({ ...gen, questionCount: Number(e.target.value) })}
          />
          <select
            className="h-11 w-full rounded-md border border-line bg-white px-3 text-sm"
            value={gen.types}
            onChange={(e) => setGen({ ...gen, types: e.target.value })}
          >
            <option value="SINGLE_MCQ">Single-correct</option>
            <option value="SINGLE_MCQ,MULTI_MCQ">MCQ mix</option>
            <option value="SINGLE_MCQ,NUMERICAL">MCQ + numerical</option>
            <option value="SINGLE_MCQ,MULTI_MCQ,NUMERICAL,SHORT_ANSWER">All types</option>
          </select>
          <Textarea
            placeholder="Optional extra instructions"
            value={gen.customInstructions}
            onChange={(e) => setGen({ ...gen, customInstructions: e.target.value })}
          />
          <input
            type="file"
            accept=".pdf,.txt,application/pdf,text/plain"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) generate(file);
            }}
          />
          <Button type="button" disabled={generating} onClick={() => generate()}>
            {generating ? "Generating…" : "Generate draft questions"}
          </Button>
        </Card>
      </aside>
    </div>
  );
}
