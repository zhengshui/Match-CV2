import { AIMatchingEngine, BatchProcessor } from "../lib/ai";
import { ParsedResume } from "../lib/resume-parser";

// Mock data for testing
const mockResume: ParsedResume = {
  candidateName: "John Doe",
  candidateEmail: "john.doe@email.com",
  phone: "+1234567890",
  skills: [
    "JavaScript", "TypeScript", "React", "Node.js", "Python", 
    "SQL", "AWS", "Docker", "Git", "Agile"
  ],
  experience: [
    {
      title: "Senior Software Engineer",
      company: "Tech Corp",
      duration: "2021-2023",
      description: "Led development of web applications using React and Node.js",
      technologies: ["React", "Node.js", "TypeScript"]
    },
    {
      title: "Software Engineer",
      company: "StartupXYZ",
      duration: "2019-2021",
      description: "Developed REST APIs and managed cloud infrastructure",
      technologies: ["Python", "AWS", "Docker"]
    }
  ],
  education: [
    {
      degree: "Bachelor of Computer Science",
      university: "State University",
      year: "2019",
      gpa: "3.8"
    }
  ],
  summary: "Experienced software engineer with strong background in full-stack development",
  certifications: ["AWS Certified Developer"],
  languages: ["English", "Spanish"],
  location: "San Francisco, CA"
};

const mockJob = {
  id: "job1",
  title: "Full Stack Developer",
  description: "We are looking for a Full Stack Developer with experience in React, Node.js, and cloud technologies.",
  requirements: "Required: JavaScript, React, Node.js, 3+ years experience. Preferred: TypeScript, AWS, Docker",
  department: "Engineering",
  location: "San Francisco, CA",
  salaryRange: "$100k-150k"
};

describe("AIMatchingEngine", () => {
  describe("calculateSkillsScore", () => {
    it("should return high score for exact skill matches", () => {
      const candidateSkills = ["JavaScript", "React", "Node.js", "TypeScript"];
      const requiredSkills = ["JavaScript", "React", "Node.js"];
      
      const score = AIMatchingEngine.calculateSkillsScore(candidateSkills, requiredSkills);
      
      expect(score).toBeGreaterThan(0.9);
    });

    it("should return lower score for partial skill matches", () => {
      const candidateSkills = ["JavaScript", "Vue.js", "Python"];
      const requiredSkills = ["JavaScript", "React", "Node.js"];
      
      const score = AIMatchingEngine.calculateSkillsScore(candidateSkills, requiredSkills);
      
      expect(score).toBeLessThan(0.7);
      expect(score).toBeGreaterThan(0.2);
    });

    it("should return default score when no required skills", () => {
      const candidateSkills = ["JavaScript", "React"];
      const requiredSkills: string[] = [];
      
      const score = AIMatchingEngine.calculateSkillsScore(candidateSkills, requiredSkills);
      
      expect(score).toBe(0.8);
    });

    it("should handle case insensitive matching", () => {
      const candidateSkills = ["javascript", "REACT", "Node.JS"];
      const requiredSkills = ["JavaScript", "React", "Node.js"];
      
      const score = AIMatchingEngine.calculateSkillsScore(candidateSkills, requiredSkills);
      
      expect(score).toBeGreaterThan(0.9);
    });

    it("should give partial credit for related skills", () => {
      const candidateSkills = ["ReactJS", "NodeJS"];
      const requiredSkills = ["React", "Node.js"];
      
      const score = AIMatchingEngine.calculateSkillsScore(candidateSkills, requiredSkills);
      
      expect(score).toBeGreaterThan(0.5);
    });
  });

  describe("calculateExperienceScore", () => {
    it("should return high score for relevant experience", () => {
      const experience = mockResume.experience;
      
      const score = AIMatchingEngine.calculateExperienceScore(experience);
      
      expect(score).toBeGreaterThan(0.7);
    });

    it("should return low score for no experience", () => {
      const experience: ParsedResume['experience'] = [];
      
      const score = AIMatchingEngine.calculateExperienceScore(experience);
      
      expect(score).toBe(0.2);
    });

    it("should consider required years of experience", () => {
      const experience = mockResume.experience;
      const scoreWith3Years = AIMatchingEngine.calculateExperienceScore(experience, 3);
      const scoreWith10Years = AIMatchingEngine.calculateExperienceScore(experience, 10);
      
      expect(scoreWith3Years).toBeGreaterThan(scoreWith10Years);
    });

    it("should consider role relevance", () => {
      const experience = mockResume.experience;
      const scoreWithRelevantRoles = AIMatchingEngine.calculateExperienceScore(
        experience, 
        undefined, 
        ["Software Engineer", "Developer"]
      );
      const scoreWithIrrelevantRoles = AIMatchingEngine.calculateExperienceScore(
        experience, 
        undefined, 
        ["Marketing Manager", "Sales Rep"]
      );
      
      expect(scoreWithRelevantRoles).toBeGreaterThan(scoreWithIrrelevantRoles);
    });
  });

  describe("calculateEducationScore", () => {
    it("should return high score for relevant education", () => {
      const education = mockResume.education;
      
      const score = AIMatchingEngine.calculateEducationScore(education);
      
      expect(score).toBeGreaterThan(0.6);
    });

    it("should return default score for no education", () => {
      const education: ParsedResume['education'] = [];
      
      const score = AIMatchingEngine.calculateEducationScore(education);
      
      expect(score).toBe(0.3);
    });

    it("should consider required degree level", () => {
      const education = mockResume.education;
      const scoreWithBachelor = AIMatchingEngine.calculateEducationScore(education, "Bachelor");
      const scoreWithPhD = AIMatchingEngine.calculateEducationScore(education, "PhD");
      
      expect(scoreWithBachelor).toBeGreaterThan(scoreWithPhD);
    });

    it("should consider field relevance", () => {
      const education = mockResume.education;
      const scoreWithRelevantField = AIMatchingEngine.calculateEducationScore(
        education, 
        undefined, 
        ["Computer Science", "Engineering"]
      );
      const scoreWithIrrelevantField = AIMatchingEngine.calculateEducationScore(
        education, 
        undefined, 
        ["Art", "Literature"]
      );
      
      expect(scoreWithRelevantField).toBeGreaterThan(scoreWithIrrelevantField);
    });
  });

  describe("calculateCulturalFitScore", () => {
    it("should return reasonable score for cultural fit assessment", () => {
      const score = AIMatchingEngine.calculateCulturalFitScore(
        mockResume,
        "We value teamwork, innovation, and agile development"
      );
      
      expect(score).toBeGreaterThan(0.3);
      expect(score).toBeLessThanOrEqual(1.0);
    });

    it("should consider matching keywords", () => {
      const jobWithKeywords = "We are an agile team looking for innovative problem-solving";
      const jobWithoutKeywords = "This is a regular position with basic requirements";
      
      const scoreWithKeywords = AIMatchingEngine.calculateCulturalFitScore(mockResume, jobWithKeywords);
      const scoreWithoutKeywords = AIMatchingEngine.calculateCulturalFitScore(mockResume, jobWithoutKeywords);
      
      expect(scoreWithKeywords).toBeGreaterThanOrEqual(scoreWithoutKeywords);
    });
  });

  describe("extractRequiredSkills", () => {
    it("should extract common technical skills from job description", () => {
      const jobDescription = "We need a developer with JavaScript, React, and Node.js experience";
      const requirements = "Must have: Python, SQL, AWS";
      
      const skills = AIMatchingEngine.extractRequiredSkills(jobDescription, requirements);
      
      expect(skills).toContain("javascript");
      expect(skills).toContain("react");
      expect(skills).toContain("python");
      expect(skills).toContain("sql");
      expect(skills).toContain("aws");
    });

    it("should handle case insensitive extraction", () => {
      const jobDescription = "JAVASCRIPT and REACT developer needed";
      const requirements = "TypeScript, NODE.JS";
      
      const skills = AIMatchingEngine.extractRequiredSkills(jobDescription, requirements);
      
      expect(skills).toContain("javascript");
      expect(skills).toContain("react");
    });

    it("should extract skills from requirements text", () => {
      const requirements = "Experience with Git, Docker, Kubernetes, and microservices";
      
      const skills = AIMatchingEngine.extractRequiredSkills("", requirements);
      
      expect(skills).toContain("git");
      expect(skills).toContain("docker");
    });
  });

  describe("evaluateCandidate", () => {
    it("should return comprehensive evaluation result", async () => {
      const result = await AIMatchingEngine.evaluateCandidate(mockResume, mockJob);
      
      expect(result).toHaveProperty('scores');
      expect(result).toHaveProperty('explanation');
      expect(result).toHaveProperty('recommendation');
      expect(result).toHaveProperty('strengths');
      expect(result).toHaveProperty('weaknesses');
      expect(result).toHaveProperty('missingSkills');
      expect(result).toHaveProperty('tags');
      
      expect(result.scores.overall).toBeGreaterThan(0);
      expect(result.scores.overall).toBeLessThanOrEqual(1);
      expect(typeof result.explanation).toBe('string');
      expect(Array.isArray(result.strengths)).toBe(true);
      expect(Array.isArray(result.tags)).toBe(true);
    });

    it("should generate appropriate recommendation based on score", async () => {
      // High scoring candidate
      const highScoringResume = {
        ...mockResume,
        skills: ["JavaScript", "React", "Node.js", "TypeScript", "AWS", "Docker", "Python", "SQL"]
      };
      
      const result = await AIMatchingEngine.evaluateCandidate(highScoringResume, mockJob);
      
      expect(result.recommendation).toContain("Recommended");
      expect(result.scores.overall).toBeGreaterThan(0.6);
    });

    it("should use custom scoring weights", async () => {
      const customWeights = {
        skills: 0.8,
        experience: 0.1,
        education: 0.05,
        culturalFit: 0.05
      };
      
      const result = await AIMatchingEngine.evaluateCandidate(mockResume, mockJob, customWeights);
      
      // Skills should have more impact on overall score
      expect(result.scores.overall).toBeDefined();
      expect(result.scores.skills * 0.8).toBeCloseTo(
        result.scores.overall - 
        (result.scores.experience * 0.1) - 
        (result.scores.education * 0.05) - 
        ((result.scores.culturalFit || 0) * 0.05),
        1
      );
    });

    it("should identify strengths and weaknesses", async () => {
      const result = await AIMatchingEngine.evaluateCandidate(mockResume, mockJob);
      
      if (result.scores.skills > 0.7) {
        expect(result.strengths).toContain("Strong technical skills");
      }
      
      if (result.scores.skills < 0.5) {
        expect(result.weaknesses).toContain("Limited technical skills match");
      }
    });

    it("should generate relevant tags", async () => {
      const result = await AIMatchingEngine.evaluateCandidate(mockResume, mockJob);
      
      expect(result.tags.length).toBeGreaterThan(0);
      
      if (result.scores.overall >= 0.8) {
        expect(result.tags).toContain("Top Candidate");
      } else if (result.scores.overall >= 0.6) {
        expect(result.tags).toContain("Good Match");
      }
    });
  });
});

describe("BatchProcessor", () => {
  const mockCandidates: ParsedResume[] = [
    mockResume,
    {
      ...mockResume,
      candidateName: "Jane Smith",
      candidateEmail: "jane.smith@email.com",
      skills: ["Python", "Django", "PostgreSQL", "Docker"],
      experience: [
        {
          title: "Backend Developer",
          company: "Data Corp",
          duration: "2020-2023",
          description: "Developed APIs and data processing systems"
        }
      ]
    },
    {
      ...mockResume,
      candidateName: "Bob Johnson",
      candidateEmail: "bob.johnson@email.com",
      skills: ["Java", "Spring", "MySQL"],
      experience: [
        {
          title: "Junior Developer",
          company: "Small Startup",
          duration: "2022-2023",
          description: "Entry level development role"
        }
      ]
    }
  ];

  describe("processCandidates", () => {
    it("should process multiple candidates and return sorted results", async () => {
      const results = await BatchProcessor.processCandidates(mockCandidates, mockJob);
      
      expect(results).toHaveLength(mockCandidates.length);
      expect(results[0]).toHaveProperty('candidateId');
      expect(results[0]).toHaveProperty('scores');
      expect(results[0]).toHaveProperty('tags');
      
      // Results should be sorted by overall score (descending)
      for (let i = 1; i < results.length; i++) {
        expect(results[i-1].scores.overall).toBeGreaterThanOrEqual(results[i].scores.overall);
      }
    });

    it("should handle empty candidate list", async () => {
      const results = await BatchProcessor.processCandidates([], mockJob);
      
      expect(results).toHaveLength(0);
    });

    it("should use custom weights for all candidates", async () => {
      const customWeights = {
        skills: 0.9,
        experience: 0.05,
        education: 0.03,
        culturalFit: 0.02
      };
      
      const results = await BatchProcessor.processCandidates(mockCandidates, mockJob, customWeights);
      
      expect(results).toHaveLength(mockCandidates.length);
      // Skills should dominate the scoring
      results.forEach(result => {
        expect(result.scores.skills).toBeDefined();
      });
    });
  });

  describe("filterCandidates", () => {
    let mockResults: any[];

    beforeEach(async () => {
      mockResults = await BatchProcessor.processCandidates(mockCandidates, mockJob);
    });

    it("should filter candidates by minimum score", () => {
      const filtered = BatchProcessor.filterCandidates(mockResults, { minScore: 0.5 });
      
      filtered.forEach(result => {
        expect(result.scores.overall).toBeGreaterThanOrEqual(0.5);
      });
    });

    it("should filter candidates by maximum score", () => {
      const filtered = BatchProcessor.filterCandidates(mockResults, { maxScore: 0.7 });
      
      filtered.forEach(result => {
        expect(result.scores.overall).toBeLessThanOrEqual(0.7);
      });
    });

    it("should filter candidates by required tags", () => {
      const filtered = BatchProcessor.filterCandidates(mockResults, { 
        requiredTags: ["Good Match"] 
      });
      
      filtered.forEach(result => {
        expect(result.tags).toContain("Good Match");
      });
    });

    it("should exclude candidates by tags", () => {
      const filtered = BatchProcessor.filterCandidates(mockResults, { 
        excludeTags: ["Poor Fit"] 
      });
      
      filtered.forEach(result => {
        expect(result.tags).not.toContain("Poor Fit");
      });
    });

    it("should apply multiple filters simultaneously", () => {
      const filtered = BatchProcessor.filterCandidates(mockResults, { 
        minScore: 0.4,
        maxScore: 0.9,
        excludeTags: ["Poor Fit"]
      });
      
      filtered.forEach(result => {
        expect(result.scores.overall).toBeGreaterThanOrEqual(0.4);
        expect(result.scores.overall).toBeLessThanOrEqual(0.9);
        expect(result.tags).not.toContain("Poor Fit");
      });
    });

    it("should return empty array when no candidates match filters", () => {
      const filtered = BatchProcessor.filterCandidates(mockResults, { 
        minScore: 0.99 // Unrealistic minimum score
      });
      
      expect(filtered).toHaveLength(0);
    });
  });
});

// Edge cases and error handling
describe("Edge Cases", () => {
  it("should handle resume with empty skills array", async () => {
    const resumeWithNoSkills = {
      ...mockResume,
      skills: []
    };
    
    const result = await AIMatchingEngine.evaluateCandidate(resumeWithNoSkills, mockJob);
    
    expect(result.scores.skills).toBeLessThan(0.5);
    expect(result.missingSkills.length).toBeGreaterThan(0);
  });

  it("should handle job with empty requirements", async () => {
    const jobWithNoRequirements = {
      ...mockJob,
      requirements: "",
      description: "Basic job description"
    };
    
    const result = await AIMatchingEngine.evaluateCandidate(mockResume, jobWithNoRequirements);
    
    expect(result.scores.overall).toBeDefined();
    expect(result.scores.overall).toBeGreaterThan(0);
  });

  it("should handle malformed experience duration", () => {
    const resumeWithBadDuration = {
      ...mockResume,
      experience: [
        {
          title: "Developer",
          company: "Company",
          duration: "some time ago", // Non-standard format
          description: "Worked on stuff"
        }
      ]
    };
    
    const score = AIMatchingEngine.calculateExperienceScore(resumeWithBadDuration.experience);
    
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(1);
  });

  it("should handle very long skill lists", () => {
    const longSkillsList = Array.from({ length: 100 }, (_, i) => `skill${i}`);
    const shortRequiredList = ["skill1", "skill2", "skill3"];
    
    const score = AIMatchingEngine.calculateSkillsScore(longSkillsList, shortRequiredList);
    
    expect(score).toBeGreaterThan(0.9); // Should find the required skills
  });

  it("should handle special characters in skills", () => {
    const skillsWithSpecialChars = ["C++", "C#", ".NET", "Node.js"];
    const requiredSkills = ["C++", "C#", ".NET"];
    
    const score = AIMatchingEngine.calculateSkillsScore(skillsWithSpecialChars, requiredSkills);
    
    expect(score).toBeGreaterThan(0.9);
  });
});