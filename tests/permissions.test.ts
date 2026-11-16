import { describe, expect, it } from "vitest";
import { canAccessPrivateNote, canEditQuestions } from "../src/lib/access";

describe("assessment lock rule", () => {
  it("allows edits on drafts", () => {
    expect(canEditQuestions("DRAFT", 3)).toBe(true);
  });

  it("allows edits on published assessments with no attempts", () => {
    expect(canEditQuestions("PUBLISHED", 0)).toBe(true);
  });

  it("locks questions once students have started", () => {
    expect(canEditQuestions("PUBLISHED", 1)).toBe(false);
    expect(canEditQuestions("CLOSED", 1)).toBe(false);
  });
});

describe("private notes", () => {
  it("allows only the owning student", () => {
    expect(canAccessPrivateNote("stu-a", "stu-a", "STUDENT")).toBe(true);
    expect(canAccessPrivateNote("stu-a", "stu-b", "STUDENT")).toBe(false);
    expect(canAccessPrivateNote("stu-a", "edu-1", "EDUCATOR")).toBe(false);
  });
});
