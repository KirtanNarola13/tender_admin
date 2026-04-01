import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, FolderKanban, ClipboardCheck, Building2, Users, Warehouse, LogOut, BarChart3, X, ShoppingCart } from 'lucide-react';
import clsx from 'clsx';
import { useEffect } from 'react';

const Sidebar = ({ isOpen, setIsOpen }) => {
    const { logout, user } = useAuth();
    const location = useLocation();

    useEffect(() => {
        setIsOpen(false);
    }, [location.pathname, setIsOpen]);

    // Lock body scroll when mobile sidebar is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            document.body.style.position = 'fixed';
            document.body.style.width = '100%';
        } else {
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.width = '';
        }
        return () => {
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.width = '';
        };
    }, [isOpen]);

    const links = [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard },
        { name: 'Reports', path: '/reports', icon: BarChart3 },
        { name: 'Projects', path: '/projects', icon: FolderKanban },
        { name: 'Tasks', path: '/tasks', icon: ClipboardCheck },
        { name: 'Inventory', path: '/inventory', icon: Warehouse },
        { name: 'Purchase Orders', path: '/purchase-orders', icon: ShoppingCart },
        { name: 'Users', path: '/users', icon: Users },
        { name: 'Branches', path: '/branches', icon: Building2 },
    ];

    return (
        <>
            {/* Overlay: only rendered in DOM when open, avoids stacking context pollution */}
            {isOpen && (
                <div
                    className="md:hidden"
                    style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 60 }}
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/*
              Sidebar:
              - Mobile: position fixed, 280px wide, 100dvh tall, slides in/out via translateX
              - Desktop (md+): position static, normal flow, no transform
              - NO inline style position — use sidebar-mobile / sidebar-desktop CSS classes
                so Tailwind md: overrides work correctly (inline styles block Tailwind overrides)
            */}
            <aside className={clsx(
                // shared
                'flex flex-col bg-white shrink-0',
                // mobile: fixed drawer
                'fixed top-0 left-0 sidebar-height w-[280px] shadow-xl transition-transform duration-300 ease-in-out',
                isOpen ? 'translate-x-0' : '-translate-x-full',
                // desktop: static in flow
                'md:static md:translate-x-0 md:w-64 md:shadow-none md:h-full',
            )}
            style={{ zIndex: 70 }}
            >
                <div className="p-5 border-b flex justify-between items-start shrink-0">
                    <div>
                        <h1 className="text-xl font-bold text-primary">KG INFRA Admin</h1>
                        <p className="text-sm text-gray-500 mt-1 truncate max-w-[180px]">{user?.name}</p>
                        <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="md:hidden p-1 rounded-lg text-gray-500 hover:bg-gray-100"
                    >
                        <X size={20} />
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {links.map((link) => {
                        const Icon = link.icon;
                        const isActive = location.pathname === link.path;
                        return (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={clsx(
                                    'flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200',
                                    isActive
                                        ? 'bg-primary-light text-primary border border-primary/20 shadow-sm'
                                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                )}
                            >
                                <Icon size={20} />
                                <span className="font-medium">{link.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t shrink-0">
                    <button
                        onClick={logout}
                        className="flex items-center space-x-3 px-4 py-3 w-full text-red-500 hover:bg-red-50 rounded-lg transition"
                    >
                        <LogOut size={20} />
                        <span className="font-medium">Logout</span>
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
