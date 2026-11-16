"use client";

import { useState } from "react";
import { Button, Textarea } from "./ui";

export function PrivateNote({
  attemptId,
  questionId,
  initial,
}: {
  attemptId: string;
  questionId: string;
  initial: string;
}) {
  const [text, setText] = useState(initial);
  const [status, setStatus] = useState("");

  return (
    <form
      className="mt-3 space-y-2"
      onSubmit={async (e) => {
        e.preventDefault();
        const res = await fetch("/api/question-notes", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ attemptId, questionId, noteText: text }),
        });
        setStatus(res.ok ? "Note saved. Only you can see this." : "Could not save note.");
      }}
    >
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Private revision note"
      />
      <Button type="submit" size="sm" variant="secondary">
        Save note
      </Button>
      {status ? <p className="text-xs text-muted">{status}</p> : null}
    </form>
  );
}
