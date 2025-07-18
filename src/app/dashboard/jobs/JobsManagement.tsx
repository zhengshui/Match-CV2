"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { JobCard } from "~/components/jobs/JobCard";
import { JobForm } from "~/components/jobs/JobForm";
import { Plus, Search, Filter } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { type JobStatus, type EmploymentType } from "@prisma/client";

interface Tag {
  id: string;
  name: string;
  color?: string;
  category: string;
}

interface Job {
  id: string;
  title: string;
  description: string;
  requirements: string;
  department?: string;
  location?: string;
  employmentType: EmploymentType;
  salaryRange?: string;
  status: JobStatus;
  createdAt: Date;
  updatedAt: Date;
  tags: Tag[];
  evaluationCount?: number;
}

interface JobFormData {
  title: string;
  description: string;
  requirements: string;
  department: string;
  location: string;
  employmentType: string;
  salaryRange: string;
  status: string;
  tags: string[];
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function JobsManagement() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<JobStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  const fetchJobs = useCallback(async (status?: JobStatus, search?: string, page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10"
      });
      
      if (status) {
        params.append("status", status);
      }
      
      if (search) {
        params.append("search", search);
      }

      const response = await fetch(`/api/jobs?${params}`);
      
      if (!response.ok) {
        throw new Error("获取职位列表失败");
      }

      interface JobsResponse {
        jobs: Job[];
        pagination: PaginationData;
      }
      const data = await response.json() as JobsResponse;
      
      // Ensure dates are properly parsed
      const jobsWithDates = data.jobs.map((job: Job) => ({
        ...job,
        createdAt: new Date(job.createdAt),
        updatedAt: new Date(job.updatedAt)
      }));
      
      setJobs(jobsWithDates);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "发生错误");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchJobs(activeTab === "all" ? undefined : activeTab, searchQuery);
  }, [fetchJobs, activeTab, searchQuery]);

  const handleCreateJob = async (formData: JobFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json() as { error?: string };
        throw new Error(errorData.error ?? "创建职位失败");
      }

      void fetchJobs(activeTab === "all" ? undefined : activeTab, searchQuery);
      setIsCreateDialogOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "创建职位失败");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditJob = async (formData: JobFormData) => {
    if (!editingJob) return;

    try {
      setIsSubmitting(true);
      setError(null);

      const response = await fetch(`/api/jobs/${editingJob.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json() as { error?: string };
        throw new Error(errorData.error ?? "更新职位失败");
      }

      void fetchJobs(activeTab === "all" ? undefined : activeTab, searchQuery);
      setIsEditDialogOpen(false);
      setEditingJob(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "更新职位失败");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm("确定要删除这个职位吗？此操作无法撤销。")) {
      return;
    }

    try {
      setError(null);

      const response = await fetch(`/api/jobs/${jobId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json() as { error?: string };
        throw new Error(errorData.error ?? "删除职位失败");
      }

      void fetchJobs(activeTab === "all" ? undefined : activeTab, searchQuery);
    } catch (err) {
      setError(err instanceof Error ? err.message : "删除职位失败");
    }
  };

  const handleEditClick = (jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    if (job) {
      setEditingJob(job);
      setIsEditDialogOpen(true);
    }
  };

  const handleViewClick = (jobId: string) => {
    // Navigate to job details page or open detailed view
    console.log("View job:", jobId);
  };

  const filteredJobs = jobs.filter(job =>
    job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (job.department?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
    (job.location?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  const getJobCounts = () => {
    const counts = jobs.reduce((acc, job) => {
      acc[job.status] = (acc[job.status] ?? 0) + 1;
      acc.all = (acc.all ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return counts;
  };

  const jobCounts = getJobCounts();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">职位管理</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              创建职位
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>创建新职位</DialogTitle>
            </DialogHeader>
            <JobForm
              onSubmit={handleCreateJob}
              isLoading={isSubmitting}
              submitLabel="创建职位"
            />
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索职位..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4 mr-2" />
          筛选
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as JobStatus | "all")}>
        <TabsList>
          <TabsTrigger value="all">
            全部 ({jobCounts.all ?? 0})
          </TabsTrigger>
          <TabsTrigger value="ACTIVE">
            活跃 ({jobCounts.ACTIVE ?? 0})
          </TabsTrigger>
          <TabsTrigger value="DRAFT">
            草稿 ({jobCounts.DRAFT ?? 0})
          </TabsTrigger>
          <TabsTrigger value="PAUSED">
            暂停 ({jobCounts.PAUSED ?? 0})
          </TabsTrigger>
          <TabsTrigger value="CLOSED">
            已关闭 ({jobCounts.CLOSED ?? 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">未找到职位</p>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>创建您的第一个职位</Button>
                </DialogTrigger>
              </Dialog>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onEdit={handleEditClick}
                  onDelete={handleDeleteJob}
                  onView={handleViewClick}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Job Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>编辑职位</DialogTitle>
          </DialogHeader>
          {editingJob && (
            <JobForm
              onSubmit={handleEditJob}
              initialData={{
                title: editingJob.title,
                description: editingJob.description,
                requirements: editingJob.requirements,
                department: editingJob.department ?? "",
                location: editingJob.location ?? "",
                employmentType: editingJob.employmentType,
                salaryRange: editingJob.salaryRange ?? "",
                status: editingJob.status,
                tags: editingJob.tags.map(tag => tag.name)
              }}
              isLoading={isSubmitting}
              submitLabel="更新职位"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}