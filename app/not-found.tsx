import Link from "next/link";

// App Router 404 page. Do NOT create pages/404.tsx or pages/_document.tsx —
// this project uses the App Router exclusively, and importing <Html> from
// next/document outside pages/_document.tsx breaks `next build`.
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ms-bg text-ms-text">
      <h1 className="text-6xl font-bold tracking-tight">404</h1>
      <p className="text-lg opacity-70">This page could not be found.</p>
      <Link
        href="/"
        className="mt-2 rounded-lg border border-white/20 px-4 py-2 text-sm transition-colors hover:bg-white/10"
      >
        Back to Signal Engine
      </Link>
    </div>
  );
}
