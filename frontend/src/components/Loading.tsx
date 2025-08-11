import React from 'react';
import { Loading as LoadingUI } from '@/components/ui';

interface LoadingProps {
  message?: string;
  size?: "sm" | "md" | "lg";
  fullScreen?: boolean;
}

const Loading: React.FC<LoadingProps> = ({ 
  message = 'Loading...', 
  size = "lg",
  fullScreen = true 
}) => {
  if (fullScreen) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen w-full">
        <LoadingUI size={size} text={message} className="mb-4" />
      </div>
    );
  }

  return <LoadingUI size={size} text={message} />;
};

export default Loading;
