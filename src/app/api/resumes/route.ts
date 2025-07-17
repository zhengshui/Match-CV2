import { type NextRequest, NextResponse } from "next/server";
import { auth } from "~/server/auth";
import { db } from "~/lib/db";
import { AIResumeParser } from "~/lib/ai-resume-parser";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload PDF, Word document, or text file." },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size too large. Please upload files smaller than 10MB." },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Parse resume with AI
    let parsedData;
    let rawContent;
    
    try {
      // Use AI parser for both text extraction and parsing
      parsedData = await AIResumeParser.parseResume(buffer, file.type);
      
      // For raw content, we'll use a simplified text extraction
      // The AI parser handles the complex parsing internally
      rawContent = `Parsed with AI Resume Parser - ${file.name}`;
      
      // Ensure we have at least a name and email
      if (!parsedData.candidateName || !parsedData.candidateEmail) {
        return NextResponse.json(
          { error: "Could not extract candidate name or email from resume. Please ensure the resume contains this information." },
          { status: 400 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        { error: `Failed to parse resume: ${error instanceof Error ? error.message : "Unknown error"}` },
        { status: 400 }
      );
    }

    // Save to database
    const resume = await db.resume.create({
      data: {
        candidateName: parsedData.candidateName,
        candidateEmail: parsedData.candidateEmail,
        phone: parsedData.phone,
        rawContent,
        parsedData: JSON.stringify(parsedData),
        fileName: file.name,
        fileType: file.type,
        status: "PARSED",
        uploadedById: session.user.id,
      },
    });

    // Create tags for skills
    const skillTags = await Promise.all(
      parsedData.skills.slice(0, 10).map(async (skill) => {
        const tag = await db.tag.upsert({
          where: { name: skill },
          update: {},
          create: {
            name: skill,
            category: "SKILL",
            color: "#6b7280",
          },
        });
        return tag;
      })
    );

    // Link skills to resume
    await Promise.all(
      skillTags.map(async (tag) => {
        await db.resumeTag.create({
          data: {
            resumeId: resume.id,
            tagId: tag.id,
          },
        });
      })
    );

    return NextResponse.json({
      success: true,
      resume: {
        id: resume.id,
        candidateName: resume.candidateName,
        candidateEmail: resume.candidateEmail,
        phone: resume.phone,
        fileName: resume.fileName,
        status: resume.status,
        createdAt: resume.createdAt,
        parsedData: parsedData,
      },
    });
  } catch (error) {
    console.error("Resume upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
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
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "10");
    const search = searchParams.get("search");

    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { candidateName: { contains: search } },
            { candidateEmail: { contains: search } },
          ],
        }
      : {};

    const [resumes, total] = await Promise.all([
      db.resume.findMany({
        where,
        include: {
          resumeTags: {
            include: {
              tag: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      db.resume.count({ where }),
    ]);

    return NextResponse.json({
      resumes: resumes.map((resume) => ({
        id: resume.id,
        candidateName: resume.candidateName,
        candidateEmail: resume.candidateEmail,
        phone: resume.phone,
        fileName: resume.fileName,
        status: resume.status,
        createdAt: resume.createdAt,
        tags: resume.resumeTags.map((rt) => rt.tag),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
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