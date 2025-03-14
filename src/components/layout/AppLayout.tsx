
import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children?: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-black dark">
      {/* Sidebar Navigation */}
      <Sidebar />
      
      {/* Main Content Area - Full width now that right sidebar is removed */}
      <div className="flex">
        <div 
          className={cn(
            "flex-grow min-h-screen",
            "ml-[275px] lg:ml-[275px]"
          )}
        >
          {children || <Outlet />}
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
