"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import ResumeUpload from "~/components/resumes/ResumeUpload";

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

export default function ResumesPage() {
  const { data: session } = useSession();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [showUpload, setShowUpload] = useState(false);

  const fetchResumes = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/resumes");
      if (response.ok) {
        const data = await response.json() as { resumes: Resume[] };
        setResumes(data.resumes);
      } else {
        setError("Failed to fetch resumes");
      }
    } catch {
      setError("An error occurred while fetching resumes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchResumes();
  }, []);

  const handleUploadSuccess = (resume: {
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
  }) => {
    setSuccess(`Resume for ${resume.candidateName} uploaded successfully!`);
    setError("");
    setShowUpload(false);
    void fetchResumes(); // Refresh the list
  };

  const handleUploadError = (error: string) => {
    setError(error);
    setSuccess("");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PARSED":
        return "bg-green-100 text-green-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "FAILED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please sign in</h1>
          <Link href="/auth/signin" className="text-indigo-600 hover:text-indigo-500">
            Sign in to continue
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Resume Management</h1>
              <p className="mt-2 text-sm text-gray-600">
                Upload and manage candidate resumes
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowUpload(!showUpload)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded"
              >
                {showUpload ? "Cancel" : "Upload Resume"}
              </button>
              <Link
                href="/dashboard"
                className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Success/Error Messages */}
          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-800">{success}</p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Upload Section */}
          {showUpload && (
            <div className="mb-8">
              <ResumeUpload
                onUploadSuccess={handleUploadSuccess}
                onUploadError={handleUploadError}
              />
            </div>
          )}

          {/* Resumes List */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Uploaded Resumes ({resumes.length})
              </h3>
            </div>
            
            {loading ? (
              <div className="px-4 py-5 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600">Loading resumes...</p>
              </div>
            ) : resumes.length === 0 ? (
              <div className="px-4 py-5 text-center">
                <p className="text-sm text-gray-500">
                  No resumes uploaded yet. Click &quot;Upload Resume&quot; to get started.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {resumes.map((resume) => (
                  <li key={resume.id} className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                          <svg className="h-6 w-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {resume.candidateName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {resume.candidateEmail}
                            {resume.phone && ` • ${resume.phone}`}
                          </div>
                          <div className="text-xs text-gray-400">
                            {resume.fileName} • {formatDate(resume.createdAt)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(resume.status)}`}
                        >
                          {resume.status}
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {resume.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag.id}
                              className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800"
                            >
                              {tag.name}
                            </span>
                          ))}
                          {resume.tags.length > 3 && (
                            <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                              +{resume.tags.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}