import { Suspense } from "react";
import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import { EvaluationsDashboard } from "./EvaluationsDashboard";

export default async function EvaluationsPage() {
  const session = await auth();
  
  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">AI Evaluation Center</h1>
        <p className="text-muted-foreground">
          Analyze candidate-job matches with AI-powered scoring and insights
        </p>
      </div>
      
      <Suspense fallback={<div>Loading evaluations...</div>}>
        <EvaluationsDashboard />
      </Suspense>
    </div>
  );
}