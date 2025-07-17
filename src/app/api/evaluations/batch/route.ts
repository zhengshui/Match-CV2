import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { BatchProcessor } from "@/lib/ai";
import type { ScoringWeights } from "@/lib/ai";
import type { ParsedResume } from "@/lib/resume-parser";
import { auth } from "@/server/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { jobId, resumeIds, weights, filters } = body;

    if (!jobId || !resumeIds || !Array.isArray(resumeIds)) {
      return NextResponse.json(
        { error: "jobId and resumeIds array are required" },
        { status: 400 }
      );
    }

    // Fetch job details
    const job = await db.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Fetch resumes
    const resumes = await db.resume.findMany({
      where: {
        id: { in: resumeIds },
        status: "PARSED",
      },
    });

    if (resumes.length === 0) {
      return NextResponse.json(
        { error: "No valid parsed resumes found" },
        { status: 404 }
      );
    }

    // Prepare job requirements
    const jobRequirements = {
      id: job.id,
      title: job.title,
      description: job.description,
      requirements: job.requirements,
      department: job.department ?? undefined,
      location: job.location ?? undefined,
      salaryRange: job.salaryRange ?? undefined,
    };

    // Parse resume data
    const parsedResumes: ParsedResume[] = resumes.map(resume => ({
      ...JSON.parse(resume.parsedData),
      id: resume.id, // Add resume ID for tracking
    }));

    // Set scoring weights
    const scoringWeights: ScoringWeights = weights || {
      skills: 0.4,
      experience: 0.3,
      education: 0.2,
      culturalFit: 0.1,
    };

    // Process all candidates
    const results = await BatchProcessor.processCandidates(
      parsedResumes,
      jobRequirements,
      scoringWeights
    );

    // Apply filters if provided
    let filteredResults = results;
    if (filters) {
      filteredResults = BatchProcessor.filterCandidates(results, filters);
    }

    // Store evaluations in database (only if they don't exist)
    const evaluationPromises = filteredResults.map(async (result, index) => {
      const resumeId = resumes[index]?.id;
      if (!resumeId) return null;

      // Check if evaluation already exists
      const existingEvaluation = await db.evaluation.findUnique({
        where: {
          jobId_resumeId: {
            jobId,
            resumeId,
          },
        },
      });

      if (existingEvaluation) {
        return existingEvaluation;
      }

      // Create new evaluation
      const savedEvaluation = await db.evaluation.create({
        data: {
          jobId,
          resumeId,
          evaluatedById: session.user.id,
          overallScore: result.scores.overall,
          skillsScore: result.scores.skills,
          experienceScore: result.scores.experience,
          educationScore: result.scores.education,
          culturalFitScore: result.scores.culturalFit,
          explanation: result.explanation,
          recommendation: result.recommendation,
          status: "COMPLETED",
        },
      });

      // Create tags for this evaluation
      for (const tagName of result.tags) {
        let tag = await db.tag.findFirst({
          where: { name: tagName },
        });

        if (!tag) {
          tag = await db.tag.create({
            data: {
              name: tagName,
              category: "CUSTOM",
            },
          });
        }

        await db.resumeTag.upsert({
          where: {
            resumeId_tagId: {
              resumeId,
              tagId: tag.id,
            },
          },
          update: {},
          create: {
            resumeId,
            tagId: tag.id,
          },
        });
      }

      return savedEvaluation;
    });

    const savedEvaluations = await Promise.all(evaluationPromises);

    // Prepare response with ranking and recommendations
    const rankedCandidates = filteredResults.map((result, index) => {
      const resume = resumes.find(r => r.id === result.candidateId) || resumes[index];
      return {
        resumeId: resume?.id,
        candidateName: resume?.candidateName,
        candidateEmail: resume?.candidateEmail,
        rank: index + 1,
        scores: result.scores,
        recommendation: result.recommendation,
        tags: result.tags,
        strengths: result.strengths,
        weaknesses: result.weaknesses,
        missingSkills: result.missingSkills,
      };
    });

    // Generate summary statistics
    const summary = {
      totalCandidates: results.length,
      filteredCandidates: filteredResults.length,
      averageScore: filteredResults.reduce((sum, r) => sum + r.scores.overall, 0) / filteredResults.length,
      topScore: filteredResults[0]?.scores.overall || 0,
      recommendedCount: filteredResults.filter(r => r.scores.overall >= 0.6).length,
      scoreDistribution: {
        excellent: filteredResults.filter(r => r.scores.overall >= 0.8).length,
        good: filteredResults.filter(r => r.scores.overall >= 0.6 && r.scores.overall < 0.8).length,
        fair: filteredResults.filter(r => r.scores.overall >= 0.4 && r.scores.overall < 0.6).length,
        poor: filteredResults.filter(r => r.scores.overall < 0.4).length,
      },
    };

    return NextResponse.json({
      job: {
        id: job.id,
        title: job.title,
        department: job.department,
      },
      summary,
      candidates: rankedCandidates,
      evaluations: savedEvaluations.filter(Boolean),
    });
  } catch (error) {
    console.error("Batch evaluation error:", error);
    return NextResponse.json(
      { error: "Failed to process batch evaluation" },
      { status: 500 }
    );
  }
}