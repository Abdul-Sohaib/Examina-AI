"use client";
import React, { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft } from "@deemlol/next-icons";

const UploadQuestionPaperPage: React.FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const userId = searchParams.get("userId") || "";
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || !userId) {
      setError("Please select a file and ensure you are logged in.");
      return;
    }

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("userId", userId);

    try {
      const response = await fetch(`${BACKEND_URL}/api/upload-question-paper`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload question paper.");
      }

      const data = await response.json();
      console.log("Upload successful:", data);

      // Redirect to a test page with the uploaded paper's questions (e.g., pass paperId)
      router.push(`/test?paperId=${data.paperId}`);
    } catch (error) {
        setError((error as Error).message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent flex justify-center flex-col items-center ">
      <div className="border-1 border-gray-500 rounded-md shadow-lg z-50">
      <header className="w-full max-w-4xl bg-white shadow-md rounded-lg p-4 flex justify-center items-center gap-10">
        <button onClick={() => router.push("/")} className="cursor-pointer">
        <ArrowLeft size={24} color="#000" />
        </button>
        <h1 className="text-2xl text-black upload">Upload Question Paper</h1>
        <div></div>
      </header>

      <div className="w-full max-w-4xl bg-white shadow-md rounded-lg p-6">
        <div className="flex flex-col items-center gap-4">
        
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="p-2 border-1 border-black rounded-md cursor-pointer"
            
          />
          
          {error && <p className="text-red-500">{error}</p>}
          <button
            onClick={handleUpload}
            disabled={uploading || !file}
            className={`p-2 text-lg font-bold text-black border border-black rounded-md shadow-md tracking-wider hover:bg-gray-100 explore transition duration-300 ${
              uploading || !file ? " cursor-not-allowed" : " cursor-pointer"
            }`}
          >
            {uploading ? "Uploading..." : "Upload and Start Test"}
          </button>
        </div>
      </div>
      </div>
    </div>
  );
};

export default UploadQuestionPaperPage;