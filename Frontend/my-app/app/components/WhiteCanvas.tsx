"use client";
import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface WhiteCanvasProps {
  isOpen: boolean;
  onClose: () => void;
}

const WhiteCanvas: React.FC<WhiteCanvasProps> = ({ isOpen, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastX, setLastX] = useState(0);
  const [lastY, setLastY] = useState(0);

  // Initialize canvas with gridlines and load saved drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas dimensions
    canvas.width = 800;
    canvas.height = 500;

    // Clear the canvas and set a light gray background
    ctx.fillStyle = "#F5F5F5"; // Light gray background for a professional look
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw gridlines
    const gridSize = 20; // Size of each grid square (20px)
    ctx.strokeStyle = "#D1D5DB"; // Light gray gridlines
    ctx.lineWidth = 0.5;

    // Vertical lines
    for (let x = 0; x <= canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    // Horizontal lines
    for (let y = 0; y <= canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Set drawing styles for the pen
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";

    // Load saved drawing from local storage
    const savedDrawing = localStorage.getItem("canvasDrawing");
    if (savedDrawing) {
      const img = new window.Image();
      img.src = savedDrawing;
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
      };
    }
  }, [isOpen]);

  // Start drawing
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    setLastX(x);
    setLastY(y);
  };

  // Draw on the canvas
  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.stroke();

    setLastX(x);
    setLastY(y);
  };

  // Stop drawing and save to local storage
  const stopDrawing = () => {
    setIsDrawing(false);

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Save the canvas content to local storage
    const dataUrl = canvas.toDataURL("image/png");
    localStorage.setItem("canvasDrawing", dataUrl);
  };

  // Clear the canvas and redraw gridlines
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear the canvas
    ctx.fillStyle = "#F5F5F5"; // Light gray background
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Redraw gridlines
    const gridSize = 40;
    ctx.strokeStyle = "#D1D5DB";
    ctx.lineWidth = 0.5;

    for (let x = 0; x <= canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    for (let y = 0; y <= canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    localStorage.removeItem("canvasDrawing");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className=" bg-transparent flex items-center justify-center z-50 text-black max-w-7xl w-full"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 30 }}
            className="bg-white p-6 rounded-xl shadow-2xl "
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-semibold text-black mb-4 input-text">
              Whiteboard Canvas
            </h2>
            <canvas
              ref={canvasRef}
              className="border border-black rounded-md shadow-sm"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseOut={stopDrawing}
            />
            <div className="flex gap-4 mt-4 justify-end">
              <button
                onClick={clearCanvas}
                className="p-2 text-lg font-bold text-black border border-black rounded-md shadow-md tracking-wider hover:bg-gray-100 explore transition duration-300 cursor-pointer"
              >
                Clear Canvas
              </button>
              <button
                onClick={onClose}
                className="p-2 text-lg font-bold text-black border border-black rounded-md shadow-md tracking-wider hover:bg-gray-100 explore transition duration-300 cursor-pointer"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WhiteCanvas;