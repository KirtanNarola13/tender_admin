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
                'flex flex-col bg-white shrink-0 border-r border-gray-100',
                'fixed top-0 left-0 sidebar-height w-[260px] shadow-xl transition-transform duration-300 ease-in-out',
                isOpen ? 'translate-x-0' : '-translate-x-full',
                'md:static md:translate-x-0 md:w-56 md:shadow-none md:h-full',
            )}
            style={{ zIndex: 70 }}
            >
                {/* Logo */}
                <div className="px-5 py-5 flex justify-between items-center shrink-0">
                    <div>
                        <h1 className="text-base font-extrabold tracking-tight text-gray-900">KG INFRA</h1>
                        <p className="text-[11px] text-gray-400 mt-0.5 truncate max-w-[160px]">{user?.name}</p>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="md:hidden p-1 rounded-lg text-gray-400 hover:bg-gray-100"
                    >
                        <X size={18} />
                    </button>
                </div>

                <nav className="flex-1 px-3 pb-4 space-y-0.5 overflow-y-auto">
                    {links.map((link) => {
                        const Icon = link.icon;
                        const isActive = location.pathname === link.path;
                        return (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={clsx(
                                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150',
                                    isActive
                                        ? 'bg-primary/8 text-primary font-semibold'
                                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800 font-medium'
                                )}
                            >
                                <Icon size={17} strokeWidth={isActive ? 2.2 : 1.8} />
                                <span>{link.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="px-3 py-4 border-t border-gray-100 shrink-0">
                    <button
                        onClick={logout}
                        className="flex items-center gap-3 px-3 py-2.5 w-full text-sm text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-150 font-medium"
                    >
                        <LogOut size={17} strokeWidth={1.8} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
