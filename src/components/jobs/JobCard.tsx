"use client";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { MapPin, Building, Clock, Users, MoreHorizontal, Edit, Trash2, Eye } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { type JobStatus, type EmploymentType } from "@prisma/client";

interface Tag {
  id: string;
  name: string;
  color?: string;
  category: string;
}

interface JobCardProps {
  job: {
    id: string;
    title: string;
    description: string;
    department?: string;
    location?: string;
    employmentType: EmploymentType;
    salaryRange?: string;
    status: JobStatus;
    createdAt: Date;
    tags: Tag[];
    evaluationCount?: number;
  };
  onEdit?: (jobId: string) => void;
  onDelete?: (jobId: string) => void;
  onView?: (jobId: string) => void;
}

const statusColors: Record<JobStatus, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  PAUSED: "bg-yellow-100 text-yellow-800", 
  CLOSED: "bg-red-100 text-red-800",
  DRAFT: "bg-gray-100 text-gray-800"
};

const employmentTypeLabels: Record<EmploymentType, string> = {
  FULL_TIME: "全职",
  PART_TIME: "兼职",
  CONTRACT: "合同工",
  INTERNSHIP: "实习生",
  FREELANCE: "自由职业"
};

export function JobCard({ job, onEdit, onDelete, onView }: JobCardProps) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("zh-CN", {
      month: "short",
      day: "numeric",
      year: "numeric"
    }).format(new Date(date));
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold mb-2">
              {job.title}
            </CardTitle>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {job.department && (
                <div className="flex items-center gap-1">
                  <Building className="h-4 w-4" />
                  {job.department}
                </div>
              )}
              {job.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {job.location}
                </div>
              )}
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {employmentTypeLabels[job.employmentType]}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge className={statusColors[job.status]}>
              {job.status}
            </Badge>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onView && (
                  <DropdownMenuItem onClick={() => onView(job.id)}>
                    <Eye className="h-4 w-4 mr-2" />
                    查看详情
                  </DropdownMenuItem>
                )}
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(job.id)}>
                    <Edit className="h-4 w-4 mr-2" />
                    编辑职位
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem 
                    onClick={() => onDelete(job.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    删除职位
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1">
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {truncateText(job.description, 120)}
          </p>

          {job.salaryRange && (
            <p className="text-sm font-medium text-green-600">
              {job.salaryRange}
            </p>
          )}

          {job.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {job.tags.slice(0, 3).map((tag) => (
                <Badge key={tag.id} variant="outline" className="text-xs">
                  {tag.name}
                </Badge>
              ))}
              {job.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{job.tags.length - 3} 更多
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-3 border-t">
        <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
          <span>创建于 {formatDate(job.createdAt)}</span>
          {typeof job.evaluationCount === "number" && (
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {job.evaluationCount} 个候选人
            </div>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}