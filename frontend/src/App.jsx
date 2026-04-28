import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Shield } from 'lucide-react';
import RegisterAsset from './pages/RegisterAsset';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
        {/* Navigation */}
        <nav className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <Shield className="w-8 h-8 text-[#38BDF8]" />
                <span className="ml-2 text-xl font-bold text-slate-800">
                  Guardian <span className="text-[#38BDF8]">AI</span>
                </span>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="py-10">
          <Routes>
            <Route path="/" element={<RegisterAsset />} />
            <Route path="/dashboard" element={
              <div className="text-center p-20 text-slate-500">
                <h2 className="text-2xl">Dashboard coming in Phase 3</h2>
              </div>
            } />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
