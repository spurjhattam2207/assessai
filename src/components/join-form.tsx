"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, FieldError, Input, Label } from "./ui";

export function JoinForm({ defaultCode }: { defaultCode: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  return (
    <form
      className="mt-6 space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        setPending(true);
        setError("");
        const form = new FormData(e.currentTarget);
        const code = String(form.get("code") || "").trim().toUpperCase();
        const lookup = await fetch("/api/join", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });
        const data = await lookup.json();
        if (!lookup.ok) {
          setError(data.error || "Could not join.");
          setPending(false);
          return;
        }
        if (data.attempt?.status === "IN_PROGRESS") {
          router.push(`/student/attempt/${data.attempt.id}`);
        } else if (data.attempt) {
          router.push(`/student/attempts/${data.attempt.id}/review`);
        } else {
          setError("Unexpected join response.");
          setPending(false);
        }
      }}
    >
      <Label>Access code</Label>
      <Input name="code" defaultValue={defaultCode} required />
      <FieldError>{error}</FieldError>
      <Button type="submit" disabled={pending}>
        {pending ? "Opening…" : "Start or continue"}
      </Button>
    </form>
  );
}
