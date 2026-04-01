import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useBranch } from '../context/BranchContext';
import { Plus, Search, Users as UsersIcon, Shield, UserCheck, User, Eye, ArrowLeft, Pencil, Trash2, X, Loader2 } from 'lucide-react';

const ROLE_COLORS = {
    admin: 'bg-primary/10 text-primary border-primary/20',
    team_leader: 'bg-accent/10 text-accent border-accent/20',
    employee: 'bg-green-100 text-green-700 border-green-200',
    admin_viewer: 'bg-gray-100 text-gray-700 border-gray-200',
};

const ROLE_LABELS = {
    admin: 'Admin',
    team_leader: 'Team Leader',
    employee: 'Employee',
    admin_viewer: 'Admin Viewer',
};

const Users = () => {
    const { user: currentUser } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const fromDashboard = location.state?.fromDashboard;
    const [users, setUsers] = useState([]);
    const [teamLeaders, setTeamLeaders] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleTab, setRoleTab] = useState('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'employee', assignedManager: '', branches: [] });
    const { activeBranch, branches: globalBranches } = useBranch();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [viewingUser, setViewingUser] = useState(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/users');
            setUsers(res.data);
            setTeamLeaders(res.data.filter(u => u.role === 'team_leader'));
        } catch (error) {
            console.error('Failed to fetch users');
        }
    };

    const handleOpenModal = (user = null) => {
        if (user) {
            setEditingUser(user);
            setFormData({
                name: user.name,
                email: user.email,
                password: '',
                role: user.role,
                assignedManager: user.assignedManager?._id || user.assignedManager || '',
                branches: user.branches || [],
            });
        } else {
            setEditingUser(null);
            setFormData({ name: '', email: '', password: '', role: 'employee', assignedManager: '', branches: [] });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const payload = { ...formData };
            if (!payload.password) delete payload.password;
            if (payload.role !== 'employee') delete payload.assignedManager;

            if (editingUser) {
                await api.put(`/users/${editingUser._id}`, payload);
            } else {
                await api.post('/users', payload);
            }
            setIsModalOpen(false);
            fetchUsers();
        } catch (error) {
            alert(error.response?.data?.message || 'Operation failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (user) => {
        if (!window.confirm(`Delete "${user.name}"? This cannot be undone.`)) return;
        setDeletingId(user._id);
        try {
            await api.delete(`/users/${user._id}`);
            fetchUsers();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to delete user');
        } finally {
            setDeletingId(null);
        }
    };

    const baseFiltered = users.filter(u => {
        const isGlobalRole = u.role === 'admin' || u.role === 'admin_viewer';
        return activeBranch === 'all' || isGlobalRole || (u.branches && u.branches.includes(activeBranch));
    });

    const filtered = baseFiltered.filter(u => {
        const q = searchTerm.toLowerCase();
        const matchSearch = u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
        const matchRole = roleTab === 'all' || u.role === roleTab;
        return matchSearch && matchRole;
    });

    const counts = {
        all: baseFiltered.length,
        admin: baseFiltered.filter(u => u.role === 'admin').length,
        team_leader: baseFiltered.filter(u => u.role === 'team_leader').length,
        employee: baseFiltered.filter(u => u.role === 'employee').length,
        admin_viewer: baseFiltered.filter(u => u.role === 'admin_viewer').length,
    };

    const tabs = [
        { key: 'all', label: 'All Users', icon: <UsersIcon size={14} /> },
        { key: 'admin', label: 'Admins', icon: <Shield size={14} /> },
        { key: 'team_leader', label: 'Team Leaders', icon: <UserCheck size={14} /> },
        { key: 'employee', label: 'Employees', icon: <User size={14} /> },
        { key: 'admin_viewer', label: 'Viewers', icon: <Eye size={14} /> },
    ];

    return (
        <div className="space-y-3">
            {/* Sticky header */}
            <div className="sticky top-0 z-10 bg-gray-50 pb-2 space-y-2">
                {/* Title row */}
                <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                        {fromDashboard && (
                            <button
                                onClick={() => navigate('/')}
                                className="flex items-center gap-1 text-primary text-xs font-bold uppercase tracking-wider mb-1"
                            >
                                <ArrowLeft size={12} /> Back
                            </button>
                        )}
                        <h1 className="text-lg font-bold text-gray-800 leading-tight">User Management</h1>
                        <p className="text-gray-400 text-xs mt-0.5">Manage admins, team leaders, and employees.</p>
                    </div>
                    {currentUser?.role !== 'admin_viewer' && (
                        <button
                            onClick={() => handleOpenModal()}
                            className="flex items-center gap-1.5 bg-primary text-white px-3 py-2 rounded-xl font-bold text-xs shadow-md shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all shrink-0"
                        >
                            <Plus size={15} />
                            <span className="hidden sm:inline">Create User</span>
                            <span className="sm:hidden">Add</span>
                        </button>
                    )}
                </div>

                {/* Search + mobile dropdown filter row */}
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {/* Dropdown — mobile only */}
                    <select
                        className="sm:hidden border border-gray-200 rounded-xl bg-white px-2 py-2 text-xs font-bold text-gray-600 outline-none shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary shrink-0"
                        value={roleTab}
                        onChange={e => setRoleTab(e.target.value)}
                    >
                        {tabs.map(tab => (
                            <option key={tab.key} value={tab.key}>
                                {tab.label} ({counts[tab.key]})
                            </option>
                        ))}
                    </select>
                </div>

                {/* Tab pills — desktop only */}
                <div className="hidden sm:flex gap-1 bg-gray-100 p-1 rounded-xl overflow-x-auto scrollbar-none">
                    {tabs.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setRoleTab(tab.key)}
                            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap shrink-0 ${
                                roleTab === tab.key
                                    ? 'bg-white text-primary shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            {tab.icon}
                            {tab.label}
                            <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ${
                                roleTab === tab.key ? 'bg-primary/10 text-primary' : 'bg-gray-200 text-gray-500'
                            }`}>{counts[tab.key]}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-auto max-h-[60vh]">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="sticky top-0 bg-gray-50 text-left p-3 text-xs font-bold text-gray-400 uppercase tracking-wider w-8">#</th>
                                <th className="sticky top-0 bg-gray-50 text-left p-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="sticky top-0 bg-gray-50 text-left p-3 text-xs font-bold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Branch</th>
                                <th className="sticky top-0 bg-gray-50 text-left p-3 text-xs font-bold text-gray-500 uppercase tracking-wider w-28">Role</th>
                                <th className="sticky top-0 bg-gray-50 text-left p-3 text-xs font-bold text-gray-500 uppercase tracking-wider hidden md:table-cell">Manager</th>
                                <th className="sticky top-0 bg-gray-50 text-right p-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filtered.length > 0 ? (
                                filtered.map((user, idx) => (
                                    <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-3 text-xs text-gray-400 font-mono">{idx + 1}</td>
                                        <td className="p-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-xs flex-shrink-0 border border-primary/20">
                                                    {user.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="font-bold text-gray-800 text-sm truncate">{user.name}</div>
                                                    <div className="text-[10px] text-gray-400 truncate max-w-[110px] sm:max-w-none">{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-3 hidden sm:table-cell">
                                            {user.branches && user.branches.length > 0 ? (
                                                <div className="flex flex-wrap gap-1">
                                                    {user.branches.map(b => (
                                                        <span key={b} className="inline-flex items-center px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[9px] font-black uppercase border border-primary/20">
                                                            {b}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : <span className="text-gray-300 text-xs">—</span>}
                                        </td>
                                        <td className="p-3 w-28">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border whitespace-nowrap ${ROLE_COLORS[user.role] || 'bg-gray-100 text-gray-600'}`}>
                                                {ROLE_LABELS[user.role] || user.role}
                                            </span>
                                        </td>
                                        <td className="p-3 hidden md:table-cell text-sm text-gray-500">
                                            {user.assignedManager?.name
                                                ? <span className="flex items-center gap-1 text-xs">
                                                    <UserCheck size={12} className="text-primary" />
                                                    {user.assignedManager.name}
                                                </span>
                                                : <span className="text-gray-300">—</span>}
                                        </td>
                                        <td className="p-3">
                                            <div className="flex justify-end gap-1.5">
                                                {/* View button — only on mobile where columns are hidden */}
                                                <button
                                                    onClick={() => setViewingUser(user)}
                                                    className="sm:hidden p-1.5 text-gray-500 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-lg transition-all"
                                                >
                                                    <Eye size={14} />
                                                </button>
                                                {currentUser?.role !== 'admin_viewer' ? (
                                                    <>
                                                        <button
                                                            onClick={() => handleOpenModal(user)}
                                                            className="px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-primary bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-lg transition-all flex items-center gap-1"
                                                        >
                                                            <Pencil size={12} /> <span className="hidden sm:inline">Edit</span>
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(user)}
                                                            disabled={deletingId === user._id}
                                                            className="px-2.5 py-1.5 text-[10px] font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1"
                                                        >
                                                            {deletingId === user._id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                                                        </button>
                                                    </>
                                                ) : (
                                                    <div className="text-right text-gray-400 text-xs italic">View</div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="p-10 text-center">
                                        <UsersIcon size={36} className="text-gray-200 mx-auto mb-2" />
                                        <div className="text-gray-400 font-medium text-sm">No users found</div>
                                        <div className="text-gray-300 text-xs mt-1">Try adjusting your search or filter</div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="px-4 py-2.5 border-t bg-gray-50 text-xs text-gray-500">
                    Showing <span className="font-semibold text-gray-700">{filtered.length}</span> of <span className="font-semibold text-gray-700">{users.length}</span> users
                </div>
            </div>

            {/* View User Modal — shows hidden columns on mobile */}
            {viewingUser && (
                <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center p-4 z-50 backdrop-blur-sm" onClick={() => setViewingUser(null)}>
                    <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black border border-primary/20">
                                    {viewingUser.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <div className="font-bold text-gray-800 text-sm">{viewingUser.name}</div>
                                    <div className="text-[10px] text-gray-400">{viewingUser.email}</div>
                                </div>
                            </div>
                            <button onClick={() => setViewingUser(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={16} /></button>
                        </div>
                        <div className="p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Role</span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${ROLE_COLORS[viewingUser.role] || 'bg-gray-100 text-gray-600'}`}>
                                    {ROLE_LABELS[viewingUser.role] || viewingUser.role}
                                </span>
                            </div>
                            <div className="flex items-start justify-between gap-4">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider shrink-0">Branches</span>
                                <div className="flex flex-wrap gap-1 justify-end">
                                    {viewingUser.branches?.length > 0
                                        ? viewingUser.branches.map(b => (
                                            <span key={b} className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[9px] font-black uppercase border border-primary/20">{b}</span>
                                        ))
                                        : <span className="text-gray-300 text-xs">—</span>}
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Manager</span>
                                <span className="text-xs text-gray-600 font-medium">
                                    {viewingUser.assignedManager?.name || <span className="text-gray-300">—</span>}
                                </span>
                            </div>
                        </div>
                        {currentUser?.role !== 'admin_viewer' && (
                            <div className="p-4 border-t flex gap-2">
                                <button
                                    onClick={() => { setViewingUser(null); handleOpenModal(viewingUser); }}
                                    className="flex-1 py-2 text-xs font-black uppercase tracking-wider text-primary bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-xl transition-all flex items-center justify-center gap-1.5"
                                >
                                    <Pencil size={13} /> Edit
                                </button>
                                <button
                                    onClick={() => { setViewingUser(null); handleDelete(viewingUser); }}
                                    className="flex-1 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                                >
                                    <Trash2 size={13} /> Delete
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}


            {/* Create / Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                    <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-xl">
                        <h2 className="text-xl font-bold mb-5 text-gray-800 flex items-center gap-2">
                            {editingUser ? <Pencil size={18} /> : <Plus size={18} />}
                            {editingUser ? 'Edit User' : 'Create New User'}
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name *</label>
                                <input
                                    className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                                    placeholder="e.g. Rahul Sharma"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address *</label>
                                <input
                                    className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                                    placeholder="e.g. rahul@example.com"
                                    type="email"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    Password {editingUser && <span className="text-gray-400 font-normal text-xs">(leave blank to keep current)</span>}
                                </label>
                                <input
                                    className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                                    placeholder={editingUser ? 'Leave blank to keep current' : 'Set a secure password'}
                                    type="password"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Role *</label>
                                    <select
                                        className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white text-sm"
                                        value={formData.role}
                                        onChange={e => setFormData({ ...formData, role: e.target.value, assignedManager: '' })}
                                    >
                                        <option value="employee">Employee</option>
                                        <option value="team_leader">Team Leader</option>
                                        <option value="admin">Admin</option>
                                        <option value="admin_viewer">Admin Viewer</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Authorized Branches</label>
                                    <div className="flex flex-wrap gap-1.5 p-2 border border-gray-300 rounded-lg min-h-[42px] bg-gray-50/30 font-medium">
                                        {globalBranches.length === 0 ? (
                                            <span className="text-[10px] text-gray-400 italic">No branches defined</span>
                                        ) : globalBranches.map(b => (
                                            <button
                                                key={b}
                                                type="button"
                                                onClick={() => {
                                                    const newBranches = formData.branches.includes(b)
                                                        ? formData.branches.filter(x => x !== b)
                                                        : [...formData.branches, b];
                                                    setFormData({ ...formData, branches: newBranches });
                                                }}
                                                className={`text-[10px] px-2 py-0.5 rounded-full border transition-all ${
                                                    formData.branches.includes(b)
                                                        ? 'bg-primary text-white border-primary shadow-sm'
                                                        : 'bg-white text-gray-400 border-gray-200 hover:border-gray-400'
                                                }`}
                                            >
                                                {b}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Assigned Manager — only for Employee */}
                            {formData.role === 'employee' && (
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Assigned Manager (Team Leader)</label>
                                    <select
                                        className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white text-sm"
                                        value={formData.assignedManager}
                                        onChange={e => setFormData({ ...formData, assignedManager: e.target.value })}
                                    >
                                        <option value="">— No manager assigned —</option>
                                        {teamLeaders.map(tl => (
                                            <option key={tl._id} value={tl._id}>{tl.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting || !formData.name || !formData.email}
                                className="px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-opacity-90 shadow-lg shadow-primary/20 transition-all text-sm font-bold disabled:opacity-60"
                            >
                                {isSubmitting ? 'Saving...' : editingUser ? 'Save Changes' : 'Create User'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Users;
