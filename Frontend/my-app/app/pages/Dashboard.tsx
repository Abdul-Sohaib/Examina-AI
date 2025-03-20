"use client";
import React from "react";
import Image from "next/image";
import stars from "@/public/images/stars.png";
import InputField from "../components/Inputfield"; // Ensure correct import path

export default function DashboardPage() {
  return (
    <div className="flex flex-col items-center gap-3 font-bold h-screen w-full relative">
      {/* Title */}
      <div className="flex flex-col items-center gap-2">
      <div className="flex items-center w-fit h-fit p-1 rounded-md border-2 border-black text-3xl tracking-wider gap-0.5 name">
        <span>Examina</span>
        <Image src={stars} alt="Stars" className="rounded-full bg-transparent w-9" />
        <span>AI</span>
      </div>

      {/* Subtitle */}
      <span className="text-xl text-black text-center">
        - A smart tool that helps students practice, analyze, and excel in exams with ease.
      </span>
      </div>

      {/* ✅ Remove ConversationContainer from here */}
      
      {/* Input Field - Fixed at Bottom */}
      <div className="w-full flex justify-center items-center">
        <InputField />
      </div>
    </div>
  );
}
