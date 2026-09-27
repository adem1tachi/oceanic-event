import Link from "next/link";

export default function NotFound() {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50 text-slate-900 font-sans">
        <div className="text-center max-w-md p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <h1 className="text-3xl font-black mb-2 text-slate-900">404</h1>
          <h2 className="text-lg font-bold mb-2 text-slate-800">Page Not Found</h2>
          <p className="text-xs text-slate-500 mb-6">
            The page you are looking for does not exist or has been moved.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 transition-colors"
          >
            Return to Homepage
          </Link>
        </div>
      </body>
    </html>
  );
}
