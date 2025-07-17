"use client";

import { useState, useEffect } from "react";

interface Resume {
  id: string;
  candidateName: string;
  candidateEmail: string;
  phone?: string;
  fileName: string;
  status: string;
  createdAt: string;
  tags: Array<{
    id: string;
    name: string;
    color: string;
    category: string;
  }>;
}

interface ParsedData {
  candidateName: string;
  candidateEmail: string;
  phone?: string;
  location?: string;
  summary?: string;
  skills: string[];
  experience: Array<{
    title: string;
    company: string;
    duration: string;
    description?: string;
    technologies?: string[];
    achievements?: string[];
  }>;
  education: Array<{
    degree: string;
    university: string;
    year: string;
    gpa?: string;
    major?: string;
  }>;
  certifications?: string[];
  languages?: string[];
  projects?: Array<{
    name: string;
    description: string;
    technologies: string[];
    duration: string;
  }>;
}

interface ResumePreviewProps {
  resume: Resume;
  onClose: () => void;
}

export default function ResumePreview({ resume, onClose }: ResumePreviewProps) {
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchResumeData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/resumes/${resume.id}`);
        if (response.ok) {
          const data = await response.json() as { resume: { parsedData: ParsedData } };
          setParsedData(data.resume.parsedData);
        } else {
          setError("获取简历详情失败");
        }
      } catch {
        setError("加载简历时发生错误");
      } finally {
        setLoading(false);
      }
    };

    void fetchResumeData();
  }, [resume.id]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-white px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium text-gray-900">简历预览</h3>
            <p className="text-sm text-gray-500">{resume.fileName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 focus:outline-none"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <span className="ml-3 text-gray-600">加载中...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <svg className="w-12 h-12 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <p className="text-red-600">{error}</p>
              </div>
            </div>
          ) : parsedData ? (
            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{parsedData.candidateName}</h2>
                    <div className="mt-2 space-y-1">
                      <p className="text-gray-600 flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        {parsedData.candidateEmail}
                      </p>
                      {parsedData.phone && (
                        <p className="text-gray-600 flex items-center">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          {parsedData.phone}
                        </p>
                      )}
                      {parsedData.location && (
                        <p className="text-gray-600 flex items-center">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {parsedData.location}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">上传时间</p>
                    <p className="text-sm font-medium text-gray-900">{formatDate(resume.createdAt)}</p>
                  </div>
                </div>

                {parsedData.summary && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">个人简介</h4>
                    <p className="text-gray-700">{parsedData.summary}</p>
                  </div>
                )}
              </div>

              {/* Skills */}
              {parsedData.skills && parsedData.skills.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">技能</h3>
                  <div className="flex flex-wrap gap-2">
                    {parsedData.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-800"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Experience */}
              {parsedData.experience && parsedData.experience.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">工作经验</h3>
                  <div className="space-y-4">
                    {parsedData.experience.map((exp, index) => (
                      <div key={index} className="border-l-4 border-indigo-200 pl-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-gray-900">{exp.title}</h4>
                            <p className="text-indigo-600">{exp.company}</p>
                          </div>
                          <span className="text-sm text-gray-500">{exp.duration}</span>
                        </div>
                        {exp.description && (
                          <p className="mt-2 text-gray-700">{exp.description}</p>
                        )}
                        {exp.technologies && exp.technologies.length > 0 && (
                          <div className="mt-2">
                            <div className="flex flex-wrap gap-1">
                              {exp.technologies.map((tech, techIndex) => (
                                <span
                                  key={techIndex}
                                  className="inline-flex px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-700"
                                >
                                  {tech}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {exp.achievements && exp.achievements.length > 0 && (
                          <div className="mt-2">
                            <h5 className="text-sm font-medium text-gray-900">主要成就：</h5>
                            <ul className="mt-1 list-disc list-inside text-sm text-gray-700">
                              {exp.achievements.map((achievement, achIndex) => (
                                <li key={achIndex}>{achievement}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Education */}
              {parsedData.education && parsedData.education.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">教育背景</h3>
                  <div className="space-y-3">
                    {parsedData.education.map((edu, index) => (
                      <div key={index} className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-gray-900">{edu.degree}</h4>
                          <p className="text-indigo-600">{edu.university}</p>
                          {edu.major && <p className="text-gray-600">专业：{edu.major}</p>}
                          {edu.gpa && <p className="text-gray-600">GPA：{edu.gpa}</p>}
                        </div>
                        <span className="text-sm text-gray-500">{edu.year}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Projects */}
              {parsedData.projects && parsedData.projects.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">项目经验</h3>
                  <div className="space-y-4">
                    {parsedData.projects.map((project, index) => (
                      <div key={index} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-gray-900">{project.name}</h4>
                          <span className="text-sm text-gray-500">{project.duration}</span>
                        </div>
                        <p className="text-gray-700 mb-2">{project.description}</p>
                        {project.technologies && project.technologies.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {project.technologies.map((tech, techIndex) => (
                              <span
                                key={techIndex}
                                className="inline-flex px-2 py-1 text-xs font-medium rounded bg-indigo-100 text-indigo-700"
                              >
                                {tech}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Certifications */}
              {parsedData.certifications && parsedData.certifications.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">证书</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    {parsedData.certifications.map((cert, index) => (
                      <li key={index}>{cert}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Languages */}
              {parsedData.languages && parsedData.languages.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">语言</h3>
                  <div className="flex flex-wrap gap-2">
                    {parsedData.languages.map((lang, index) => (
                      <span
                        key={index}
                        className="inline-flex px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-800"
                      >
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {resume.tags && resume.tags.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">标签</h3>
                  <div className="flex flex-wrap gap-2">
                    {resume.tags.map((tag) => (
                      <span
                        key={tag.id}
                        className="inline-flex px-3 py-1 text-sm font-medium rounded-full bg-gray-100 text-gray-800"
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center py-12">
              <p className="text-gray-500">暂无简历数据</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}