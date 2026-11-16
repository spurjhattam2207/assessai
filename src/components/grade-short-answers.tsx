"use client";

import { useState } from "react";
import { Button, Card, Input } from "./ui";

export function GradeShortAnswers({
  items,
}: {
  items: { responseId: string; student: string; prompt: string; answer: string; marks: number }[];
}) {
  const [message, setMessage] = useState("");
  if (!items.length) return null;
  return (
    <Card className="mt-6 space-y-4 p-5">
      <h2 className="serif text-xl">Awaiting educator review</h2>
      {items.map((item) => (
        <form
          key={item.responseId}
          className="space-y-2 border-b border-line pb-4 last:border-0"
          onSubmit={async (e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            const res = await fetch("/api/educator/grade", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                responseId: item.responseId,
                marksAwarded: Number(form.get("marks")),
                feedback: String(form.get("feedback") || ""),
              }),
            });
            setMessage(res.ok ? "Saved marks." : "Could not save marks.");
            if (res.ok) window.location.reload();
          }}
        >
          <p className="text-sm font-medium">{item.student}</p>
          <p className="text-sm">{item.prompt}</p>
          <p className="text-sm text-muted">{item.answer || "No response"}</p>
          <div className="flex gap-2">
            <Input name="marks" type="number" step="0.5" min={0} max={item.marks} defaultValue={0} />
            <Input name="feedback" placeholder="Feedback" />
            <Button type="submit" size="sm">
              Save
            </Button>
          </div>
        </form>
      ))}
      {message ? <p className="text-sm text-muted">{message}</p> : null}
    </Card>
  );
}
