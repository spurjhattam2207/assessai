import Link from "next/link";
import { SignUpForm } from "@/components/auth-form";
import { SiteHeader } from "@/components/site-chrome";

export default function SignUpPage() {
  return (
    <div>
      <SiteHeader />
      <div className="mx-auto max-w-md px-4 py-16">
        <h1 className="serif text-3xl">Create an account</h1>
        <p className="mt-2 text-sm text-muted">
          Already have one?{" "}
          <Link href="/signin" className="text-accent">
            Sign in
          </Link>
        </p>
        <div className="mt-8">
          <SignUpForm />
        </div>
      </div>
    </div>
  );
}
