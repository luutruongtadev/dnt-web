"use client";
import React from 'react';
import AiLiveAccount from '../components/AiLiveAccount';

const TestAiLiveAccountPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">AiLive Account Component Test</h1>
        <p className="text-gray-600">Testing the new AiLiveAccount component with Vietnamese design</p>
      </div>
      
      <AiLiveAccount />
      
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">Component Features:</h3>
        <ul className="text-blue-700 space-y-1">
          <li>• Green dotted border as specified in the design</li>
          <li>• Vietnamese text with English translations in parentheses</li>
          <li>• Proper color coding (orange notes, yellow hints)</li>
          <li>• Gray background for first and last columns</li>
          <li>• Responsive grid layout with 10 columns</li>
          <li>• Sample data row with colored currency values</li>
          <li>• Transfer button in the last column</li>
        </ul>
      </div>
    </div>
  );
};

export default TestAiLiveAccountPage;