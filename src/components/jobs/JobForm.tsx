"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Badge } from "~/components/ui/badge";
import { X } from "lucide-react";

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

interface JobFormProps {
  onSubmit: (data: JobFormData) => Promise<void>;
  initialData?: Partial<JobFormData>;
  isLoading?: boolean;
  submitLabel?: string;
}

export function JobForm({
  onSubmit,
  initialData,
  isLoading = false,
  submitLabel = "创建职位"
}: JobFormProps) {
  const [formData, setFormData] = useState<JobFormData>({
    title: initialData?.title ?? "",
    description: initialData?.description ?? "",
    requirements: initialData?.requirements ?? "",
    department: initialData?.department ?? "",
    location: initialData?.location ?? "",
    employmentType: initialData?.employmentType ?? "FULL_TIME",
    salaryRange: initialData?.salaryRange ?? "",
    status: initialData?.status ?? "DRAFT",
    tags: initialData?.tags ?? []
  });

  const [newTag, setNewTag] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: keyof JobFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "职位标题为必填项";
    }

    if (!formData.description.trim()) {
      newErrors.description = "职位描述为必填项";
    } else if (formData.description.length < 10) {
      newErrors.description = "职位描述至少需要10个字符";
    }

    if (!formData.requirements.trim()) {
      newErrors.requirements = "职位要求为必填项";
    } else if (formData.requirements.length < 10) {
      newErrors.requirements = "职位要求至少需要10个字符";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{submitLabel}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">职位标题 *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange("title", e.target.value)}
                placeholder="例如，高级软件工程师"
              />
              {errors.title && <p className="text-sm text-red-600">{errors.title}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">部门</Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange("department", e.target.value)}
                placeholder="例如，工程部"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">工作地点</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange("location", e.target.value)}
                placeholder="例如，北京市"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="employmentType">工作类型</Label>
              <Select
                value={formData.employmentType}
                onValueChange={(value: string) => handleInputChange("employmentType", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FULL_TIME">全职</SelectItem>
                  <SelectItem value="PART_TIME">兼职</SelectItem>
                  <SelectItem value="CONTRACT">合同工</SelectItem>
                  <SelectItem value="INTERNSHIP">实习生</SelectItem>
                  <SelectItem value="FREELANCE">自由职业</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">状态</Label>
              <Select
                value={formData.status}
                onValueChange={(value: string) => handleInputChange("status", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">草稿</SelectItem>
                  <SelectItem value="ACTIVE">活跃</SelectItem>
                  <SelectItem value="PAUSED">暂停</SelectItem>
                  <SelectItem value="CLOSED">已关闭</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="salaryRange">薪资范围</Label>
            <Input
              id="salaryRange"
              value={formData.salaryRange}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange("salaryRange", e.target.value)}
              placeholder="例如，80,000 - 120,000 元"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">职位描述 *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange("description", e.target.value)}
              placeholder="描述该职位的角色、职责和你正在寻找的人才..."
              rows={4}
            />
            {errors.description && <p className="text-sm text-red-600">{errors.description}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="requirements">职位要求 *</Label>
            <Textarea
              id="requirements"
              value={formData.requirements}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange("requirements", e.target.value)}
              placeholder="列出所需的技能、经验和资格..."
              rows={4}
            />
            {errors.requirements && <p className="text-sm text-red-600">{errors.requirements}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">技能和标签</Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                value={newTag}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTag(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="添加技能或标签并按回车键"
              />
              <Button type="button" onClick={handleAddTag} variant="outline">
                添加
              </Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => handleRemoveTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "保存中..." : submitLabel}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}