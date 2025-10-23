"use client";
import React, { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import sidebarIcon from "@/public/images/sidebar.svg";
import close from "@/public/images/close.png";
import { useAuth } from "@clerk/nextjs";

type SearchHistoryItem = {
  _id: string;
  option: string;
  query: string;
};

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const { userId } = useAuth();
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
  // Function to fetch search history
  const fetchHistory = useCallback(async () => {
    if (!userId) return;

    try {
      console.log("🔍 Fetching search history for user:", userId);
      const res = await fetch(`${BACKEND_URL}/api/searchHistory/latest/${userId}`);
      
      if (!res.ok) {
        console.error(` API error! Status: ${res.status}`);
        return;
      }

      const data = await res.json();
      console.log(" Search history fetched:", data);
      setSearchHistory(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(" Error fetching search history:", error);
    }
  }, [BACKEND_URL, userId]);

  // Fetch history on component mount & when userId changes
  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  console.log("Current User ID:", userId);

  return (
    <>
      <div className="flex justify-between items-center">
        <button onClick={() => setIsOpen(true)} className="cursor-pointer relative z-50">
          <Image src={sidebarIcon} alt="Sidebar Toggle" className="w-8 cursor-pointer" />
        </button>

        {isOpen && (
          <div className="fixed top-0 left-0 w-full h-full bg-transparent bg-opacity-40 z-40" onClick={() => setIsOpen(false)} />
        )}

        <div
          className={`fixed top-0 left-0 h-full w-72 bg-white text-black shadow-lg rounded-e-lg border-2 border-black z-50 transform ${
            isOpen ? "translate-x-0" : "-translate-x-full"
          } transition-transform duration-300 ease-in-out`}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setIsOpen(false)}
            className="relative left-52 mt-7 flex justify-center items-center text-lg close"
          >
            <span>Close</span>
            <Image src={close} alt="Close Sidebar" className="w-10" />
          </button>

          <div className="p-4 flex flex-col gap-4">
            <h2 className="text-xl font-semibold">Search History</h2>

            {/* Scrollable Search History */}
            <div className="h-[80vh] scroll-container overflow-y-auto border-t border-black p-2">
              <ul>
                {searchHistory.length > 0 ? (
                  searchHistory.map((item) => (
                    <li key={item._id} className="py-2 border-b border-gray-300">
                      <span className="font-semibold">{item.option}:</span> {item.query}
                    </li>
                  ))
                ) : (
                  <li className="py-2 text-gray-500">No search history found</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
