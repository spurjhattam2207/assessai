import type { Question } from "@prisma/client";

export function snapshotQuestions(questions: Question[]) {
  return questions.map((q) => ({
    id: q.id,
    position: q.position,
    type: q.type,
    prompt: q.prompt,
    options: q.options,
    correctAnswer: q.correctAnswer,
    explanation: q.explanation,
    topic: q.topic,
    difficulty: q.difficulty,
    marks: q.marks,
    negativeMarks: q.negativeMarks,
    tolerance: q.tolerance,
  }));
}

export function stripKeys<T extends { correctAnswer?: unknown; explanation?: string }>(questions: T[]) {
  return questions.map((q) => {
    const { correctAnswer, explanation, ...rest } = q;
    void correctAnswer;
    void explanation;
    return rest;
  });
}
