import React from 'react';

const Loading: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => (
  <div className="p-8 text-center text-gray-500 animate-pulse">
    {message}
  </div>
);

export default Loading;
