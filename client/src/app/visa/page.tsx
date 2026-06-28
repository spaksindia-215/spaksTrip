import { redirect } from "next/navigation";

// /visa has no standalone landing; the nav links straight to the category pages.
export default function VisaIndexPage() {
  redirect("/visa/pr-visa");
}
