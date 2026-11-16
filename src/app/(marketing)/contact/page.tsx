import type { Metadata } from "next";
import { Button, Input, Label, Textarea } from "@/components/ui";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <h1 className="serif text-4xl">Contact</h1>
      <p className="mt-3 text-muted">
        For product questions, email{" "}
        <a className="text-accent" href="mailto:hello@assessai.example">
          hello@assessai.example
        </a>
        . The form below is a local demo and does not send mail.
      </p>
      <form className="mt-8 space-y-4" action="/contact">
        <div>
          <Label>Name</Label>
          <Input name="name" required />
        </div>
        <div>
          <Label>Email</Label>
          <Input type="email" name="email" required />
        </div>
        <div>
          <Label>Message</Label>
          <Textarea name="message" required />
        </div>
        <Button type="submit">Send message</Button>
      </form>
    </div>
  );
}
