import { describe, expect, it } from "vitest";
import { gradeAttempt, gradeQuestion, publicQuestion, type GradableQuestion } from "../src/lib/grading";

const mcq: GradableQuestion = {
  id: "q1",
  type: "SINGLE_MCQ",
  marks: 4,
  negativeMarks: 1,
  correctAnswer: { optionIds: ["B"] },
};

const multi: GradableQuestion = {
  id: "q2",
  type: "MULTI_MCQ",
  marks: 4,
  negativeMarks: 1,
  correctAnswer: { optionIds: ["A", "C"] },
};

const numerical: GradableQuestion = {
  id: "q3",
  type: "NUMERICAL",
  marks: 4,
  negativeMarks: 0,
  tolerance: 0.1,
  correctAnswer: { value: 2 },
};

describe("single-correct MCQ", () => {
  it("awards marks when correct", () => {
    expect(gradeQuestion(mcq, { optionIds: ["B"] })).toMatchObject({
      isCorrect: true,
      marksAwarded: 4,
      unanswered: false,
    });
  });

  it("applies negative marking when incorrect", () => {
    expect(gradeQuestion(mcq, { optionIds: ["A"] })).toMatchObject({
      isCorrect: false,
      marksAwarded: -1,
    });
  });

  it("scores unanswered as zero without calling it incorrect", () => {
    expect(gradeQuestion(mcq, { optionIds: [] })).toMatchObject({
      isCorrect: null,
      unanswered: true,
      marksAwarded: 0,
    });
  });
});

describe("multiple-select MCQ", () => {
  it("requires an exact option match", () => {
    expect(gradeQuestion(multi, { optionIds: ["C", "A"] }).isCorrect).toBe(true);
  });

  it("treats partial selection as incorrect", () => {
    expect(gradeQuestion(multi, { optionIds: ["A"] })).toMatchObject({
      isCorrect: false,
      marksAwarded: -1,
    });
  });
});

describe("numerical", () => {
  it("accepts an exact match", () => {
    expect(gradeQuestion(numerical, { value: 2 }).isCorrect).toBe(true);
  });

  it("accepts values within tolerance", () => {
    expect(gradeQuestion(numerical, { value: 2.05 }).isCorrect).toBe(true);
  });

  it("rejects values outside tolerance", () => {
    expect(gradeQuestion(numerical, { value: 2.3 }).isCorrect).toBe(false);
  });
});

describe("attempt aggregation", () => {
  it("does not double-count marks when grading a set once", () => {
    const first = gradeAttempt([mcq, numerical], {
      q1: { optionIds: ["B"] },
      q3: { value: 2 },
    });
    const second = gradeAttempt([mcq, numerical], {
      q1: { optionIds: ["B"] },
      q3: { value: 2 },
    });
    expect(first.score).toBe(8);
    expect(second.score).toBe(first.score);
  });
});

describe("answer-key privacy helper", () => {
  it("strips correct answers from student-facing payloads", () => {
    const exposed = publicQuestion({
      id: "q1",
      prompt: "Q",
      correctAnswer: { optionIds: ["A"] },
      explanation: "secret",
    });
    expect("correctAnswer" in exposed).toBe(false);
    expect("explanation" in exposed).toBe(false);
  });
});
