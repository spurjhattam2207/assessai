export type QuestionType = "SINGLE_MCQ" | "MULTI_MCQ" | "NUMERICAL" | "SHORT_ANSWER";

export type Option = { id: string; text: string };

export type CorrectAnswer =
  | { optionIds: string[] }
  | { value: number }
  | { text?: string };

export type StudentAnswer =
  | { optionIds?: string[]; value?: number | string | null; text?: string }
  | null
  | undefined;

export type GradableQuestion = {
  id: string;
  type: QuestionType;
  marks: number;
  negativeMarks: number;
  tolerance?: number | null;
  correctAnswer: CorrectAnswer;
};

export type GradeResult = {
  isCorrect: boolean | null;
  awaitingReview: boolean;
  marksAwarded: number;
  unanswered: boolean;
};

function asOptionIds(answer: StudentAnswer): string[] {
  if (!answer || !Array.isArray(answer.optionIds)) return [];
  return [...answer.optionIds].map(String).sort();
}

function isBlank(answer: StudentAnswer, type: QuestionType): boolean {
  if (!answer) return true;
  if (type === "SINGLE_MCQ" || type === "MULTI_MCQ") {
    return asOptionIds(answer).length === 0;
  }
  if (type === "NUMERICAL") {
    return answer.value === undefined || answer.value === null || answer.value === "";
  }
  return !answer.text || answer.text.trim().length === 0;
}

function sameSet(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  return a.every((value, index) => value === b[index]);
}

export function gradeQuestion(question: GradableQuestion, answer: StudentAnswer): GradeResult {
  if (isBlank(answer, question.type)) {
    return {
      isCorrect: null,
      awaitingReview: false,
      marksAwarded: 0,
      unanswered: true,
    };
  }

  if (question.type === "SHORT_ANSWER") {
    return {
      isCorrect: null,
      awaitingReview: true,
      marksAwarded: 0,
      unanswered: false,
    };
  }

  let correct = false;

  if (question.type === "SINGLE_MCQ") {
    const selected = asOptionIds(answer);
    const expected = [...(("optionIds" in question.correctAnswer && question.correctAnswer.optionIds) || [])]
      .map(String)
      .sort();
    correct = selected.length === 1 && sameSet(selected, expected);
  } else if (question.type === "MULTI_MCQ") {
    const selected = asOptionIds(answer);
    const expected = [...(("optionIds" in question.correctAnswer && question.correctAnswer.optionIds) || [])]
      .map(String)
      .sort();
    // Exact match only — no partial credit.
    correct = sameSet(selected, expected);
  } else if (question.type === "NUMERICAL") {
    const raw = answer?.value;
    const numeric = typeof raw === "number" ? raw : Number(raw);
    const expected = "value" in question.correctAnswer ? Number(question.correctAnswer.value) : NaN;
    const tolerance = question.tolerance ?? 0;
    correct = Number.isFinite(numeric) && Number.isFinite(expected) && Math.abs(numeric - expected) <= tolerance;
  }

  if (correct) {
    return {
      isCorrect: true,
      awaitingReview: false,
      marksAwarded: question.marks,
      unanswered: false,
    };
  }

  return {
    isCorrect: false,
    awaitingReview: false,
    marksAwarded: -Math.abs(question.negativeMarks || 0),
    unanswered: false,
  };
}

export function gradeAttempt(questions: GradableQuestion[], responses: Record<string, StudentAnswer>) {
  let score = 0;
  let correctCount = 0;
  let incorrectCount = 0;
  let unansweredCount = 0;
  let awaitingReviewCount = 0;
  const perQuestion: Record<string, GradeResult> = {};

  for (const question of questions) {
    const result = gradeQuestion(question, responses[question.id]);
    perQuestion[question.id] = result;
    score += result.marksAwarded;
    if (result.unanswered) unansweredCount += 1;
    else if (result.awaitingReview) awaitingReviewCount += 1;
    else if (result.isCorrect) correctCount += 1;
    else incorrectCount += 1;
  }

  const maxMarks = questions.reduce((sum, question) => sum + question.marks, 0);
  const percentage = maxMarks > 0 ? (score / maxMarks) * 100 : 0;

  return {
    score,
    percentage,
    correctCount,
    incorrectCount,
    unansweredCount,
    awaitingReviewCount,
    maxMarks,
    perQuestion,
  };
}

export function publicQuestion<T extends { correctAnswer?: unknown; explanation?: string }>(question: T) {
  const { correctAnswer, explanation, ...rest } = question;
  void correctAnswer;
  void explanation;
  return rest;
}
