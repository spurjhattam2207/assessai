import Link from "next/link";
import { Suspense } from "react";
import { SignInForm } from "@/components/auth-form";
import { SiteHeader } from "@/components/site-chrome";

export default function SignInPage() {
  return (
    <div>
      <SiteHeader />
      <div className="mx-auto max-w-md px-4 py-16">
        <h1 className="serif text-3xl">Sign in</h1>
        <p className="mt-2 text-sm text-muted">
          Demo entry is labelled separately from a real account.{" "}
          <Link href="/signup" className="text-accent">
            Create an account
          </Link>
        </p>
        <div className="mt-8">
          <Suspense>
            <SignInForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
