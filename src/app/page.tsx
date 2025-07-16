import Link from "next/link";
import { auth } from "~/server/auth";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await auth();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
        <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-[5rem]">
          Match<span className="text-[hsl(280,100%,70%)]">-CV2</span>
        </h1>
        <p className="text-xl text-center text-white/80 max-w-2xl">
          AI-powered recruitment platform that automates hiring process through
          intelligent resume analysis and candidate-job matching.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-8">
          <Link
            className="flex max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-4 text-white hover:bg-white/20 transition-colors"
            href="/auth/signin"
          >
            <h3 className="text-2xl font-bold">Sign In →</h3>
            <div className="text-lg">
              Access your dashboard to manage resumes, job descriptions, and AI-powered matching.
            </div>
          </Link>
          <Link
            className="flex max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-4 text-white hover:bg-white/20 transition-colors"
            href="/auth/signup"
          >
            <h3 className="text-2xl font-bold">Get Started →</h3>
            <div className="text-lg">
              Create your account and start automating your recruitment process today.
            </div>
          </Link>
        </div>
        <div className="mt-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl">
            <div className="bg-white/10 p-4 rounded-lg">
              <h3 className="font-bold mb-2">Resume Parsing</h3>
              <p className="text-sm text-white/80">
                Extract structured information from PDF, Word, and text format resumes
              </p>
            </div>
            <div className="bg-white/10 p-4 rounded-lg">
              <h3 className="font-bold mb-2">AI Matching</h3>
              <p className="text-sm text-white/80">
                Multi-dimensional scoring with explanations and intelligent filtering
              </p>
            </div>
            <div className="bg-white/10 p-4 rounded-lg">
              <h3 className="font-bold mb-2">Smart Analytics</h3>
              <p className="text-sm text-white/80">
                Automated candidate labels and customizable evaluation strategies
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
