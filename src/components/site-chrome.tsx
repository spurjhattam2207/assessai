import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { Button } from "./ui";

const nav = [
  { href: "/product", label: "Product" },
  { href: "/for-educators", label: "For educators" },
  { href: "/for-students", label: "For students" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
];

export async function SiteHeader() {
  const session = await auth();
  const home = session?.user?.role === "EDUCATOR" ? "/educator" : session?.user ? "/student" : "/signin";
  return (
    <header className="border-b border-line bg-card/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="serif text-xl tracking-tight">
          AssessAI
        </Link>
        <nav className="hidden items-center gap-5 text-sm text-muted md:flex">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-ink">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {session?.user ? (
            <Link href={home} className="text-sm text-accent">
              Open app
            </Link>
          ) : (
            <>
              <Link href="/signin" className="hidden text-sm text-muted sm:block">
                Sign in
              </Link>
              <Link href="/signin?demo=1">
                <Button size="sm">Explore the demo</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-card">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-muted md:flex-row md:items-center md:justify-between">
        <p>AssessAI — assessment creation and learner progress. Product in active development.</p>
        <div className="flex gap-4">
          <Link href="/contact">Contact</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/signin">Sign in</Link>
        </div>
      </div>
    </footer>
  );
}

export async function AppHeader() {
  const session = await auth();
  const role = session?.user?.role;
  return (
    <header className="border-b border-line bg-card">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href={role === "EDUCATOR" ? "/educator" : "/student"} className="serif text-lg">
          AssessAI
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          {role === "EDUCATOR" ? (
            <>
              <Link href="/educator">Home</Link>
              <Link href="/educator/assessments/new">Create</Link>
            </>
          ) : (
            <>
              <Link href="/student">Home</Link>
              <Link href="/student/join">Join</Link>
              <Link href="/student/performance">My Performance</Link>
            </>
          )}
          <Link href="/profile">Profile</Link>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <Button type="submit" variant="ghost" size="sm">
              Log out
            </Button>
          </form>
        </nav>
      </div>
    </header>
  );
}
