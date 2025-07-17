"use client";

import { useState, useRef } from "react";

interface ResumeUploadProps {
  onUploadSuccess?: (resume: {
    id: string;
    candidateName: string;
    candidateEmail: string;
    phone?: string;
    fileName: string;
    status: string;
    createdAt: string;
    tags?: Array<{
      id: string;
      name: string;
      color: string;
      category: string;
    }>;
  }) => void;
  onUploadError?: (error: string) => void;
}

export default function ResumeUpload({ onUploadSuccess, onUploadError }: ResumeUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file) return;
    
    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];

    if (!allowedTypes.includes(file.type)) {
      onUploadError?.("无效的文件类型。请上传PDF、Word文档或文本文件。");
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      onUploadError?.("文件过大。请上传小于10MB的文件。");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/resumes", {
        method: "POST",
        body: formData,
      });

      const data = await response.json() as { resume?: {
        id: string;
        candidateName: string;
        candidateEmail: string;
        phone?: string;
        fileName: string;
        status: string;
        createdAt: string;
        tags?: Array<{
          id: string;
          name: string;
          color: string;
          category: string;
        }>;
      }; error?: string };

      if (response.ok && data.resume) {
        onUploadSuccess?.(data.resume);
        // Reset the file input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        onUploadError?.(data.error ?? "Upload failed");
      }
    } catch {
      onUploadError?.("上传失败。请重试。");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    void handleFiles(files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    void handleFiles(files);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? "border-indigo-500 bg-indigo-50"
            : "border-gray-300 hover:border-gray-400"
        } ${uploading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.txt"
          onChange={handleFileChange}
          className="hidden"
          disabled={uploading}
        />

        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900">
              {uploading ? "上传中..." : "上传简历"}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {dragActive
                ? "拖拽简历到此处"
                : "拖拽文件或点击选择"}
            </p>
          </div>

          <div className="text-xs text-gray-400">
            支持格式：PDF、Word (.doc, .docx)、文本 (.txt)
            <br />
            最大文件大小：10MB
          </div>

          {uploading && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-indigo-600 h-2 rounded-full animate-pulse" style={{ width: "70%" }}></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}