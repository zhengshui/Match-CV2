import { db } from "./db";

export interface FilterOptions {
  minScore?: number;
  maxScore?: number;
  minExperience?: number;
  maxExperience?: number;
  skills?: string[];
  education?: string[];
  tags?: string[];
  excludeTags?: string[];
  department?: string;
  location?: string;
  status?: string[];
  dateFrom?: Date;
  dateTo?: Date;
}

export interface SortOptions {
  field: 'overallScore' | 'skillsScore' | 'experienceScore' | 'educationScore' | 'createdAt' | 'candidateName';
  direction: 'asc' | 'desc';
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface FilteredResult {
  evaluations: any[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  summary: {
    averageScore: number;
    topScore: number;
    scoreDistribution: {
      excellent: number;
      good: number;
      fair: number;
      poor: number;
    };
    commonSkills: { skill: string; count: number; }[];
    topTags: { tag: string; count: number; }[];
  };
}

export class CandidateFilteringService {
  /**
   * Filter and sort candidates based on criteria
   */
  static async filterCandidates(
    jobId?: string,
    filters: FilterOptions = {},
    sort: SortOptions = { field: 'overallScore', direction: 'desc' },
    pagination: PaginationOptions = { page: 1, limit: 10 }
  ): Promise<FilteredResult> {
    try {
      // Build where clause
      const whereClause: any = {};
      
      if (jobId) {
        whereClause.jobId = jobId;
      }

      // Score filters
      if (filters.minScore !== undefined || filters.maxScore !== undefined) {
        whereClause.overallScore = {};
        if (filters.minScore !== undefined) {
          whereClause.overallScore.gte = filters.minScore;
        }
        if (filters.maxScore !== undefined) {
          whereClause.overallScore.lte = filters.maxScore;
        }
      }

      // Status filter
      if (filters.status && filters.status.length > 0) {
        whereClause.status = { in: filters.status };
      }

      // Date range filter
      if (filters.dateFrom || filters.dateTo) {
        whereClause.createdAt = {};
        if (filters.dateFrom) {
          whereClause.createdAt.gte = filters.dateFrom;
        }
        if (filters.dateTo) {
          whereClause.createdAt.lte = filters.dateTo;
        }
      }

      // Job-specific filters
      if (filters.department || filters.location) {
        whereClause.job = {};
        if (filters.department) {
          whereClause.job.department = filters.department;
        }
        if (filters.location) {
          whereClause.job.location = { contains: filters.location, mode: 'insensitive' };
        }
      }

      // Resume-based filters (skills, education, tags)
      if (filters.skills?.length || filters.education?.length || filters.tags?.length || filters.excludeTags?.length) {
        whereClause.resume = {};

        // Skills filter (requires parsing JSON)
        if (filters.skills?.length) {
          // This is a simplified approach - in production you might want to use a more sophisticated search
          whereClause.resume.parsedData = {
            contains: filters.skills[0], // Search for first skill in parsed data
          };
        }

        // Tags filter
        if (filters.tags?.length || filters.excludeTags?.length) {
          whereClause.resume.resumeTags = {};
          
          if (filters.tags?.length) {
            whereClause.resume.resumeTags.some = {
              tag: {
                name: { in: filters.tags }
              }
            };
          }

          if (filters.excludeTags?.length) {
            whereClause.resume.resumeTags.none = {
              tag: {
                name: { in: filters.excludeTags }
              }
            };
          }
        }
      }

      // Calculate offset
      const offset = (pagination.page - 1) * pagination.limit;

      // Build order by clause
      const orderBy: Record<string, any> = {};
      if (sort.field === 'candidateName') {
        orderBy.resume = { candidateName: sort.direction };
      } else {
        orderBy[sort.field] = sort.direction;
      }

      // Execute query with includes
      const [evaluations, total] = await Promise.all([
        db.evaluation.findMany({
          where: whereClause,
          include: {
            job: {
              select: {
                id: true,
                title: true,
                department: true,
                location: true,
              },
            },
            resume: {
              select: {
                id: true,
                candidateName: true,
                candidateEmail: true,
                phone: true,
                parsedData: true,
                status: true,
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
          orderBy,
          take: pagination.limit,
          skip: offset,
        }),
        db.evaluation.count({ where: whereClause }),
      ]);

      // Calculate pagination metadata
      const totalPages = Math.ceil(total / pagination.limit);
      const paginationMeta = {
        total,
        page: pagination.page,
        limit: pagination.limit,
        totalPages,
        hasNext: pagination.page < totalPages,
        hasPrev: pagination.page > 1,
      };

      // Generate summary statistics
      const summary = await this.generateSummary(evaluations, jobId);

      return {
        evaluations: evaluations.map(evaluation => ({
          ...evaluation,
          resume: {
            ...evaluation.resume,
            parsedData: JSON.parse(evaluation.resume.parsedData),
            tags: evaluation.resume.resumeTags.map(rt => rt.tag),
          },
        })),
        pagination: paginationMeta,
        summary,
      };
    } catch (error) {
      console.error("Filtering error:", error);
      throw new Error("Failed to filter candidates");
    }
  }

  /**
   * Generate summary statistics for filtered results
   */
  private static async generateSummary(evaluations: any[], _jobId?: string): Promise<FilteredResult['summary']> {
    if (evaluations.length === 0) {
      return {
        averageScore: 0,
        topScore: 0,
        scoreDistribution: { excellent: 0, good: 0, fair: 0, poor: 0 },
        commonSkills: [],
        topTags: [],
      };
    }

    // Calculate score statistics
    const scores = evaluations.map(e => e.overallScore);
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const topScore = Math.max(...scores);

    // Score distribution
    const scoreDistribution = {
      excellent: scores.filter(s => s >= 0.8).length,
      good: scores.filter(s => s >= 0.6 && s < 0.8).length,
      fair: scores.filter(s => s >= 0.4 && s < 0.6).length,
      poor: scores.filter(s => s < 0.4).length,
    };

    // Common skills analysis
    const skillsMap = new Map<string, number>();
    evaluations.forEach(evaluation => {
      try {
        const parsedData = JSON.parse(evaluation.resume.parsedData);
        if (parsedData.skills) {
          parsedData.skills.forEach((skill: string) => {
            const normalizedSkill = skill.toLowerCase().trim();
            skillsMap.set(normalizedSkill, (skillsMap.get(normalizedSkill) ?? 0) + 1);
          });
        }
      } catch (_error) {
        // Skip invalid JSON
      }
    });

    const commonSkills = Array.from(skillsMap.entries())
      .map(([skill, count]) => ({ skill, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Top tags analysis
    const tagsMap = new Map<string, number>();
    evaluations.forEach(evaluation => {
      evaluation.resume.resumeTags?.forEach((resumeTag: any) => {
        const tagName = resumeTag.tag.name;
        tagsMap.set(tagName, (tagsMap.get(tagName) ?? 0) + 1);
      });
    });

    const topTags = Array.from(tagsMap.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      averageScore: Math.round(averageScore * 100) / 100,
      topScore: Math.round(topScore * 100) / 100,
      scoreDistribution,
      commonSkills,
      topTags,
    };
  }

  /**
   * Get available filter options for a job
   */
  static async getFilterOptions(jobId?: string): Promise<{
    departments: string[];
    locations: string[];
    skills: string[];
    tags: string[];
    scoreRange: { min: number; max: number };
    dateRange: { min: Date; max: Date };
  }> {
    try {
      const whereClause = jobId ? { jobId } : {};

      // Get evaluations for analysis
      const evaluations = await db.evaluation.findMany({
        where: whereClause,
        include: {
          job: {
            select: {
              department: true,
              location: true,
            },
          },
          resume: {
            select: {
              parsedData: true,
            },
            include: {
              resumeTags: {
                include: {
                  tag: true,
                },
              },
            },
          },
        },
      });

      if (evaluations.length === 0) {
        return {
          departments: [],
          locations: [],
          skills: [],
          tags: [],
          scoreRange: { min: 0, max: 1 },
          dateRange: { min: new Date(), max: new Date() },
        };
      }

      // Extract unique departments
      const departments = [...new Set(
        evaluations
          .map(e => e.job.department)
          .filter((dept): dept is string => Boolean(dept))
      )];

      // Extract unique locations
      const locations = [...new Set(
        evaluations
          .map(e => e.job.location)
          .filter((loc): loc is string => Boolean(loc))
      )];

      // Extract unique skills
      const skillsSet = new Set<string>();
      evaluations.forEach(evaluation => {
        try {
          const parsedData = JSON.parse(evaluation.resume.parsedData);
          if (parsedData.skills) {
            parsedData.skills.forEach((skill: string) => {
              skillsSet.add(skill.trim());
            });
          }
        } catch (_error) {
          // Skip invalid JSON
        }
      });
      const skills = Array.from(skillsSet).sort();

      // Extract unique tags
      const tagsSet = new Set<string>();
      evaluations.forEach(evaluation => {
        evaluation.resume.resumeTags?.forEach((resumeTag: any) => {
          tagsSet.add(resumeTag.tag.name);
        });
      });
      const tags = Array.from(tagsSet).sort();

      // Calculate score range
      const scores = evaluations.map(e => e.overallScore);
      const scoreRange = {
        min: Math.min(...scores),
        max: Math.max(...scores),
      };

      // Calculate date range
      const dates = evaluations.map(e => e.createdAt);
      const dateRange = {
        min: new Date(Math.min(...dates.map(d => d.getTime()))),
        max: new Date(Math.max(...dates.map(d => d.getTime()))),
      };

      return {
        departments,
        locations,
        skills,
        tags,
        scoreRange,
        dateRange,
      };
    } catch (error) {
      console.error("Filter options error:", error);
      throw new Error("Failed to get filter options");
    }
  }

  /**
   * Advanced search with multiple criteria
   */
  static async advancedSearch(
    searchQuery: string,
    jobId?: string,
    filters: FilterOptions = {},
    sort: SortOptions = { field: 'overallScore', direction: 'desc' },
    pagination: PaginationOptions = { page: 1, limit: 10 }
  ): Promise<FilteredResult> {
    try {
      // Add text search to filters
      const enhancedFilters = { ...filters };
      
      // For now, we'll do a simple text search in candidate names and emails
      // In production, you might want to implement full-text search
      const searchTerms = searchQuery.toLowerCase().split(' ').filter(term => term.length > 0);
      
      const results = await this.filterCandidates(jobId, enhancedFilters, sort, pagination);
      
      // If search query provided, filter results further
      if (searchTerms.length > 0) {
        results.evaluations = results.evaluations.filter(evaluation => {
          const candidateName = evaluation.resume.candidateName.toLowerCase();
          const candidateEmail = evaluation.resume.candidateEmail.toLowerCase();
          const parsedData = evaluation.resume.parsedData;
          
          // Search in name, email, and skills
          const searchText = `${candidateName} ${candidateEmail} ${parsedData.skills?.join(' ') || ''}`.toLowerCase();
          
          return searchTerms.some(term => searchText.includes(term));
        });

        // Recalculate pagination for filtered results
        const filteredTotal = results.evaluations.length;
        results.pagination = {
          ...results.pagination,
          total: filteredTotal,
          totalPages: Math.ceil(filteredTotal / pagination.limit),
        };
      }

      return results;
    } catch (error) {
      console.error("Advanced search error:", error);
      throw new Error("Failed to perform advanced search");
    }
  }
}