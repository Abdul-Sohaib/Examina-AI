"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useUser, SignedIn } from "@clerk/nextjs";
import logo from "@/public/images/file.svg";
import profilebg from "@/public/images/profilebg.png";
import { UserButton } from "@clerk/nextjs";
import Sidebar from "./Sidebar";

const Navbar = () => {
  const { user } = useUser();
  const [percentage, setPercentage] = useState<number | null>(null);
  const [hasTakenTest, setHasTakenTest] = useState<boolean>(true); // Track if the user has taken a test
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
  useEffect(() => {
    const fetchTestResult = async () => {
      if (!user) {
        console.log("User not available yet, skipping fetch.");
        return;
      }

      if (!user?.id) {
        console.log("User ID is undefined, skipping fetch.");
        setPercentage(0);
        setHasTakenTest(false);
        return;
      }

      console.log("Fetching test result for userId:", user.id);
      try {
        const response = await fetch(`${BACKEND_URL}/api/get-test-result?userId=${user.id}`);
        if (!response.ok) {
          if (response.status === 404) {
            console.log("No test result found for this user.");
            setPercentage(0);
            setHasTakenTest(false);
            return;
          }
          console.error("Response status:", response.status, response.statusText);
          const errorData = await response.text();
          console.error("Error response:", errorData);
          throw new Error("Failed to fetch test result");
        }
        const data = await response.json();
        console.log("Fetched test result:", data);
        setPercentage(data.percentage);
        setHasTakenTest(true);
      } catch (error) {
        if (error instanceof Error) {
          console.error("Error fetching test result:", error.message);
        } else {
          console.error("Error fetching test result:", error);
        }
        setPercentage(0);
        setHasTakenTest(false);
      }
    };

    fetchTestResult();
  }, [BACKEND_URL, user]);

  return (
    <SignedIn>
      <div className="flex justify-between items-center w-screen pl-4 h-fit">
        {/* Sidebar and Logo */}
        <div className="flex justify-center items-center gap-4 flex-row cursor-pointer">
          <Sidebar />
          <Image src={logo} alt="Logo" width={60} className="rounded-full cursor-pointer" />
        </div>

        {/* User Profile Section */}
        <div className="relative flex items-center justify-center group w-96 h-20 overflow-hidden">
          {/* Background Image (Hidden on Hover) */}
          <Image
            src={profilebg}
            alt="Profile Background"
            width={70}
            height={70}
            className="absolute rounded-full object-cover transition-opacity duration-300 group-hover:opacity-0 flex justify-center items-center"
          />

          {/* User Button (Slides Left on Hover) */}
          <div className="flex justify-center items-center">
            <div className="relative z-10 transition-transform transform group-hover:-translate-x-20 duration-500 flex justify-center items-center ease-in-out">
              <UserButton
                appearance={{
                  elements: {
                    userButtonAvatarBox: {
                      width: "2.5rem",
                      height: "2.5rem",
                      bottom: "0.2rem",
                      right: "0.2rem",
                      transition: "transform 1s ease-in-out",
                    },
                  },
                }}
              />
            </div>

            {/* Sliding Box (Appears AFTER the UserButton Moves) */}
            <div
              className="flex justify-center items-center flex-col gap-0.5 absolute left-0 w-fit text-black p-1 rounded-lg shadow-lg transition-all transform opacity-0 scale-90 translate-x-[-100%] delay-300 group-hover:opacity-100 group-hover:scale-100 group-hover:translate-x-36 border-2 border-black cursor-pointer"
              style={{ backgroundColor: "#E2E2E2" }}
            >
              <span className="text-sm username">Welcome, {user?.fullName}!</span>
              <div>
              <span className="text-red-600 username font-extrabold">Test Score=
  {hasTakenTest && percentage !== null ? `${Math.round(percentage)}%` : "No tests taken"}
</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SignedIn>
  );
};

export default Navbar;