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
        <h1 className="text-3xl font-bold">AI评估中心</h1>
        <p className="text-muted-foreground">
          通过AI智能评分和洞察分析候选人与职位的匹配度
        </p>
      </div>
      
      <Suspense fallback={<div>加载评估数据中...</div>}>
        <EvaluationsDashboard />
      </Suspense>
    </div>
  );
}