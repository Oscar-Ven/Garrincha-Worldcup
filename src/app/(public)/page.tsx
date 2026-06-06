import Link from "next/link";

export default function HomePage() {
  return (
    <main>
      <p>TODO: landing page</p>
      <Link href="/register">Register</Link>
      {" · "}
      <Link href="/matches">Matches</Link>
    </main>
  );
}
