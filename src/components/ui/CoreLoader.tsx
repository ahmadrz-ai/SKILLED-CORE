"use client";

import React from 'react';

// Light-theme page skeleton loader — replaces the dark CoreLoader
const CoreLoader = () => {
  return (
    <div className="min-h-screen w-full" style={{ backgroundColor: '#F3F4F6' }}>
      {/* Top bar skeleton */}
      <div className="h-14 border-b flex items-center px-6 gap-4" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
        <div className="h-7 w-32 rounded-md animate-pulse" style={{ backgroundColor: '#E5E7EB' }} />
        <div className="flex-1" />
        <div className="h-7 w-48 rounded-full animate-pulse" style={{ backgroundColor: '#E5E7EB' }} />
        <div className="h-7 w-7 rounded-full animate-pulse" style={{ backgroundColor: '#E5E7EB' }} />
      </div>

      <div className="flex">
        {/* Sidebar skeleton */}
        <div className="hidden md:flex flex-col w-56 min-h-screen border-r p-4 gap-3 flex-shrink-0"
          style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
          <div className="h-10 w-10 rounded-full mx-auto animate-pulse mb-2" style={{ backgroundColor: '#E5E7EB' }} />
          <div className="h-4 w-28 rounded animate-pulse mx-auto" style={{ backgroundColor: '#E5E7EB' }} />
          <div className="h-3 w-20 rounded animate-pulse mx-auto mb-4" style={{ backgroundColor: '#F3F4F6' }} />
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-2 py-2 rounded-lg">
              <div className="h-4 w-4 rounded animate-pulse" style={{ backgroundColor: '#E5E7EB' }} />
              <div className="h-4 rounded animate-pulse flex-1" style={{ backgroundColor: '#E5E7EB' }} />
            </div>
          ))}
        </div>

        {/* Main content skeleton */}
        <div className="flex-1 p-6 max-w-2xl mx-auto">
          {/* Post creator */}
          <div className="rounded-xl border p-4 mb-4 flex items-center gap-3" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
            <div className="h-10 w-10 rounded-full flex-shrink-0 animate-pulse" style={{ backgroundColor: '#E5E7EB' }} />
            <div className="flex-1 h-10 rounded-full animate-pulse" style={{ backgroundColor: '#F3F4F6' }} />
          </div>

          {/* Post cards */}
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-xl border p-5 mb-3" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full flex-shrink-0 animate-pulse" style={{ backgroundColor: '#E5E7EB' }} />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-36 rounded animate-pulse" style={{ backgroundColor: '#E5E7EB' }} />
                  <div className="h-3 w-24 rounded animate-pulse" style={{ backgroundColor: '#F3F4F6' }} />
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <div className="h-4 rounded animate-pulse" style={{ backgroundColor: '#F3F4F6' }} />
                <div className="h-4 rounded animate-pulse w-4/5" style={{ backgroundColor: '#F3F4F6' }} />
                <div className="h-4 rounded animate-pulse w-3/5" style={{ backgroundColor: '#F3F4F6' }} />
              </div>
              <div className="flex gap-2 pt-3 border-t" style={{ borderColor: '#F3F4F6' }}>
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="h-7 w-16 rounded-full animate-pulse" style={{ backgroundColor: '#F3F4F6' }} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Right sidebar skeleton */}
        <div className="hidden lg:flex flex-col w-64 p-4 gap-3 flex-shrink-0">
          <div className="rounded-xl border p-4" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
            <div className="h-16 rounded-lg mb-8 animate-pulse" style={{ backgroundColor: '#E5E7EB' }} />
            <div className="h-4 w-28 rounded animate-pulse mb-1.5" style={{ backgroundColor: '#E5E7EB' }} />
            <div className="h-3 w-20 rounded animate-pulse mb-4" style={{ backgroundColor: '#F3F4F6' }} />
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex justify-between py-2">
                <div className="h-3 w-24 rounded animate-pulse" style={{ backgroundColor: '#F3F4F6' }} />
                <div className="h-3 w-8 rounded animate-pulse" style={{ backgroundColor: '#E5E7EB' }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoreLoader;
