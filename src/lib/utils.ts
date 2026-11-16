import { clsx } from "clsx";

export function cn(...inputs: Array<string | undefined | false | null>) {
  return clsx(inputs);
}

export function generateAccessCode(length = 6) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

export function formatPercent(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return "—";
  return `${Math.round(value)}%`;
}

export function formatDuration(totalSeconds: number | null | undefined) {
  if (totalSeconds == null) return "—";
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
}

export function scoringFormula(negativeMarking: boolean) {
  if (negativeMarking) {
    return "Score = marks for correct answers − negative marks for incorrect answers. Unanswered questions score 0. Multiple-select items require an exact option match. Numerical items allow the configured tolerance. Short answers wait for educator review.";
  }
  return "Score = marks for correct answers. Unanswered and incorrect questions score 0. Multiple-select items require an exact option match. Numerical items allow the configured tolerance. Short answers wait for educator review.";
}

export function audienceLabel(audience: string) {
  if (audience === "JEE") return "JEE";
  if (audience === "UPSC") return "UPSC";
  return "College";
}
