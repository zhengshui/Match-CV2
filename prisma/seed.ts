import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const adminPassword = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@matchcv2.com" },
    update: {},
    create: {
      email: "admin@matchcv2.com",
      name: "Admin User",
      password: adminPassword,
      role: "ADMIN",
    },
  });

  // Create recruiter user
  const recruiterPassword = await bcrypt.hash("recruiter123", 12);
  const recruiter = await prisma.user.upsert({
    where: { email: "recruiter@matchcv2.com" },
    update: {},
    create: {
      email: "recruiter@matchcv2.com",
      name: "John Recruiter",
      password: recruiterPassword,
      role: "RECRUITER",
    },
  });

  // Create sample tags
  const tags = await Promise.all([
    prisma.tag.upsert({
      where: { name: "JavaScript" },
      update: {},
      create: { name: "JavaScript", category: "SKILL", color: "#f7df1e" },
    }),
    prisma.tag.upsert({
      where: { name: "React" },
      update: {},
      create: { name: "React", category: "SKILL", color: "#61dafb" },
    }),
    prisma.tag.upsert({
      where: { name: "Node.js" },
      update: {},
      create: { name: "Node.js", category: "SKILL", color: "#339933" },
    }),
    prisma.tag.upsert({
      where: { name: "Python" },
      update: {},
      create: { name: "Python", category: "SKILL", color: "#3776ab" },
    }),
    prisma.tag.upsert({
      where: { name: "Senior" },
      update: {},
      create: { name: "Senior", category: "EXPERIENCE", color: "#6b7280" },
    }),
    prisma.tag.upsert({
      where: { name: "Remote" },
      update: {},
      create: { name: "Remote", category: "LOCATION", color: "#10b981" },
    }),
  ]);

  // Create sample job
  const job = await prisma.job.create({
    data: {
      title: "Senior Full Stack Developer",
      description: "We are looking for a senior full stack developer to join our team...",
      requirements: "5+ years of experience with React, Node.js, and modern web technologies",
      department: "Engineering",
      location: "Remote",
      employmentType: "FULL_TIME",
      salaryRange: "$80,000 - $120,000",
      status: "ACTIVE",
      createdById: recruiter.id,
      jobTags: {
        create: [
          { tagId: tags[0]!.id }, // JavaScript
          { tagId: tags[1]!.id }, // React
          { tagId: tags[2]!.id }, // Node.js
          { tagId: tags[4]!.id }, // Senior
          { tagId: tags[5]!.id }, // Remote
        ],
      },
    },
  });

  // Create sample resume
  const resume = await prisma.resume.create({
    data: {
      candidateName: "Jane Developer",
      candidateEmail: "jane@example.com",
      phone: "+1-555-0123",
      rawContent: "Jane Developer - Senior Full Stack Developer\n\nExperience:\n- 6 years React development\n- 4 years Node.js backend\n- JavaScript, TypeScript, Python",
      parsedData: JSON.stringify({
        skills: ["JavaScript", "React", "Node.js", "TypeScript", "Python"],
        experience: [
          {
            title: "Senior Full Stack Developer",
            company: "Tech Corp",
            duration: "2021-2024",
            technologies: ["React", "Node.js", "TypeScript"],
          },
        ],
        education: [
          {
            degree: "Bachelor of Computer Science",
            university: "Tech University",
            year: "2018",
          },
        ],
      }),
      fileName: "jane_developer_resume.pdf",
      fileType: "application/pdf",
      status: "PARSED",
      uploadedById: recruiter.id,
      resumeTags: {
        create: [
          { tagId: tags[0]!.id }, // JavaScript
          { tagId: tags[1]!.id }, // React
          { tagId: tags[2]!.id }, // Node.js
          { tagId: tags[4]!.id }, // Senior
        ],
      },
    },
  });

  // Create sample evaluation
  await prisma.evaluation.create({
    data: {
      overallScore: 8.5,
      skillsScore: 9.0,
      experienceScore: 8.5,
      educationScore: 7.5,
      culturalFitScore: 8.0,
      explanation: "Excellent candidate with strong technical skills and relevant experience. Skills perfectly match the job requirements.",
      recommendation: "Highly recommended for interview. Strong technical background with React and Node.js experience.",
      status: "COMPLETED",
      jobId: job.id,
      resumeId: resume.id,
      evaluatedById: recruiter.id,
    },
  });

  console.log("Database has been seeded successfully!");
  console.log("Admin user:", admin.email, "password: admin123");
  console.log("Recruiter user:", recruiter.email, "password: recruiter123");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });