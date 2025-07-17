import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "~/server/auth";
import { db } from "~/lib/db";
import { type EmploymentType, type JobStatus } from "@prisma/client";

const JobCreateSchema = z.object({
  title: z.string().min(1, "Job title is required"),
  description: z.string().min(10, "Job description must be at least 10 characters"),
  requirements: z.string().min(10, "Job requirements must be at least 10 characters"),
  department: z.string().optional(),
  location: z.string().optional(),
  employmentType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP", "FREELANCE"]),
  salaryRange: z.string().optional(),
  status: z.enum(["ACTIVE", "PAUSED", "CLOSED", "DRAFT"]).default("DRAFT"),
  tags: z.array(z.string()).optional()
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as JobStatus | null;
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "10");
    const skip = (page - 1) * limit;

    const whereClause = {
      createdById: session.user.id,
      ...(status && { status })
    };

    const [jobs, total] = await Promise.all([
      db.job.findMany({
        where: whereClause,
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
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit
      }),
      db.job.count({ where: whereClause })
    ]);

    const jobsWithTags = jobs.map(job => ({
      ...job,
      tags: job.jobTags.map(jt => jt.tag),
      evaluationCount: job._count.evaluations
    }));

    return NextResponse.json({
      jobs: jobsWithTags,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return NextResponse.json(
      { error: "Failed to fetch jobs" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json() as Record<string, unknown>;
    const validation = JobCreateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { tags, ...jobData } = validation.data;

    // Create the job
    const job = await db.job.create({
      data: {
        ...jobData,
        employmentType: jobData.employmentType as EmploymentType,
        status: jobData.status as JobStatus,
        createdById: session.user.id
      },
      include: {
        jobTags: {
          include: {
            tag: true
          }
        }
      }
    });

    // Handle tags if provided
    if (tags && tags.length > 0) {
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
              category: "SKILL" // Default category
            }
          })
        )
      );

      const allTags = [...existingTags, ...newTags];

      // Create job-tag relationships
      await db.jobTag.createMany({
        data: allTags.map(tag => ({
          jobId: job.id,
          tagId: tag.id
        }))
      });

      // Fetch the job with tags
      const jobWithTags = await db.job.findUnique({
        where: { id: job.id },
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
    }

    return NextResponse.json({
      ...job,
      tags: job.jobTags.map(jt => jt.tag)
    });
  } catch (error) {
    console.error("Error creating job:", error);
    return NextResponse.json(
      { error: "Failed to create job" },
      { status: 500 }
    );
  }
}