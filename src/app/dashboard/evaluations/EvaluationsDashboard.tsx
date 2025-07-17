"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { 
  Brain, 
  Users, 
  BarChart3, 
  Zap,
  TrendingUp
} from "lucide-react";
import { EvaluationReport } from "@/components/evaluations/EvaluationReport";
import { BatchEvaluationSummary } from "@/components/evaluations/BatchEvaluationSummary";

interface Job {
  id: string;
  title: string;
  department?: string;
  location?: string;
  status: string;
}

interface Resume {
  id: string;
  candidateName: string;
  candidateEmail: string;
  status: string;
  createdAt: string;
}

interface Evaluation {
  id: string;
  overallScore: number;
  skillsScore: number;
  experienceScore: number;
  educationScore: number;
  culturalFitScore?: number;
  explanation: string;
  recommendation: string;
  status: string;
  createdAt: string;
  job: Job;
  resume: {
    id: string;
    candidateName: string;
    candidateEmail: string;
  };
  evaluatedBy: {
    name: string;
  };
}

export function EvaluationsDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [selectedJob, setSelectedJob] = useState<string>("");
  const [selectedResumes, setSelectedResumes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedEvaluation, setSelectedEvaluation] = useState<string | null>(null);
  const [batchResults, setBatchResults] = useState<any>(null);

  // Load initial data
  useEffect(() => {
    void loadJobs();
    void loadResumes();
    void loadEvaluations();
  }, []);

  const loadJobs = async () => {
    try {
      const response = await fetch("/api/jobs");
      if (response.ok) {
        const data = await response.json();
        setJobs(data.jobs || []);
      }
    } catch (error) {
      console.error("Failed to load jobs:", error);
    }
  };

  const loadResumes = async () => {
    try {
      const response = await fetch("/api/resumes");
      if (response.ok) {
        const data = await response.json();
        setResumes(data.resumes?.filter((r: Resume) => r.status === "PARSED") || []);
      }
    } catch (error) {
      console.error("Failed to load resumes:", error);
    }
  };

  const loadEvaluations = async () => {
    try {
      const response = await fetch("/api/evaluations");
      if (response.ok) {
        const data = await response.json();
        setEvaluations(data.evaluations || []);
      }
    } catch (error) {
      console.error("Failed to load evaluations:", error);
    }
  };

  const handleSingleEvaluation = async () => {
    if (!selectedJob || selectedResumes.length !== 1) return;

    setLoading(true);
    try {
      const response = await fetch("/api/evaluations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: selectedJob,
          resumeId: selectedResumes[0],
        }),
      });

      if (response.ok) {
        const result = await response.json();
        await loadEvaluations();
        setSelectedEvaluation(result.evaluation.id);
        setActiveTab("results");
      } else {
        const error = await response.json();
        alert(`评估失败：${error.error}`);
      }
    } catch (error) {
      console.error("Evaluation error:", error);
      alert("创建评估失败");
    } finally {
      setLoading(false);
    }
  };

  const handleBatchEvaluation = async () => {
    if (!selectedJob || selectedResumes.length === 0) return;

    setLoading(true);
    try {
      const response = await fetch("/api/evaluations/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: selectedJob,
          resumeIds: selectedResumes,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setBatchResults(result);
        await loadEvaluations();
        setActiveTab("batch-results");
      } else {
        const error = await response.json();
        alert(`批量评估失败：${error.error}`);
      }
    } catch (error) {
      console.error("Batch evaluation error:", error);
      alert("批量评估处理失败");
    } finally {
      setLoading(false);
    }
  };

  const filteredEvaluations = evaluations.filter(evaluation => {
    const matchesSearch = 
      evaluation.resume.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evaluation.job.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || evaluation.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const formatScore = (score: number) => `${Math.round(score * 100)}%`;

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return "text-green-600";
    if (score >= 0.6) return "text-yellow-600";
    if (score >= 0.4) return "text-orange-600";
    return "text-red-600";
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="overview">概览</TabsTrigger>
        <TabsTrigger value="create">创建评估</TabsTrigger>
        <TabsTrigger value="results">结果</TabsTrigger>
        <TabsTrigger value="batch-results">批量结果</TabsTrigger>
        <TabsTrigger value="analytics">分析</TabsTrigger>
      </TabsList>

      {/* Overview Tab */}
      <TabsContent value="overview" className="space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium">总评估数</span>
              </div>
              <div className="text-2xl font-bold mt-2">{evaluations.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium">活跃职位</span>
              </div>
              <div className="text-2xl font-bold mt-2">
                {jobs.filter(j => j.status === "ACTIVE").length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                <span className="text-sm font-medium">平均分数</span>
              </div>
              <div className="text-2xl font-bold mt-2">
                {evaluations.length > 0 
                  ? formatScore(evaluations.reduce((sum, e) => sum + e.overallScore, 0) / evaluations.length)
                  : "0%"
                }
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-yellow-600" />
                <span className="text-sm font-medium">推荐</span>
              </div>
              <div className="text-2xl font-bold mt-2">
                {evaluations.filter(e => e.overallScore >= 0.6).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Evaluations */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>最近评估</CardTitle>
              <div className="flex gap-2">
                <Input
                  placeholder="搜索候选人或职位..."
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">所有状态</SelectItem>
                    <SelectItem value="PENDING">待处理</SelectItem>
                    <SelectItem value="COMPLETED">已完成</SelectItem>
                    <SelectItem value="REVIEWED">已审查</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredEvaluations.slice(0, 10).map((evaluation) => (
                <div
                  key={evaluation.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => {
                    setSelectedEvaluation(evaluation.id);
                    setActiveTab("results");
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <h4 className="font-medium">{evaluation.resume.candidateName}</h4>
                      <p className="text-sm text-muted-foreground">
                        {evaluation.job.title} • {evaluation.evaluatedBy.name}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className={`text-lg font-semibold ${getScoreColor(evaluation.overallScore)}`}>
                      {formatScore(evaluation.overallScore)}
                    </div>
                    <Badge variant="outline">{evaluation.status}</Badge>
                    <div className="text-sm text-muted-foreground">
                      {new Date(evaluation.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Create Evaluation Tab */}
      <TabsContent value="create" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>创建新评估</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Job Selection */}
            <div>
              <label className="text-sm font-medium mb-2 block">选择职位</label>
              <Select value={selectedJob} onValueChange={setSelectedJob}>
                <SelectTrigger>
                  <SelectValue placeholder="选择一个职位" />
                </SelectTrigger>
                <SelectContent>
                  {jobs.filter(j => j.status === "ACTIVE").map((job) => (
                    <SelectItem key={job.id} value={job.id}>
                      {job.title} {job.department && `• ${job.department}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Resume Selection */}
            <div>
              <label className="text-sm font-medium mb-2 block">选择候选人</label>
              <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
                {resumes.map((resume) => (
                  <div key={resume.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
                    <input
                      type="checkbox"
                      checked={selectedResumes.includes(resume.id)}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        if (e.target.checked) {
                          setSelectedResumes([...selectedResumes, resume.id]);
                        } else {
                          setSelectedResumes(selectedResumes.filter(id => id !== resume.id));
                        }
                      }}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{resume.candidateName}</div>
                      <div className="text-sm text-muted-foreground">{resume.candidateEmail}</div>
                    </div>
                    <Badge variant="outline">{resume.status}</Badge>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                已选择 {selectedResumes.length} 名候选人
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleSingleEvaluation}
                disabled={!selectedJob || selectedResumes.length !== 1 || loading}
                className="flex items-center gap-2"
              >
                <Brain className="h-4 w-4" />
                {loading ? "处理中..." : "单个评估"}
              </Button>
              
              <Button
                onClick={handleBatchEvaluation}
                disabled={!selectedJob || selectedResumes.length === 0 || loading}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Zap className="h-4 w-4" />
                {loading ? "处理中..." : `批量评估 (${selectedResumes.length})`}
              </Button>
            </div>

            {selectedJob && selectedResumes.length > 0 && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">评估预览</h4>
                <p className="text-sm text-muted-foreground">
                  职位：<strong>{jobs.find(j => j.id === selectedJob)?.title}</strong>
                </p>
                <p className="text-sm text-muted-foreground">
                  候选人：<strong>{selectedResumes.length}</strong>
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  AI将根据职位要求分析每个候选人，
                  考虑技能、经验、教育背景和文化契合度。
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Results Tab */}
      <TabsContent value="results">
        {selectedEvaluation ? (
          <EvaluationResultView evaluationId={selectedEvaluation} />
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">
                从概览中选择一个评估来查看详细结果。
              </p>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      {/* Batch Results Tab */}
      <TabsContent value="batch-results">
        {batchResults ? (
          <BatchEvaluationSummary
            job={batchResults.job}
            summary={batchResults.summary}
            candidates={batchResults.candidates}
            onViewCandidate={(candidateId: string) => {
              // Find evaluation for this candidate
              const evaluation = evaluations.find(e => e.resume.id === candidateId);
              if (evaluation) {
                setSelectedEvaluation(evaluation.id);
                setActiveTab("results");
              }
            }}
            onExportResults={() => {
              // Export functionality
              const dataStr = JSON.stringify(batchResults, null, 2);
              const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
              const exportFileDefaultName = `batch-evaluation-${batchResults.job.title}-${new Date().toISOString().split('T')[0]}.json`;
              
              const linkElement = document.createElement('a');
              linkElement.setAttribute('href', dataUri);
              linkElement.setAttribute('download', exportFileDefaultName);
              linkElement.click();
            }}
          />
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">
                运行批量评估以查看综合结果和分析。
              </p>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      {/* Analytics Tab */}
      <TabsContent value="analytics">
        <Card>
          <CardHeader>
            <CardTitle>评估分析</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              分析仪表板即将推出...
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

// Component to display single evaluation result
function EvaluationResultView({ evaluationId }: { evaluationId: string }) {
  const [evaluation, setEvaluation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEvaluation = async () => {
      try {
        const response = await fetch(`/api/evaluations/${evaluationId}`);
        if (response.ok) {
          const data = await response.json();
          setEvaluation(data);
        }
      } catch (error) {
        console.error("Failed to load evaluation:", error);
      } finally {
        setLoading(false);
      }
    };

    void loadEvaluation();
  }, [evaluationId]);

  if (loading) {
    return <div className="text-center py-8">加载评估中...</div>;
  }

  if (!evaluation) {
    return <div className="text-center py-8 text-muted-foreground">未找到评估。</div>;
  }

  return (
    <EvaluationReport
      evaluation={evaluation}
      onUpdateStatus={async (status: string) => {
        try {
          const response = await fetch(`/api/evaluations/${evaluationId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
          });
          
          if (response.ok) {
            setEvaluation({ ...evaluation, status });
          }
        } catch (error) {
          console.error("Failed to update status:", error);
        }
      }}
    />
  );
}