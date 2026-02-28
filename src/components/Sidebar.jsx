import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, FolderKanban, ClipboardCheck, Users, Warehouse, LogOut, CheckCircle, BarChart3, X } from 'lucide-react';
import clsx from 'clsx';
import { useEffect } from 'react';

const Sidebar = ({ isOpen, setIsOpen }) => {
    const { logout, user } = useAuth();
    const location = useLocation();

    // Close sidebar on path change (mobile)
    useEffect(() => {
        setIsOpen(false);
    }, [location.pathname, setIsOpen]);

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
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar Container */}
            <div className={clsx(
                "fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl flex flex-col h-screen transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="p-6 border-b flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold text-primary">TMS Admin</h1>
                        <p className="text-sm text-gray-500 mt-1 truncate max-w-[180px]">{user?.name}</p>
                        <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
                    </div>

                    {/* Mobile Close Button */}
                    <button
                        onClick={() => setIsOpen(false)}
                        className="md:hidden p-1 rounded-lg text-gray-500 hover:bg-gray-100"
                    >
                        <X size={20} />
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
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
        </>
    );
};

export default Sidebar;
