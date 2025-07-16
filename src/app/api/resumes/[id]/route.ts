import { type NextRequest, NextResponse } from "next/server";
import { auth } from "~/server/auth";
import { db } from "~/lib/db";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    const resume = await db.resume.findUnique({
      where: { id },
      include: {
        resumeTags: {
          include: {
            tag: true,
          },
        },
        evaluations: {
          include: {
            job: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!resume) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }

    return NextResponse.json({
      resume: {
        id: resume.id,
        candidateName: resume.candidateName,
        candidateEmail: resume.candidateEmail,
        phone: resume.phone,
        fileName: resume.fileName,
        fileType: resume.fileType,
        status: resume.status,
        rawContent: resume.rawContent,
        parsedData: JSON.parse(resume.parsedData) as unknown,
        createdAt: resume.createdAt,
        tags: resume.resumeTags.map((rt) => rt.tag),
        evaluations: resume.evaluations.map((evaluation) => ({
          id: evaluation.id,
          overallScore: evaluation.overallScore,
          skillsScore: evaluation.skillsScore,
          experienceScore: evaluation.experienceScore,
          educationScore: evaluation.educationScore,
          culturalFitScore: evaluation.culturalFitScore,
          explanation: evaluation.explanation,
          recommendation: evaluation.recommendation,
          status: evaluation.status,
          createdAt: evaluation.createdAt,
          job: {
            id: evaluation.job.id,
            title: evaluation.job.title,
            department: evaluation.job.department,
          },
        })),
      },
    });
  } catch (error) {
    console.error("Resume fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    const resume = await db.resume.findUnique({
      where: { id },
    });

    if (!resume) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }

    // Delete the resume (cascading deletes will handle related records)
    await db.resume.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Resume delete error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}