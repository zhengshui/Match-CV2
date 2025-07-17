"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  Users, 
  TrendingUp, 
  Star, 
  Filter,
  Download,
  Eye
} from "lucide-react";

interface ScoreDistribution {
  excellent: number;
  good: number;
  fair: number;
  poor: number;
}

interface BatchSummary {
  totalCandidates: number;
  filteredCandidates: number;
  averageScore: number;
  topScore: number;
  recommendedCount: number;
  scoreDistribution: ScoreDistribution;
}

interface RankedCandidate {
  resumeId: string;
  candidateName: string;
  candidateEmail: string;
  rank: number;
  scores: {
    overall: number;
    skills: number;
    experience: number;
    education: number;
    culturalFit?: number;
  };
  recommendation: string;
  tags: string[];
  strengths: string[];
  weaknesses: string[];
  missingSkills: string[];
}

interface JobInfo {
  id: string;
  title: string;
  department?: string;
}

interface BatchEvaluationSummaryProps {
  job: JobInfo;
  summary: BatchSummary;
  candidates: RankedCandidate[];
  onViewCandidate?: (candidateId: string) => void;
  onExportResults?: () => void;
  onApplyFilters?: () => void;
}

export function BatchEvaluationSummary({ 
  job, 
  summary, 
  candidates, 
  onViewCandidate,
  onExportResults,
  onApplyFilters 
}: BatchEvaluationSummaryProps) {
  const getScoreColor = (score: number) => {
    if (score >= 0.8) return "text-green-600 bg-green-50";
    if (score >= 0.6) return "text-yellow-600 bg-yellow-50";
    if (score >= 0.4) return "text-orange-600 bg-orange-50";
    return "text-red-600 bg-red-50";
  };

  const getRecommendationBadge = (recommendation: string) => {
    if (recommendation.toLowerCase().includes("highly recommended")) {
      return <Badge className="bg-green-100 text-green-800">强烈推荐</Badge>;
    }
    if (recommendation.toLowerCase().includes("recommended")) {
      return <Badge className="bg-blue-100 text-blue-800">推荐</Badge>;
    }
    if (recommendation.toLowerCase().includes("consider")) {
      return <Badge className="bg-yellow-100 text-yellow-800">考虑</Badge>;
    }
    return <Badge className="bg-red-100 text-red-800">不推荐</Badge>;
  };

  const formatScore = (score: number) => `${Math.round(score * 100)}%`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">
                批量评估结果
              </CardTitle>
              <p className="text-muted-foreground">
                {job.title} {job.department && `• ${job.department}`}
              </p>
            </div>
            <div className="flex gap-2">
              {onApplyFilters && (
                <Button variant="outline" onClick={onApplyFilters}>
                  <Filter className="h-4 w-4 mr-2" />
                  筛选
                </Button>
              )}
              {onExportResults && (
                <Button variant="outline" onClick={onExportResults}>
                  <Download className="h-4 w-4 mr-2" />
                  导出
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Summary Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium">候选人总数</span>
            </div>
            <div className="text-2xl font-bold mt-2">{summary.totalCandidates}</div>
            {summary.filteredCandidates !== summary.totalCandidates && (
              <div className="text-sm text-muted-foreground">
                {summary.filteredCandidates} 筛选后
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-600" />
              <span className="text-sm font-medium">平均分数</span>
            </div>
            <div className="text-2xl font-bold mt-2">{formatScore(summary.averageScore)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium">最高分数</span>
            </div>
            <div className="text-2xl font-bold mt-2">{formatScore(summary.topScore)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-medium">推荐</span>
            </div>
            <div className="text-2xl font-bold mt-2">{summary.recommendedCount}</div>
            <div className="text-sm text-muted-foreground">
              {Math.round((summary.recommendedCount / summary.filteredCandidates) * 100)}% 占总数
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 分数分布 */}
      <Card>
        <CardHeader>
          <CardTitle>分数分布</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{summary.scoreDistribution.excellent}</div>
              <div className="text-sm text-muted-foreground">优秀 (80%+)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{summary.scoreDistribution.good}</div>
              <div className="text-sm text-muted-foreground">良好 (60-79%)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{summary.scoreDistribution.fair}</div>
              <div className="text-sm text-muted-foreground">一般 (40-59%)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{summary.scoreDistribution.poor}</div>
              <div className="text-sm text-muted-foreground">较差 (&lt;40%)</div>
            </div>
          </div>
          
          {/* Visual Progress Bars */}
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm w-20">优秀</span>
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full" 
                  style={{ width: `${(summary.scoreDistribution.excellent / summary.filteredCandidates) * 100}%` }}
                />
              </div>
              <span className="text-sm w-8">{summary.scoreDistribution.excellent}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm w-20">良好</span>
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${(summary.scoreDistribution.good / summary.filteredCandidates) * 100}%` }}
                />
              </div>
              <span className="text-sm w-8">{summary.scoreDistribution.good}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm w-20">一般</span>
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-yellow-600 h-2 rounded-full" 
                  style={{ width: `${(summary.scoreDistribution.fair / summary.filteredCandidates) * 100}%` }}
                />
              </div>
              <span className="text-sm w-8">{summary.scoreDistribution.fair}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm w-20">较差</span>
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-red-600 h-2 rounded-full" 
                  style={{ width: `${(summary.scoreDistribution.poor / summary.filteredCandidates) * 100}%` }}
                />
              </div>
              <span className="text-sm w-8">{summary.scoreDistribution.poor}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Candidates */}
      <Card>
        <CardHeader>
          <CardTitle>候选人排名</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {candidates.slice(0, 10).map((candidate) => (
              <div
                key={candidate.resumeId}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="font-mono">
                      #{candidate.rank}
                    </Badge>
                    <div>
                      <h3 className="font-medium">{candidate.candidateName}</h3>
                      <p className="text-sm text-muted-foreground">{candidate.candidateEmail}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(candidate.scores.overall)}`}>
                      {formatScore(candidate.scores.overall)}
                    </div>
                    {onViewCandidate && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onViewCandidate(candidate.resumeId)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 mb-3">
                  <div className="text-center">
                    <div className="text-sm font-medium">{formatScore(candidate.scores.skills)}</div>
                    <div className="text-xs text-muted-foreground">Skills</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-medium">{formatScore(candidate.scores.experience)}</div>
                    <div className="text-xs text-muted-foreground">Experience</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-medium">{formatScore(candidate.scores.education)}</div>
                    <div className="text-xs text-muted-foreground">Education</div>
                  </div>
                  {candidate.scores.culturalFit && (
                    <div className="text-center">
                      <div className="text-sm font-medium">{formatScore(candidate.scores.culturalFit)}</div>
                      <div className="text-xs text-muted-foreground">文化匹配</div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {candidate.tags.slice(0, 3).map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {candidate.tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{candidate.tags.length - 3} 更多
                      </Badge>
                    )}
                  </div>
                  {getRecommendationBadge(candidate.recommendation)}
                </div>

                {/* Strengths and Weaknesses */}
                {(candidate.strengths.length > 0 || candidate.weaknesses.length > 0) && (
                  <div className="mt-3 pt-3 border-t space-y-2">
                    {candidate.strengths.length > 0 && (
                      <div>
                        <span className="text-xs font-medium text-green-600">优势：</span>
                        <span className="text-xs text-muted-foreground">
                          {candidate.strengths.slice(0, 2).join(", ")}
                          {candidate.strengths.length > 2 && "..."}
                        </span>
                      </div>
                    )}
                    {candidate.weaknesses.length > 0 && (
                      <div>
                        <span className="text-xs font-medium text-red-600">需要改进的方面：</span>
                        <span className="text-xs text-muted-foreground">
                          {candidate.weaknesses.slice(0, 2).join(", ")}
                          {candidate.weaknesses.length > 2 && "..."}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {candidates.length > 10 && (
            <div className="mt-4 text-center">
              <Button variant="outline">
                View All {candidates.length} Candidates
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}