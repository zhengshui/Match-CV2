import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/server/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const evaluation = await db.evaluation.findUnique({
      where: { id },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            description: true,
            requirements: true,
            department: true,
            location: true,
            salaryRange: true,
          },
        },
        resume: {
          select: {
            id: true,
            candidateName: true,
            candidateEmail: true,
            phone: true,
            parsedData: true,
            fileName: true,
          },
          include: {
            resumeTags: {
              include: {
                tag: true,
              },
            },
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
    });

    if (!evaluation) {
      return NextResponse.json({ error: "Evaluation not found" }, { status: 404 });
    }

    // Parse resume data for additional details
    const parsedResume = JSON.parse(evaluation.resume.parsedData);

    const response = {
      ...evaluation,
      resume: {
        ...evaluation.resume,
        parsedData: parsedResume,
        tags: evaluation.resume.resumeTags.map(rt => rt.tag),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Evaluation fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch evaluation" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, recommendation } = body;

    // Validate status
    const validStatuses = ["PENDING", "COMPLETED", "FAILED", "REVIEWED"];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 }
      );
    }

    const evaluation = await db.evaluation.findUnique({
      where: { id },
    });

    if (!evaluation) {
      return NextResponse.json({ error: "Evaluation not found" }, { status: 404 });
    }

    const updatedEvaluation = await db.evaluation.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(recommendation && { recommendation }),
        updatedAt: new Date(),
      },
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
      },
    });

    return NextResponse.json(updatedEvaluation);
  } catch (error) {
    console.error("Evaluation update error:", error);
    return NextResponse.json(
      { error: "Failed to update evaluation" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const evaluation = await db.evaluation.findUnique({
      where: { id },
    });

    if (!evaluation) {
      return NextResponse.json({ error: "Evaluation not found" }, { status: 404 });
    }

    await db.evaluation.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Evaluation deleted successfully" });
  } catch (error) {
    console.error("Evaluation deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete evaluation" },
      { status: 500 }
    );
  }
}