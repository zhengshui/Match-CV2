import type { ParsedResume } from "./resume-parser";

export interface JobRequirements {
  id: string;
  title: string;
  description: string;
  requirements: string;
  department?: string;
  location?: string;
  salaryRange?: string;
}

export interface MatchingScore {
  overall: number;
  skills: number;
  experience: number;
  education: number;
  culturalFit?: number;
}

export interface EvaluationResult {
  scores: MatchingScore;
  explanation: string;
  recommendation: string;
  strengths: string[];
  weaknesses: string[];
  missingSkills: string[];
  tags: string[];
}

export interface ScoringWeights {
  skills: number;
  experience: number;
  education: number;
  culturalFit: number;
}

export class AIMatchingEngine {
  private static readonly DEFAULT_WEIGHTS: ScoringWeights = {
    skills: 0.4,
    experience: 0.3,
    education: 0.2,
    culturalFit: 0.1,
  };

  /**
   * Calculate skills matching score
   */
  static calculateSkillsScore(candidateSkills: string[], requiredSkills: string[]): number {
    if (requiredSkills.length === 0) return 0.8; // Default score if no specific skills required
    
    const normalizedCandidateSkills = candidateSkills.map(skill => skill.toLowerCase().trim());
    const normalizedRequiredSkills = requiredSkills.map(skill => skill.toLowerCase().trim());
    
    let matchedSkills = 0;
    let partialMatches = 0;
    
    for (const required of normalizedRequiredSkills) {
      const exactMatch = normalizedCandidateSkills.some(candidate => 
        candidate.includes(required) || required.includes(candidate)
      );
      
      if (exactMatch) {
        matchedSkills++;
      } else {
        // Check for partial matches (e.g., "react" matches "reactjs")
        const partialMatch = normalizedCandidateSkills.some(candidate => {
          const words = candidate.split(/[\s-_]+/);
          const requiredWords = required.split(/[\s-_]+/);
          return words.some(word => requiredWords.some(reqWord => 
            word.includes(reqWord) || reqWord.includes(word)
          ));
        });
        
        if (partialMatch) {
          partialMatches++;
        }
      }
    }
    
    // Calculate score: full points for exact matches, half points for partial matches
    const totalScore = matchedSkills + (partialMatches * 0.5);
    return Math.min(totalScore / normalizedRequiredSkills.length, 1.0);
  }

  /**
   * Calculate experience matching score
   */
  static calculateExperienceScore(
    candidateExperience: ParsedResume['experience'],
    requiredYears?: number,
    requiredRoles?: string[]
  ): number {
    if (candidateExperience.length === 0) return 0.2;
    
    // Calculate total years of experience (approximate)
    let totalYears = 0;
    candidateExperience.forEach(exp => {
      const yearMatch = /(\d+)/.exec(exp.duration);
      if (yearMatch) {
        totalYears += parseInt(yearMatch[1] ?? "1");
      } else {
        // Default to 1 year if can't parse
        totalYears += 1;
      }
    });
    
    let experienceScore = 0.5; // Base score
    
    // Score based on years of experience
    if (requiredYears) {
      if (totalYears >= requiredYears) {
        experienceScore += 0.3;
      } else {
        experienceScore += (totalYears / requiredYears) * 0.3;
      }
    } else {
      // Default scoring: more experience = higher score
      experienceScore += Math.min(totalYears / 5, 0.3);
    }
    
    // Score based on relevant roles
    if (requiredRoles && requiredRoles.length > 0) {
      const roleMatches = candidateExperience.filter(exp => 
        requiredRoles.some(role => 
          exp.title.toLowerCase().includes(role.toLowerCase()) ||
          role.toLowerCase().includes(exp.title.toLowerCase())
        )
      );
      
      experienceScore += (roleMatches.length / candidateExperience.length) * 0.2;
    } else {
      experienceScore += 0.2; // Default if no specific roles required
    }
    
    return Math.min(experienceScore, 1.0);
  }

  /**
   * Calculate education matching score
   */
  static calculateEducationScore(
    candidateEducation: ParsedResume['education'],
    requiredDegree?: string,
    preferredFields?: string[]
  ): number {
    if (candidateEducation.length === 0) return 0.3; // Some positions don't require formal education
    
    let educationScore = 0.3; // Base score for having education
    
    // Score based on degree level
    const degreeLevel = this.getDegreeLevel(candidateEducation);
    const requiredLevel = requiredDegree ? this.getDegreeLevelFromString(requiredDegree) : 1;
    
    if (degreeLevel >= requiredLevel) {
      educationScore += 0.4;
    } else {
      educationScore += (degreeLevel / requiredLevel) * 0.4;
    }
    
    // Score based on field relevance
    if (preferredFields && preferredFields.length > 0) {
      const fieldMatches = candidateEducation.filter(edu => 
        preferredFields.some(field => 
          edu.degree.toLowerCase().includes(field.toLowerCase()) ||
          edu.university.toLowerCase().includes(field.toLowerCase())
        )
      );
      
      if (fieldMatches.length > 0) {
        educationScore += 0.3;
      }
    } else {
      educationScore += 0.3; // Default if no specific field required
    }
    
    return Math.min(educationScore, 1.0);
  }

  /**
   * Calculate cultural fit score based on keywords and patterns
   */
  static calculateCulturalFitScore(
    candidate: ParsedResume,
    jobDescription: string,
    _companyValues?: string[]
  ): number {
    // This is a simplified cultural fit assessment
    // In a real system, this would use more sophisticated NLP
    
    let culturalFitScore = 0.5; // Base score
    
    const candidateText = [
      candidate.summary || "",
      ...candidate.experience.map(exp => exp.description || ""),
    ].join(" ").toLowerCase();
    
    const jobText = jobDescription.toLowerCase();
    
    // Look for cultural keywords
    const culturalKeywords = [
      "team", "collaboration", "leadership", "innovation", "creative",
      "problem-solving", "communication", "adaptable", "flexible",
      "fast-paced", "startup", "entrepreneurial", "remote", "agile"
    ];
    
    let keywordMatches = 0;
    culturalKeywords.forEach(keyword => {
      if (candidateText.includes(keyword) && jobText.includes(keyword)) {
        keywordMatches++;
      }
    });
    
    culturalFitScore += (keywordMatches / culturalKeywords.length) * 0.5;
    
    return Math.min(culturalFitScore, 1.0);
  }

  /**
   * Extract required skills from job description
   */
  static extractRequiredSkills(jobDescription: string, requirements: string): string[] {
    const text = `${jobDescription} ${requirements}`.toLowerCase();
    
    // Common technical skills to look for
    const commonSkills = [
      "javascript", "typescript", "python", "java", "c++", "c#", "php", "ruby",
      "react", "vue", "angular", "node.js", "express", "django", "flask",
      "sql", "mysql", "postgresql", "mongodb", "redis",
      "aws", "azure", "gcp", "docker", "kubernetes",
      "git", "github", "gitlab", "jira", "confluence",
      "html", "css", "sass", "scss", "tailwind",
      "rest", "api", "graphql", "microservices",
      "agile", "scrum", "kanban", "devops", "ci/cd"
    ];
    
    const foundSkills: string[] = [];
    
    commonSkills.forEach(skill => {
      if (text.includes(skill.toLowerCase())) {
        foundSkills.push(skill);
      }
    });
    
    // Also look for skills mentioned explicitly in requirements
    const requirementWords = requirements.split(/[\s,.-]+/)
      .filter(word => word.length > 2)
      .map(word => word.replace(/[^\w]/g, ''));
    
    foundSkills.push(...requirementWords);
    
    return [...new Set(foundSkills)]; // Remove duplicates
  }

  /**
   * Generate AI evaluation for candidate-job match
   */
  static async evaluateCandidate(
    candidate: ParsedResume,
    job: JobRequirements,
    weights: ScoringWeights = this.DEFAULT_WEIGHTS
  ): Promise<EvaluationResult> {
    // Extract required skills from job description
    const requiredSkills = this.extractRequiredSkills(job.description, job.requirements);
    
    // Calculate individual scores
    const skillsScore = this.calculateSkillsScore(candidate.skills, requiredSkills);
    const experienceScore = this.calculateExperienceScore(candidate.experience);
    const educationScore = this.calculateEducationScore(candidate.education);
    const culturalFitScore = this.calculateCulturalFitScore(candidate, job.description);
    
    // Calculate weighted overall score
    const overallScore = 
      (skillsScore * weights.skills) +
      (experienceScore * weights.experience) +
      (educationScore * weights.education) +
      (culturalFitScore * weights.culturalFit);
    
    const scores: MatchingScore = {
      overall: Math.round(overallScore * 100) / 100,
      skills: Math.round(skillsScore * 100) / 100,
      experience: Math.round(experienceScore * 100) / 100,
      education: Math.round(educationScore * 100) / 100,
      culturalFit: Math.round(culturalFitScore * 100) / 100,
    };
    
    // Generate explanation and recommendations
    const explanation = this.generateExplanation(scores, candidate, job);
    const recommendation = this.generateRecommendation(scores.overall);
    const strengths = this.identifyStrengths(scores, candidate);
    const weaknesses = this.identifyWeaknesses(scores, candidate);
    const missingSkills = this.identifyMissingSkills(candidate.skills, requiredSkills);
    const tags = this.generateTags(scores, candidate, job);
    
    return {
      scores,
      explanation,
      recommendation,
      strengths,
      weaknesses,
      missingSkills,
      tags,
    };
  }

  /**
   * Helper methods
   */
  private static getDegreeLevel(education: ParsedResume['education']): number {
    const degrees = education.map(edu => edu.degree.toLowerCase());
    
    if (degrees.some(deg => deg.includes('phd') || deg.includes('doctorate'))) return 4;
    if (degrees.some(deg => deg.includes('master') || deg.includes('mba'))) return 3;
    if (degrees.some(deg => deg.includes('bachelor'))) return 2;
    if (degrees.some(deg => deg.includes('associate'))) return 1;
    
    return 0;
  }

  private static getDegreeLevelFromString(degreeString: string): number {
    const lower = degreeString.toLowerCase();
    if (lower.includes('phd') || lower.includes('doctorate')) return 4;
    if (lower.includes('master') || lower.includes('mba')) return 3;
    if (lower.includes('bachelor')) return 2;
    if (lower.includes('associate')) return 1;
    return 1; // Default requirement
  }

  private static generateExplanation(
    scores: MatchingScore,
    candidate: ParsedResume,
    job: JobRequirements
  ): string {
    const parts: string[] = [];
    
    parts.push(`候选人 ${candidate.candidateName} 在 ${job.title} 职位上的综合匹配度为 ${(scores.overall * 100).toFixed(0)}%。`);
    
    if (scores.skills > 0.7) {
      parts.push("技能匹配度优秀，与岗位要求高度契合。");
    } else if (scores.skills > 0.5) {
      parts.push("技能匹配度良好，存在一些技能提升空间。");
    } else {
      parts.push("技能匹配度有限，可能需要针对性培训。");
    }
    
    if (scores.experience > 0.7) {
      parts.push("工作经验非常符合该职位要求。");
    } else if (scores.experience > 0.5) {
      parts.push("工作经验较为匹配，有进一步发展空间。");
    } else {
      parts.push("相关工作经验有限，适合初级岗位或有培养潜力。");
    }
    
    if (scores.education > 0.7) {
      parts.push("教育背景与岗位要求匹配度高。");
    }
    
    return parts.join(" ");
  }

  private static generateRecommendation(overallScore: number, _candidate?: ParsedResume): string {
    if (overallScore >= 0.8) {
      return "强烈推荐 - 优秀候选人，各方面能力均与岗位高度匹配";
    } else if (overallScore >= 0.6) {
      return "推荐 - 良好候选人，存在少数可改进的差距";
    } else if (overallScore >= 0.4) {
      return "谨慎考虑 - 匹配度一般，需要仔细评估能力差距";
    } else {
      return "不推荐 - 与当前岗位要求匹配度较低";
    }
  }

  private static identifyStrengths(scores: MatchingScore, candidate: ParsedResume): string[] {
    const strengths: string[] = [];
    
    if (scores.skills > 0.7) strengths.push("技术能力突出");
    if (scores.experience > 0.7) strengths.push("相关工作经验丰富");
    if (scores.education > 0.7) strengths.push("教育背景匹配");
    if (scores.culturalFit && scores.culturalFit > 0.7) strengths.push("企业文化适应性强");
    
    if (candidate.certifications && candidate.certifications.length > 0) {
      strengths.push("拥有专业认证证书");
    }
    
    if (candidate.languages && candidate.languages.length > 1) {
      strengths.push("多语言能力");
    }
    
    return strengths;
  }

  private static identifyWeaknesses(scores: MatchingScore, candidate: ParsedResume): string[] {
    const weaknesses: string[] = [];
    
    if (scores.skills < 0.5) weaknesses.push("技术技能匹配度不足");
    if (scores.experience < 0.5) weaknesses.push("相关工作经验有限");
    if (scores.education < 0.5) weaknesses.push("教育背景匹配度较低");
    if (scores.culturalFit && scores.culturalFit < 0.5) weaknesses.push("企业文化适应性需要关注");
    
    return weaknesses;
  }

  private static identifyMissingSkills(candidateSkills: string[], requiredSkills: string[]): string[] {
    const normalizedCandidate = candidateSkills.map(s => s.toLowerCase());
    return requiredSkills.filter(required => 
      !normalizedCandidate.some(candidate => 
        candidate.includes(required.toLowerCase()) || required.toLowerCase().includes(candidate)
      )
    );
  }

  private static generateTags(
    scores: MatchingScore,
    candidate: ParsedResume,
    job: JobRequirements
  ): string[] {
    const tags: string[] = [];
    
    // Performance tags
    if (scores.overall >= 0.8) tags.push("顶级候选人");
    else if (scores.overall >= 0.6) tags.push("良好匹配");
    else if (scores.overall >= 0.4) tags.push("有潜力");
    else tags.push("匹配度低");
    
    // Skills tags
    if (scores.skills >= 0.8) tags.push("技能专家");
    else if (scores.skills < 0.4) tags.push("技能差距");
    
    // Experience tags
    if (scores.experience >= 0.8) tags.push("经验丰富");
    else if (scores.experience < 0.4) tags.push("初级水平");
    
    // Department-specific tags
    if (job.department) {
      tags.push(job.department);
    }
    
    return tags;
  }
}

/**
 * Batch processing for multiple candidates
 */
export class BatchProcessor {
  static async processCandidates(
    candidates: ParsedResume[],
    job: JobRequirements,
    weights?: ScoringWeights
  ): Promise<(EvaluationResult & { candidateId: string })[]> {
    const results = await Promise.all(
      candidates.map(async (candidate, index) => {
        const evaluation = await AIMatchingEngine.evaluateCandidate(candidate, job, weights);
        return {
          ...evaluation,
          candidateId: `candidate_${index}`, // In real app, use actual ID
        };
      })
    );
    
    // Sort by overall score (descending)
    return results.sort((a, b) => b.scores.overall - a.scores.overall);
  }

  static filterCandidates(
    results: (EvaluationResult & { candidateId: string })[],
    filters: {
      minScore?: number;
      maxScore?: number;
      requiredTags?: string[];
      excludeTags?: string[];
    }
  ): (EvaluationResult & { candidateId: string })[] {
    return results.filter(result => {
      if (filters.minScore && result.scores.overall < filters.minScore) return false;
      if (filters.maxScore && result.scores.overall > filters.maxScore) return false;
      
      if (filters.requiredTags) {
        const hasAllRequired = filters.requiredTags.every(tag => 
          result.tags.includes(tag)
        );
        if (!hasAllRequired) return false;
      }
      
      if (filters.excludeTags) {
        const hasExcluded = filters.excludeTags.some(tag => 
          result.tags.includes(tag)
        );
        if (hasExcluded) return false;
      }
      
      return true;
    });
  }
}