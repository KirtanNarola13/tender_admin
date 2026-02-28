import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Users from './pages/Users';
import Inventory from './pages/Inventory';
import Projects from './pages/Projects';
import TaskDetails from './pages/TaskDetails';
import ProjectWizard from './pages/ProjectWizard';
import ProjectDetails from './pages/ProjectDetails';
import Sidebar from './components/Sidebar';
import Reports from './pages/Reports';

import VerifyDashboard from './pages/VerifyDashboard';

import { useState } from 'react';
import { Menu } from 'lucide-react';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Mobile Header */}
        <div className="md:hidden bg-white border-b p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button 
                  onClick={() => setIsSidebarOpen(true)}
                  className="p-2 -ml-2 rounded-lg hover:bg-gray-100 text-gray-600"
              >
                  <Menu size={24} />
              </button>
              <h1 className="text-xl font-bold text-primary">TMS Admin</h1>
            </div>
            {/* Optional: Add user avatar or other quick actions here for mobile */}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-4 md:p-8 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
          <Route path="/projects/new" element={<ProtectedRoute><ProjectWizard /></ProtectedRoute>} />
          <Route path="/projects/:id" element={<ProtectedRoute><ProjectDetails /></ProtectedRoute>} />
          <Route path="/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
          <Route path="/tasks/:id" element={<ProtectedRoute><TaskDetails /></ProtectedRoute>} />
          <Route path="/verify" element={<ProtectedRoute><VerifyDashboard /></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
          <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
