"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  User, 
  Mail, 
  Phone, 
  Building2, 
  MapPin, 
  Star, 
  TrendingUp, 
  TrendingDown,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";

interface EvaluationScore {
  overall: number;
  skills: number;
  experience: number;
  education: number;
  culturalFit?: number;
}

interface EvaluationData {
  id: string;
  scores: EvaluationScore;
  explanation: string;
  recommendation: string;
  status: string;
  createdAt: string;
  job: {
    id: string;
    title: string;
    department?: string;
    location?: string;
  };
  resume: {
    id: string;
    candidateName: string;
    candidateEmail: string;
    phone?: string;
    parsedData: {
      candidateName: string;
      candidateEmail: string;
      phone?: string;
      skills: string[];
      experience: Array<{
        title: string;
        company: string;
        duration: string;
        description?: string;
      }>;
      education: Array<{
        degree: string;
        university: string;
        year: string;
      }>;
      summary?: string;
    };
    tags: Array<{
      id: string;
      name: string;
      color?: string;
      category: string;
    }>;
  };
  evaluatedBy: {
    id: string;
    name: string;
    email: string;
  };
}

interface EvaluationReportProps {
  evaluation: EvaluationData;
  onUpdateStatus?: (status: string) => void;
  onClose?: () => void;
}

export function EvaluationReport({ evaluation, onUpdateStatus, onClose }: EvaluationReportProps) {
  const getScoreColor = (score: number) => {
    if (score >= 0.8) return "text-green-600";
    if (score >= 0.6) return "text-yellow-600";
    if (score >= 0.4) return "text-orange-600";
    return "text-red-600";
  };

  const getScoreIcon = (score: number) => {
    if (score >= 0.8) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (score >= 0.6) return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    return <XCircle className="h-4 w-4 text-red-600" />;
  };

  const getRecommendationColor = (recommendation: string) => {
    if (recommendation.toLowerCase().includes("highly recommended")) return "bg-green-100 text-green-800";
    if (recommendation.toLowerCase().includes("recommended")) return "bg-blue-100 text-blue-800";
    if (recommendation.toLowerCase().includes("consider")) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const formatScore = (score: number) => `${Math.round(score * 100)}%`;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">
                Evaluation Report
              </CardTitle>
              <p className="text-muted-foreground">
                {evaluation.resume.candidateName} for {evaluation.job.title}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-lg px-3 py-1">
                Overall Score: {formatScore(evaluation.scores.overall)}
              </Badge>
              {onClose && (
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Overall Recommendation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Recommendation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Badge className={`text-base px-4 py-2 ${getRecommendationColor(evaluation.recommendation)}`}>
            {evaluation.recommendation}
          </Badge>
          <p className="mt-4 text-sm text-muted-foreground">
            {evaluation.explanation}
          </p>
        </CardContent>
      </Card>

      {/* Score Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Score Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {getScoreIcon(evaluation.scores.skills)}
                <span className="text-sm font-medium">Skills</span>
              </div>
              <div className={`text-2xl font-bold ${getScoreColor(evaluation.scores.skills)}`}>
                {formatScore(evaluation.scores.skills)}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {getScoreIcon(evaluation.scores.experience)}
                <span className="text-sm font-medium">Experience</span>
              </div>
              <div className={`text-2xl font-bold ${getScoreColor(evaluation.scores.experience)}`}>
                {formatScore(evaluation.scores.experience)}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {getScoreIcon(evaluation.scores.education)}
                <span className="text-sm font-medium">Education</span>
              </div>
              <div className={`text-2xl font-bold ${getScoreColor(evaluation.scores.education)}`}>
                {formatScore(evaluation.scores.education)}
              </div>
            </div>
            
            {evaluation.scores.culturalFit && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {getScoreIcon(evaluation.scores.culturalFit)}
                  <span className="text-sm font-medium">Cultural Fit</span>
                </div>
                <div className={`text-2xl font-bold ${getScoreColor(evaluation.scores.culturalFit)}`}>
                  {formatScore(evaluation.scores.culturalFit)}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Candidate Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Candidate Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4" />
                <span className="font-medium">{evaluation.resume.candidateName}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4" />
                <span>{evaluation.resume.candidateEmail}</span>
              </div>
              {evaluation.resume.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4" />
                  <span>{evaluation.resume.phone}</span>
                </div>
              )}
            </div>

            {/* Tags */}
            {evaluation.resume.tags.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Tags</h4>
                <div className="flex flex-wrap gap-1">
                  {evaluation.resume.tags.map((tag) => (
                    <Badge key={tag.id} variant="secondary" className="text-xs">
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Summary */}
            {evaluation.resume.parsedData.summary && (
              <div>
                <h4 className="text-sm font-medium mb-2">Summary</h4>
                <p className="text-sm text-muted-foreground">
                  {evaluation.resume.parsedData.summary}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Job Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Position Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4" />
                <span className="font-medium">{evaluation.job.title}</span>
              </div>
              {evaluation.job.department && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">Department:</span>
                  <span>{evaluation.job.department}</span>
                </div>
              )}
              {evaluation.job.location && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4" />
                  <span>{evaluation.job.location}</span>
                </div>
              )}
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">Evaluation Details</h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>Evaluated by: {evaluation.evaluatedBy.name}</p>
                <p>Date: {new Date(evaluation.createdAt).toLocaleDateString()}</p>
                <p>Status: <Badge variant="outline">{evaluation.status}</Badge></p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Skills */}
      <Card>
        <CardHeader>
          <CardTitle>Skills</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {evaluation.resume.parsedData.skills.map((skill, index) => (
              <Badge key={index} variant="outline">
                {skill}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Experience */}
      <Card>
        <CardHeader>
          <CardTitle>Work Experience</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {evaluation.resume.parsedData.experience.map((exp, index) => (
              <div key={index} className="border-l-2 border-gray-200 pl-4">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium">{exp.title}</h4>
                  <span className="text-sm text-muted-foreground">at {exp.company}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{exp.duration}</p>
                {exp.description && (
                  <p className="text-sm">{exp.description}</p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Education */}
      <Card>
        <CardHeader>
          <CardTitle>Education</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {evaluation.resume.parsedData.education.map((edu, index) => (
              <div key={index} className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">{edu.degree}</h4>
                  <p className="text-sm text-muted-foreground">{edu.university}</p>
                </div>
                <Badge variant="outline">{edu.year}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Status Update Actions */}
      {onUpdateStatus && (
        <Card>
          <CardHeader>
            <CardTitle>Update Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => onUpdateStatus("REVIEWED")}
                disabled={evaluation.status === "REVIEWED"}
              >
                Mark as Reviewed
              </Button>
              <Button 
                variant="outline" 
                onClick={() => onUpdateStatus("PENDING")}
                disabled={evaluation.status === "PENDING"}
              >
                Mark as Pending
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}