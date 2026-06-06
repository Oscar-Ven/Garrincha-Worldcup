import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <div className="text-zinc-600 text-xs font-bold uppercase tracking-[0.2em] mb-4">
          404
        </div>
        <h1 className="text-3xl font-black text-white uppercase tracking-tight mb-3">
          Page not found
        </h1>
        <p className="text-zinc-400 text-sm leading-relaxed mb-8">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-lime-400 text-zinc-950 font-black uppercase tracking-wider text-sm hover:bg-lime-300 transition-colors"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
