import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, FolderKanban, ClipboardCheck, Users, Warehouse, LogOut, CheckCircle, BarChart3 } from 'lucide-react';
import clsx from 'clsx';

const Sidebar = () => {
    const { logout, user } = useAuth();
    const location = useLocation();

    const links = [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard },
        { name: 'Reports', path: '/reports', icon: BarChart3 },
        { name: 'Projects', path: '/projects', icon: FolderKanban },
        { name: 'Tasks', path: '/tasks', icon: ClipboardCheck },
        { name: 'Verify', path: '/verify', icon: CheckCircle }, // Verify Dashboard
        { name: 'Inventory', path: '/inventory', icon: Warehouse },
        { name: 'Users', path: '/users', icon: Users },
    ];

    return (
        <div className="w-64 bg-white shadow-lg flex flex-col h-screen sticky top-0">
            <div className="p-6 border-b">
                <h1 className="text-2xl font-bold text-primary">TMS Admin</h1>
                <p className="text-sm text-gray-500 mt-1">{user?.name}</p>
                <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
            </div>

            <nav className="flex-1 p-4 space-y-2">
                {links.map((link) => {
                    const Icon = link.icon;
                    const isActive = location.pathname === link.path;
                    return (
                        <Link
                            key={link.path}
                            to={link.path}
                            className={clsx(
                                'flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors',
                                isActive
                                    ? 'bg-blue-50 text-primary'
                                    : 'text-gray-600 hover:bg-gray-50'
                            )}
                        >
                            <Icon size={20} />
                            <span className="font-medium">{link.name}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t">
                <button
                    onClick={logout}
                    className="flex items-center space-x-3 px-4 py-3 w-full text-red-500 hover:bg-red-50 rounded-lg transition"
                >
                    <LogOut size={20} />
                    <span className="font-medium">Logout</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
