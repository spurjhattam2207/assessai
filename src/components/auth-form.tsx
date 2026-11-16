"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button, FieldError, Input, Label } from "./ui";

export function SignInForm() {
  const params = useSearchParams();
  const demo = params.get("demo");
  const next = params.get("next") || params.get("from") || "";
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function login(email: string, password: string) {
    setPending(true);
    setError("");
    const result = await signIn("credentials", { email, password, redirect: false });
    if (result?.error) {
      setError("Check the email and password, then try again.");
      setPending(false);
      return;
    }
    const res = await fetch("/api/auth/session");
    const session = await res.json();
    const role = session?.user?.role;
    window.location.href = next || (role === "EDUCATOR" ? "/educator" : "/student");
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4">
        <p className="text-sm font-medium text-accent-deep">Explore demo</p>
        <p className="mt-1 text-sm text-muted">Seeded accounts. Fictional people and results only.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            onClick={() => login("educator@demo.assessai.app", "DemoEducator!23")}
            disabled={pending}
          >
            Educator demo
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => login("student@demo.assessai.app", "DemoStudent!23")}
            disabled={pending}
          >
            Student demo
          </Button>
        </div>
      </div>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          const form = new FormData(e.currentTarget);
          login(String(form.get("email")), String(form.get("password")));
        }}
      >
        <div>
          <Label>Email</Label>
          <Input
            name="email"
            type="email"
            required
            defaultValue={
              demo === "student" ? "student@demo.assessai.app" : demo ? "educator@demo.assessai.app" : ""
            }
          />
        </div>
        <div>
          <Label>Password</Label>
          <Input name="password" type="password" required />
        </div>
        <FieldError>{error}</FieldError>
        <Button type="submit" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </div>
  );
}

export function SignUpForm() {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setPending(true);
        setError("");
        const form = new FormData(e.currentTarget);
        const payload = Object.fromEntries(form.entries());
        const res = await fetch("/api/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Could not create the account.");
          setPending(false);
          return;
        }
        await signIn("credentials", {
          email: payload.email,
          password: payload.password,
          callbackUrl: payload.role === "EDUCATOR" ? "/educator" : "/student",
        });
      }}
    >
      <div>
        <Label>Name</Label>
        <Input name="name" required />
      </div>
      <div>
        <Label>Email</Label>
        <Input name="email" type="email" required />
      </div>
      <div>
        <Label>Password</Label>
        <Input name="password" type="password" minLength={8} required />
      </div>
      <div>
        <Label>Role</Label>
        <select name="role" className="h-11 w-full rounded-md border border-line bg-white px-3 text-sm">
          <option value="EDUCATOR">Educator</option>
          <option value="STUDENT">Student</option>
        </select>
      </div>
      <div>
        <Label>Primary context</Label>
        <select name="audience" className="h-11 w-full rounded-md border border-line bg-white px-3 text-sm">
          <option value="JEE">JEE</option>
          <option value="UPSC">UPSC</option>
          <option value="COLLEGE">College</option>
        </select>
      </div>
      <FieldError>{error}</FieldError>
      <Button type="submit" disabled={pending}>
        {pending ? "Creating…" : "Create account"}
      </Button>
    </form>
  );
}
