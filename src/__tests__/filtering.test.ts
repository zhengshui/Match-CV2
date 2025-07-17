import { CandidateFilteringService } from "../lib/filtering";

// Mock Prisma client
jest.mock("../lib/db", () => ({
  db: {
    evaluation: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

// Mock data
const mockEvaluations = [
  {
    id: "eval1",
    overallScore: 0.85,
    skillsScore: 0.9,
    experienceScore: 0.8,
    educationScore: 0.8,
    culturalFitScore: 0.85,
    explanation: "Excellent candidate with strong technical skills",
    recommendation: "Highly Recommended",
    status: "COMPLETED",
    createdAt: new Date("2023-01-15"),
    job: {
      id: "job1",
      title: "Senior Developer",
      department: "Engineering",
      location: "San Francisco",
    },
    resume: {
      id: "resume1",
      candidateName: "John Doe",
      candidateEmail: "john@example.com",
      phone: "+1234567890",
      parsedData: JSON.stringify({
        skills: ["JavaScript", "React", "Node.js", "TypeScript"],
        experience: [
          {
            title: "Senior Developer",
            company: "Tech Corp",
            duration: "3 years"
          }
        ],
        education: [
          {
            degree: "Bachelor of Computer Science",
            university: "State University",
            year: "2019"
          }
        ]
      }),
      status: "PARSED",
      resumeTags: [
        {
          tag: {
            id: "tag1",
            name: "Top Candidate",
            category: "CUSTOM",
            color: "#10B981"
          }
        },
        {
          tag: {
            id: "tag2",
            name: "JavaScript",
            category: "SKILL",
            color: "#3B82F6"
          }
        }
      ]
    },
    evaluatedBy: {
      id: "user1",
      name: "Jane Smith",
      email: "jane@company.com"
    }
  },
  {
    id: "eval2",
    overallScore: 0.65,
    skillsScore: 0.7,
    experienceScore: 0.6,
    educationScore: 0.65,
    culturalFitScore: 0.6,
    explanation: "Good candidate with relevant experience",
    recommendation: "Recommended",
    status: "COMPLETED",
    createdAt: new Date("2023-01-14"),
    job: {
      id: "job1",
      title: "Senior Developer",
      department: "Engineering",
      location: "San Francisco",
    },
    resume: {
      id: "resume2",
      candidateName: "Jane Wilson",
      candidateEmail: "jane.wilson@example.com",
      phone: "+1987654321",
      parsedData: JSON.stringify({
        skills: ["Python", "Django", "PostgreSQL"],
        experience: [
          {
            title: "Backend Developer",
            company: "Data Corp",
            duration: "2 years"
          }
        ],
        education: [
          {
            degree: "Master of Computer Science",
            university: "Tech University",
            year: "2021"
          }
        ]
      }),
      status: "PARSED",
      resumeTags: [
        {
          tag: {
            id: "tag3",
            name: "Good Match",
            category: "CUSTOM",
            color: "#3B82F6"
          }
        },
        {
          tag: {
            id: "tag4",
            name: "Python",
            category: "SKILL",
            color: "#F59E0B"
          }
        }
      ]
    },
    evaluatedBy: {
      id: "user1",
      name: "Jane Smith",
      email: "jane@company.com"
    }
  },
  {
    id: "eval3",
    overallScore: 0.35,
    skillsScore: 0.4,
    experienceScore: 0.3,
    educationScore: 0.35,
    culturalFitScore: 0.3,
    explanation: "Limited relevant experience",
    recommendation: "Not Recommended",
    status: "COMPLETED",
    createdAt: new Date("2023-01-13"),
    job: {
      id: "job2",
      title: "Junior Developer",
      department: "Engineering",
      location: "Remote",
    },
    resume: {
      id: "resume3",
      candidateName: "Bob Johnson",
      candidateEmail: "bob@example.com",
      phone: "+1555666777",
      parsedData: JSON.stringify({
        skills: ["HTML", "CSS", "Basic JavaScript"],
        experience: [
          {
            title: "Intern",
            company: "Small Startup",
            duration: "6 months"
          }
        ],
        education: [
          {
            degree: "Associate Degree",
            university: "Community College",
            year: "2022"
          }
        ]
      }),
      status: "PARSED",
      resumeTags: [
        {
          tag: {
            id: "tag5",
            name: "Entry Level",
            category: "EXPERIENCE",
            color: "#EF4444"
          }
        },
        {
          tag: {
            id: "tag6",
            name: "Junior",
            category: "CUSTOM",
            color: "#F97316"
          }
        }
      ]
    },
    evaluatedBy: {
      id: "user1",
      name: "Jane Smith",
      email: "jane@company.com"
    }
  }
];

describe("CandidateFilteringService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("filterCandidates", () => {
    it("should return all candidates when no filters applied", async () => {
      const { db } = require("../lib/db");
      db.evaluation.findMany.mockResolvedValue(mockEvaluations);
      db.evaluation.count.mockResolvedValue(mockEvaluations.length);

      const result = await CandidateFilteringService.filterCandidates();

      expect(result.evaluations).toHaveLength(3);
      expect(result.pagination.total).toBe(3);
    });

    it("should filter by minimum score", async () => {
      const { db } = require("../lib/db");
      const filteredEvals = mockEvaluations.filter(e => e.overallScore >= 0.6);
      db.evaluation.findMany.mockResolvedValue(filteredEvals);
      db.evaluation.count.mockResolvedValue(filteredEvals.length);

      const result = await CandidateFilteringService.filterCandidates(
        undefined,
        { minScore: 0.6 }
      );

      expect(result.evaluations).toHaveLength(2);
      expect(db.evaluation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            overallScore: { gte: 0.6 }
          })
        })
      );
    });

    it("should filter by maximum score", async () => {
      const { db } = require("../lib/db");
      const filteredEvals = mockEvaluations.filter(e => e.overallScore <= 0.7);
      db.evaluation.findMany.mockResolvedValue(filteredEvals);
      db.evaluation.count.mockResolvedValue(filteredEvals.length);

      const result = await CandidateFilteringService.filterCandidates(
        undefined,
        { maxScore: 0.7 }
      );

      expect(result.evaluations).toHaveLength(2);
      expect(db.evaluation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            overallScore: { lte: 0.7 }
          })
        })
      );
    });

    it("should filter by score range", async () => {
      const { db } = require("../lib/db");
      const filteredEvals = mockEvaluations.filter(
        e => e.overallScore >= 0.4 && e.overallScore <= 0.8
      );
      db.evaluation.findMany.mockResolvedValue(filteredEvals);
      db.evaluation.count.mockResolvedValue(filteredEvals.length);

      const result = await CandidateFilteringService.filterCandidates(
        undefined,
        { minScore: 0.4, maxScore: 0.8 }
      );

      expect(result.evaluations).toHaveLength(1);
      expect(db.evaluation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            overallScore: { gte: 0.4, lte: 0.8 }
          })
        })
      );
    });

    it("should filter by job ID", async () => {
      const { db } = require("../lib/db");
      const filteredEvals = mockEvaluations.filter(e => e.job.id === "job1");
      db.evaluation.findMany.mockResolvedValue(filteredEvals);
      db.evaluation.count.mockResolvedValue(filteredEvals.length);

      const result = await CandidateFilteringService.filterCandidates("job1");

      expect(result.evaluations).toHaveLength(2);
      expect(db.evaluation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            jobId: "job1"
          })
        })
      );
    });

    it("should filter by status", async () => {
      const { db } = require("../lib/db");
      const filteredEvals = mockEvaluations.filter(e => e.status === "COMPLETED");
      db.evaluation.findMany.mockResolvedValue(filteredEvals);
      db.evaluation.count.mockResolvedValue(filteredEvals.length);

      const result = await CandidateFilteringService.filterCandidates(
        undefined,
        { status: ["COMPLETED"] }
      );

      expect(result.evaluations).toHaveLength(3);
      expect(db.evaluation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: { in: ["COMPLETED"] }
          })
        })
      );
    });

    it("should filter by department", async () => {
      const { db } = require("../lib/db");
      const filteredEvals = mockEvaluations.filter(e => e.job.department === "Engineering");
      db.evaluation.findMany.mockResolvedValue(filteredEvals);
      db.evaluation.count.mockResolvedValue(filteredEvals.length);

      const result = await CandidateFilteringService.filterCandidates(
        undefined,
        { department: "Engineering" }
      );

      expect(result.evaluations).toHaveLength(3);
      expect(db.evaluation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            job: expect.objectContaining({
              department: "Engineering"
            })
          })
        })
      );
    });

    it("should filter by date range", async () => {
      const { db } = require("../lib/db");
      const fromDate = new Date("2023-01-14");
      const toDate = new Date("2023-01-16");
      const filteredEvals = mockEvaluations.filter(
        e => e.createdAt >= fromDate && e.createdAt <= toDate
      );
      db.evaluation.findMany.mockResolvedValue(filteredEvals);
      db.evaluation.count.mockResolvedValue(filteredEvals.length);

      const result = await CandidateFilteringService.filterCandidates(
        undefined,
        { dateFrom: fromDate, dateTo: toDate }
      );

      expect(result.evaluations).toHaveLength(2);
      expect(db.evaluation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: { gte: fromDate, lte: toDate }
          })
        })
      );
    });

    it("should apply custom sorting", async () => {
      const { db } = require("../lib/db");
      db.evaluation.findMany.mockResolvedValue(mockEvaluations);
      db.evaluation.count.mockResolvedValue(mockEvaluations.length);

      await CandidateFilteringService.filterCandidates(
        undefined,
        {},
        { field: "skillsScore", direction: "asc" }
      );

      expect(db.evaluation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { skillsScore: "asc" }
        })
      );
    });

    it("should sort by candidate name", async () => {
      const { db } = require("../lib/db");
      db.evaluation.findMany.mockResolvedValue(mockEvaluations);
      db.evaluation.count.mockResolvedValue(mockEvaluations.length);

      await CandidateFilteringService.filterCandidates(
        undefined,
        {},
        { field: "candidateName", direction: "desc" }
      );

      expect(db.evaluation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { resume: { candidateName: "desc" } }
        })
      );
    });

    it("should apply pagination", async () => {
      const { db } = require("../lib/db");
      db.evaluation.findMany.mockResolvedValue(mockEvaluations.slice(0, 2));
      db.evaluation.count.mockResolvedValue(mockEvaluations.length);

      const result = await CandidateFilteringService.filterCandidates(
        undefined,
        {},
        { field: "overallScore", direction: "desc" },
        { page: 1, limit: 2 }
      );

      expect(result.evaluations).toHaveLength(2);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(2);
      expect(result.pagination.total).toBe(3);
      expect(result.pagination.totalPages).toBe(2);
      expect(result.pagination.hasNext).toBe(true);
      expect(result.pagination.hasPrev).toBe(false);

      expect(db.evaluation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 2,
          skip: 0
        })
      );
    });

    it("should handle second page pagination", async () => {
      const { db } = require("../lib/db");
      db.evaluation.findMany.mockResolvedValue([mockEvaluations[2]]);
      db.evaluation.count.mockResolvedValue(mockEvaluations.length);

      const result = await CandidateFilteringService.filterCandidates(
        undefined,
        {},
        { field: "overallScore", direction: "desc" },
        { page: 2, limit: 2 }
      );

      expect(result.pagination.page).toBe(2);
      expect(result.pagination.hasNext).toBe(false);
      expect(result.pagination.hasPrev).toBe(true);

      expect(db.evaluation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 2,
          skip: 2
        })
      );
    });

    it("should parse resume data and include tags", async () => {
      const { db } = require("../lib/db");
      db.evaluation.findMany.mockResolvedValue([mockEvaluations[0]]);
      db.evaluation.count.mockResolvedValue(1);

      const result = await CandidateFilteringService.filterCandidates();

      expect(result.evaluations[0].resume.parsedData).toEqual({
        skills: ["JavaScript", "React", "Node.js", "TypeScript"],
        experience: [
          {
            title: "Senior Developer",
            company: "Tech Corp",
            duration: "3 years"
          }
        ],
        education: [
          {
            degree: "Bachelor of Computer Science",
            university: "State University",
            year: "2019"
          }
        ]
      });

      expect(result.evaluations[0].resume.tags).toHaveLength(2);
      expect(result.evaluations[0].resume.tags[0]).toEqual({
        id: "tag1",
        name: "Top Candidate",
        category: "CUSTOM",
        color: "#10B981"
      });
    });

    it("should generate correct summary statistics", async () => {
      const { db } = require("../lib/db");
      db.evaluation.findMany.mockResolvedValue(mockEvaluations);
      db.evaluation.count.mockResolvedValue(mockEvaluations.length);

      const result = await CandidateFilteringService.filterCandidates();

      expect(result.summary.averageScore).toBeCloseTo(0.62, 2);
      expect(result.summary.topScore).toBe(0.85);
      expect(result.summary.scoreDistribution.excellent).toBe(1); // Score >= 0.8
      expect(result.summary.scoreDistribution.good).toBe(1); // Score 0.6-0.79
      expect(result.summary.scoreDistribution.fair).toBe(0); // Score 0.4-0.59
      expect(result.summary.scoreDistribution.poor).toBe(1); // Score < 0.4
    });

    it("should handle empty results", async () => {
      const { db } = require("../lib/db");
      db.evaluation.findMany.mockResolvedValue([]);
      db.evaluation.count.mockResolvedValue(0);

      const result = await CandidateFilteringService.filterCandidates();

      expect(result.evaluations).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
      expect(result.summary.averageScore).toBe(0);
      expect(result.summary.topScore).toBe(0);
      expect(result.summary.commonSkills).toHaveLength(0);
      expect(result.summary.topTags).toHaveLength(0);
    });
  });

  describe("getFilterOptions", () => {
    it("should return available filter options", async () => {
      const { db } = require("../lib/db");
      db.evaluation.findMany.mockResolvedValue(mockEvaluations);

      const options = await CandidateFilteringService.getFilterOptions();

      expect(options.departments).toContain("Engineering");
      expect(options.locations).toContain("San Francisco");
      expect(options.locations).toContain("Remote");
      expect(options.skills).toContain("JavaScript");
      expect(options.skills).toContain("Python");
      expect(options.tags).toContain("Top Candidate");
      expect(options.tags).toContain("Good Match");
      expect(options.scoreRange.min).toBe(0.35);
      expect(options.scoreRange.max).toBe(0.85);
    });

    it("should return filter options for specific job", async () => {
      const { db } = require("../lib/db");
      const jobSpecificEvals = mockEvaluations.filter(e => e.job.id === "job1");
      db.evaluation.findMany.mockResolvedValue(jobSpecificEvals);

      const options = await CandidateFilteringService.getFilterOptions("job1");

      expect(options.departments).toEqual(["Engineering"]);
      expect(options.locations).toEqual(["San Francisco"]);
    });

    it("should handle empty evaluations", async () => {
      const { db } = require("../lib/db");
      db.evaluation.findMany.mockResolvedValue([]);

      const options = await CandidateFilteringService.getFilterOptions();

      expect(options.departments).toHaveLength(0);
      expect(options.locations).toHaveLength(0);
      expect(options.skills).toHaveLength(0);
      expect(options.tags).toHaveLength(0);
      expect(options.scoreRange.min).toBe(0);
      expect(options.scoreRange.max).toBe(1);
    });
  });

  describe("advancedSearch", () => {
    it("should perform text search on candidate names", async () => {
      const { db } = require("../lib/db");
      db.evaluation.findMany.mockResolvedValue(mockEvaluations);
      db.evaluation.count.mockResolvedValue(mockEvaluations.length);

      const result = await CandidateFilteringService.advancedSearch("John");

      // Should find John Doe
      expect(result.evaluations.some(e => e.resume.candidateName === "John Doe")).toBe(true);
      expect(result.evaluations.some(e => e.resume.candidateName === "Jane Wilson")).toBe(false);
    });

    it("should perform text search on skills", async () => {
      const { db } = require("../lib/db");
      db.evaluation.findMany.mockResolvedValue(mockEvaluations);
      db.evaluation.count.mockResolvedValue(mockEvaluations.length);

      const result = await CandidateFilteringService.advancedSearch("JavaScript");

      // Should find candidates with JavaScript skills
      expect(result.evaluations.some(e => e.resume.candidateName === "John Doe")).toBe(true);
      expect(result.evaluations.some(e => e.resume.candidateName === "Jane Wilson")).toBe(false);
    });

    it("should combine search with filters", async () => {
      const { db } = require("../lib/db");
      db.evaluation.findMany.mockResolvedValue(mockEvaluations);
      db.evaluation.count.mockResolvedValue(mockEvaluations.length);

      const result = await CandidateFilteringService.advancedSearch(
        "Developer",
        undefined,
        { minScore: 0.6 }
      );

      // Should find high-scoring developers
      expect(result.evaluations.length).toBeGreaterThan(0);
      result.evaluations.forEach(evaluation => {
        expect(evaluation.overallScore).toBeGreaterThanOrEqual(0.6);
      });
    });

    it("should handle multiple search terms", async () => {
      const { db } = require("../lib/db");
      db.evaluation.findMany.mockResolvedValue(mockEvaluations);
      db.evaluation.count.mockResolvedValue(mockEvaluations.length);

      const result = await CandidateFilteringService.advancedSearch("John Developer");

      // Should find candidates matching either term
      expect(result.evaluations.some(e => e.resume.candidateName === "John Doe")).toBe(true);
    });

    it("should return empty results for non-matching search", async () => {
      const { db } = require("../lib/db");
      db.evaluation.findMany.mockResolvedValue(mockEvaluations);
      db.evaluation.count.mockResolvedValue(mockEvaluations.length);

      const result = await CandidateFilteringService.advancedSearch("NonExistentTerm");

      expect(result.evaluations).toHaveLength(0);
    });
  });

  describe("Error Handling", () => {
    it("should handle database errors gracefully", async () => {
      const { db } = require("../lib/db");
      db.evaluation.findMany.mockRejectedValue(new Error("Database connection failed"));

      await expect(
        CandidateFilteringService.filterCandidates()
      ).rejects.toThrow("Failed to filter candidates");
    });

    it("should handle invalid JSON in parsedData", async () => {
      const { db } = require("../lib/db");
      const invalidEval = {
        ...mockEvaluations[0],
        resume: {
          ...mockEvaluations[0].resume,
          parsedData: "invalid json"
        }
      };
      db.evaluation.findMany.mockResolvedValue([invalidEval]);
      db.evaluation.count.mockResolvedValue(1);

      const result = await CandidateFilteringService.filterCandidates();

      // Should handle gracefully and not include invalid data in summary
      expect(result.evaluations).toHaveLength(1);
      expect(result.summary.commonSkills).toHaveLength(0);
    });
  });
});