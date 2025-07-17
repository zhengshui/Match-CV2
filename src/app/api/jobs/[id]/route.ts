import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "~/server/auth";
import { db } from "~/lib/db";
import { type EmploymentType, type JobStatus } from "@prisma/client";

const JobUpdateSchema = z.object({
  title: z.string().min(1, "Job title is required").optional(),
  description: z.string().min(10, "Job description must be at least 10 characters").optional(),
  requirements: z.string().min(10, "Job requirements must be at least 10 characters").optional(),
  department: z.string().optional(),
  location: z.string().optional(),
  employmentType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP", "FREELANCE"]).optional(),
  salaryRange: z.string().optional(),
  status: z.enum(["ACTIVE", "PAUSED", "CLOSED", "DRAFT"]).optional(),
  tags: z.array(z.string()).optional()
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    
    const job = await db.job.findUnique({
      where: {
        id,
        createdById: session.user.id
      },
      include: {
        jobTags: {
          include: {
            tag: true
          }
        },
        _count: {
          select: {
            evaluations: true
          }
        }
      }
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...job,
      tags: job.jobTags.map(jt => jt.tag),
      evaluationCount: job._count.evaluations
    });
  } catch (error) {
    console.error("Error fetching job:", error);
    return NextResponse.json(
      { error: "Failed to fetch job" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json() as Record<string, unknown>;
    const validation = JobUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.errors },
        { status: 400 }
      );
    }

    // Check if job exists and user owns it
    const existingJob = await db.job.findUnique({
      where: {
        id,
        createdById: session.user.id
      }
    });

    if (!existingJob) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const { tags, ...jobUpdateData } = validation.data;

    // Update the job
    await db.job.update({
      where: { id },
      data: {
        ...jobUpdateData,
        ...(jobUpdateData.employmentType && { employmentType: jobUpdateData.employmentType as EmploymentType }),
        ...(jobUpdateData.status && { status: jobUpdateData.status as JobStatus })
      }
    });

    // Handle tags if provided
    if (tags !== undefined) {
      // Remove existing job-tag relationships
      await db.jobTag.deleteMany({
        where: { jobId: id }
      });

      if (tags.length > 0) {
        // Create tags that don't exist
        const existingTags = await db.tag.findMany({
          where: {
            name: {
              in: tags
            }
          }
        });

        const existingTagNames = existingTags.map(tag => tag.name);
        const newTagNames = tags.filter(name => !existingTagNames.includes(name));

        const newTags = await Promise.all(
          newTagNames.map(name =>
            db.tag.create({
              data: {
                name,
                category: "SKILL"
              }
            })
          )
        );

        const allTags = [...existingTags, ...newTags];

        // Create new job-tag relationships
        await db.jobTag.createMany({
          data: allTags.map(tag => ({
            jobId: id,
            tagId: tag.id
          }))
        });
      }
    }

    // Fetch updated job with tags
    const jobWithTags = await db.job.findUnique({
      where: { id },
      include: {
        jobTags: {
          include: {
            tag: true
          }
        }
      }
    });

    return NextResponse.json({
      ...jobWithTags,
      tags: jobWithTags?.jobTags.map(jt => jt.tag) ?? []
    });
  } catch (error) {
    console.error("Error updating job:", error);
    return NextResponse.json(
      { error: "Failed to update job" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check if job exists and user owns it
    const existingJob = await db.job.findUnique({
      where: {
        id,
        createdById: session.user.id
      }
    });

    if (!existingJob) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Delete the job (cascading will handle related records)
    await db.job.delete({
      where: { id }
    });

    return NextResponse.json({ message: "Job deleted successfully" });
  } catch (error) {
    console.error("Error deleting job:", error);
    return NextResponse.json(
      { error: "Failed to delete job" },
      { status: 500 }
    );
  }
}