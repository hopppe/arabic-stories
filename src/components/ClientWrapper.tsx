'use client';

import React from 'react';
import StoryReader from './StoryReader';

const ClientWrapper: React.FC = () => {
  return (
    <main className="min-h-screen">
      <StoryReader />
    </main>
  );
};

export default ClientWrapper; 