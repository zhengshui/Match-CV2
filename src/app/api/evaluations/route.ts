import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { AIMatchingEngine } from "@/lib/ai";
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
    const { jobId, resumeId, weights } = body;

    if (!jobId || !resumeId) {
      return NextResponse.json(
        { error: "jobId and resumeId are required" },
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

    // Fetch resume details
    const resume = await db.resume.findUnique({
      where: { id: resumeId },
    });

    if (!resume) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }

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
      return NextResponse.json(
        { error: "Evaluation already exists for this job-resume pair" },
        { status: 409 }
      );
    }

    // Parse resume data
    const parsedResume: ParsedResume = JSON.parse(resume.parsedData);

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

    // Set scoring weights
    const scoringWeights: ScoringWeights = weights || {
      skills: 0.4,
      experience: 0.3,
      education: 0.2,
      culturalFit: 0.1,
    };

    // Perform AI evaluation
    const evaluation = await AIMatchingEngine.evaluateCandidate(
      parsedResume,
      jobRequirements,
      scoringWeights
    );

    // Store evaluation in database
    const savedEvaluation = await db.evaluation.create({
      data: {
        jobId,
        resumeId,
        evaluatedById: session.user.id,
        overallScore: evaluation.scores.overall,
        skillsScore: evaluation.scores.skills,
        experienceScore: evaluation.scores.experience,
        educationScore: evaluation.scores.education,
        culturalFitScore: evaluation.scores.culturalFit,
        explanation: evaluation.explanation,
        recommendation: evaluation.recommendation,
        status: "COMPLETED",
      },
    });

    // Create tags for this evaluation
    for (const tagName of evaluation.tags) {
      // Find or create tag
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

      // Associate tag with resume
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

    return NextResponse.json({
      evaluation: savedEvaluation,
      details: {
        strengths: evaluation.strengths,
        weaknesses: evaluation.weaknesses,
        missingSkills: evaluation.missingSkills,
        tags: evaluation.tags,
      },
    });
  } catch (error) {
    console.error("Evaluation creation error:", error);
    return NextResponse.json(
      { error: "Failed to create evaluation" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId");
    const resumeId = searchParams.get("resumeId");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = parseInt(searchParams.get("offset") || "0");

    const whereClause: any = {};

    if (jobId) {
      whereClause.jobId = jobId;
    }

    if (resumeId) {
      whereClause.resumeId = resumeId;
    }

    const evaluations = await db.evaluation.findMany({
      where: whereClause,
      include: {
        job: {
          select: {
            id: true,
            title: true,
            department: true,
          },
        },
        resume: {
          select: {
            id: true,
            candidateName: true,
            candidateEmail: true,
          },
        },
        evaluatedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        overallScore: "desc",
      },
      take: limit,
      skip: offset,
    });

    const total = await db.evaluation.count({
      where: whereClause,
    });

    return NextResponse.json({
      evaluations,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error("Evaluation fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch evaluations" },
      { status: 500 }
    );
  }
}