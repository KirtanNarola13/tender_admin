import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BranchProvider, useBranch } from './context/BranchContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Users from './pages/Users';
import Inventory from './pages/Inventory';
import Projects from './pages/Projects';
import TaskDetails from './pages/TaskDetails';
import ProjectWizard from './pages/ProjectWizard';
import ProjectDetails from './pages/ProjectDetails';
import EditProjectWizard from './pages/EditProjectWizard';
import CategoryProjects from './pages/CategoryProjects';
import Sidebar from './components/Sidebar';
import Reports from './pages/Reports';
import TaskLedger from './pages/TaskLedger';
import TaskProducts from './pages/TaskProducts';
import TaskSteps from './pages/TaskSteps';
import ProductDetails from './pages/ProductDetails';
import PurchaseOrders from './pages/PurchaseOrders';
import BranchTabs from './components/BranchTabs';
import Branches from './pages/Branches';

import VerifyDashboard from './pages/VerifyDashboard';

import { useState } from 'react';
import { Menu } from 'lucide-react';

const ProtectedRoute = ({ children }) => {
  const { user, loading, logout } = useAuth();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  
  if (user.role !== 'admin' && user.role !== 'admin_viewer') {
    logout();
    return <Navigate to="/login" />;
  }

  return (
    <div
      className="flex bg-gray-50 overflow-x-hidden"
      style={{ height: '100dvh' }}
    >
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <div className="flex-1 flex flex-col min-w-0" style={{ height: '100dvh' }}>
        {/* Mobile Header */}
        <div className="md:hidden sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between z-[50] shrink-0">
            <div className="flex items-center gap-3">
              <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="p-2 -ml-2 rounded-lg hover:bg-gray-100 text-gray-600"
              >
                  <Menu size={24} />
              </button>
              <h1 className="text-xl font-bold text-primary">TMS Admin</h1>
            </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col bg-gray-50 min-h-0">
          {(location.pathname === '/' || 
            location.pathname.startsWith('/projects') || 
            location.pathname.startsWith('/tasks') || 
            location.pathname.startsWith('/users')) && 
           <BranchTabs />}
          <div className="flex-1 p-4 md:p-8 overflow-y-auto min-h-0 w-full relative">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <BranchProvider>
          <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
          <Route path="/projects/new" element={<ProtectedRoute><ProjectWizard /></ProtectedRoute>} />
          <Route path="/projects/category/:categoryName" element={<ProtectedRoute><CategoryProjects /></ProtectedRoute>} />
          <Route path="/projects/:id/edit" element={<ProtectedRoute><EditProjectWizard /></ProtectedRoute>} />
          <Route path="/projects/:id" element={<ProtectedRoute><ProjectDetails /></ProtectedRoute>} />
          <Route path="/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
          <Route path="/tasks/leader/:leaderId" element={<ProtectedRoute><TaskLedger /></ProtectedRoute>} />
          <Route path="/tasks/leader/:leaderId/project/:projectId" element={<ProtectedRoute><TaskProducts /></ProtectedRoute>} />
          <Route path="/tasks/leader/:leaderId/project/:projectId/product/:productId" element={<ProtectedRoute><TaskSteps /></ProtectedRoute>} />
          <Route path="/tasks/:id" element={<ProtectedRoute><TaskDetails /></ProtectedRoute>} />
          <Route path="/verify" element={<ProtectedRoute><VerifyDashboard /></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
          <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
          <Route path="/inventory/product/:id" element={<ProtectedRoute><ProductDetails /></ProtectedRoute>} />
          <Route path="/purchase-orders" element={<ProtectedRoute><PurchaseOrders /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
          <Route path="/branches" element={<ProtectedRoute><Branches /></ProtectedRoute>} />
          </Routes>
        </BranchProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
