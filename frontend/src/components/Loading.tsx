import React from 'react';

const Loading: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => (
  <div className="flex flex-col items-center justify-center min-h-screen w-full bg-transparent">
    <div className="relative flex items-center justify-center mb-10">
      {/* SVG loader for a modern, clean look */}
      <svg className="w-20 h-20" viewBox="0 0 50 50">
        <circle
          className="opacity-20"
          cx="25"
          cy="25"
          r="20"
          stroke="#3b82f6"
          strokeWidth="6"
          fill="none"
        />
        <circle
          className="animate-[dash_1.5s_ease-in-out_infinite]"
          cx="25"
          cy="25"
          r="20"
          stroke="#3b82f6"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          strokeDasharray="90 150"
          strokeDashoffset="0"
        />
        <circle
          className="animate-[pulse_1.5s_ease-in-out_infinite]"
          cx="25"
          cy="25"
          r="10"
          fill="#3b82f6"
          opacity="0.2"
        />
      </svg>
      <style>{`
        @keyframes dash {
          0% { stroke-dasharray: 1, 200; stroke-dashoffset: 0; }
          50% { stroke-dasharray: 90, 150; stroke-dashoffset: -35; }
          100% { stroke-dasharray: 90, 150; stroke-dashoffset: -124; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
    <div className="text-xl text-blue-500 font-semibold tracking-wide text-center">
      {message}
    </div>
  </div>
);

export default Loading;
