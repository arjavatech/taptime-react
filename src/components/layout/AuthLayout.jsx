import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const AuthLayout = () => (
  <div className="flex min-h-screen bg-white">
    <Sidebar />
    {/* Desktop: ml-60 clears the fixed sidebar. Mobile: pt-16 clears the top bar. */}
    <main className="flex-1 lg:ml-60 pt-16 lg:pt-0 min-h-screen overflow-x-hidden">
      <Outlet />
    </main>
  </div>
);

export default AuthLayout;
