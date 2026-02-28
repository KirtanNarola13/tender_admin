import { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Search, Users as UsersIcon, Shield, UserCheck, User } from 'lucide-react';

const ROLE_COLORS = {
    admin: 'bg-purple-100 text-purple-700 border-purple-200',
    team_leader: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    employee: 'bg-green-100 text-green-700 border-green-200',
};

const ROLE_LABELS = {
    admin: 'Admin',
    team_leader: 'Team Leader',
    employee: 'Employee',
};

const Users = () => {
    const [users, setUsers] = useState([]);
    const [teamLeaders, setTeamLeaders] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleTab, setRoleTab] = useState('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'employee', assignedManager: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

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
            });
        } else {
            setEditingUser(null);
            setFormData({ name: '', email: '', password: '', role: 'employee', assignedManager: '' });
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

    const filtered = users.filter(u => {
        const q = searchTerm.toLowerCase();
        const matchSearch = u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
        const matchRole = roleTab === 'all' || u.role === roleTab;
        return matchSearch && matchRole;
    });

    const counts = {
        all: users.length,
        admin: users.filter(u => u.role === 'admin').length,
        team_leader: users.filter(u => u.role === 'team_leader').length,
        employee: users.filter(u => u.role === 'employee').length,
    };

    const tabs = [
        { key: 'all', label: 'All Users', icon: <UsersIcon size={14} /> },
        { key: 'admin', label: 'Admins', icon: <Shield size={14} /> },
        { key: 'team_leader', label: 'Team Leaders', icon: <UserCheck size={14} /> },
        { key: 'employee', label: 'Employees', icon: <User size={14} /> },
    ];

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
                    <p className="text-gray-500 text-sm">Manage admins, team leaders, and employees.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
                >
                    <Plus size={18} /> Create User
                </button>
            </div>

            {/* Search + Role Tabs */}
            <div className="flex flex-wrap items-center gap-3 mb-5">
                <div className="relative flex-1 min-w-[200px]">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        className="w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                    {tabs.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setRoleTab(tab.key)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${roleTab === tab.key
                                    ? 'bg-white text-indigo-700 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {tab.icon}
                            {tab.label}
                            <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${roleTab === tab.key ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-200 text-gray-500'
                                }`}>{counts[tab.key]}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="text-left p-4 text-xs font-bold text-gray-400 uppercase tracking-wider w-10">#</th>
                                <th className="text-left p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="text-left p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Email</th>
                                <th className="text-left p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Role</th>
                                <th className="text-left p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Manager</th>
                                <th className="text-right p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filtered.length > 0 ? (
                                filtered.map((user, idx) => (
                                    <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4 text-xs text-gray-400 font-mono">{idx + 1}</td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm flex-shrink-0">
                                                    {user.name.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="font-semibold text-gray-800 text-sm">{user.name}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-gray-500 text-sm">{user.email}</td>
                                        <td className="p-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${ROLE_COLORS[user.role] || 'bg-gray-100 text-gray-600'}`}>
                                                {ROLE_LABELS[user.role] || user.role}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm text-gray-500">
                                            {user.assignedManager?.name
                                                ? <span className="flex items-center gap-1">
                                                    <UserCheck size={13} className="text-indigo-400" />
                                                    {user.assignedManager.name}
                                                </span>
                                                : <span className="text-gray-300">—</span>}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleOpenModal(user)}
                                                    className="px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors"
                                                >
                                                    ✏️ Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(user)}
                                                    disabled={deletingId === user._id}
                                                    className="px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors disabled:opacity-50"
                                                >
                                                    {deletingId === user._id ? '...' : '🗑 Delete'}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="p-12 text-center">
                                        <div className="text-gray-300 text-4xl mb-3">👥</div>
                                        <div className="text-gray-400 font-medium">No users found</div>
                                        <div className="text-gray-300 text-sm mt-1">Try adjusting your search or filter</div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="px-4 py-3 border-t bg-gray-50 text-sm text-gray-500">
                    Showing <span className="font-semibold text-gray-700">{filtered.length}</span> of <span className="font-semibold text-gray-700">{users.length}</span> users
                </div>
            </div>

            {/* Create / Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                    <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-xl">
                        <h2 className="text-xl font-bold mb-5 text-gray-800">
                            {editingUser ? '✏️ Edit User' : '➕ Create New User'}
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name *</label>
                                <input
                                    className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                    placeholder="e.g. Rahul Sharma"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address *</label>
                                <input
                                    className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
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
                                    className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                    placeholder={editingUser ? 'Leave blank to keep current' : 'Set a secure password'}
                                    type="password"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Role *</label>
                                <select
                                    className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-sm"
                                    value={formData.role}
                                    onChange={e => setFormData({ ...formData, role: e.target.value, assignedManager: '' })}
                                >
                                    <option value="employee">👷 Employee</option>
                                    <option value="team_leader">👨‍💼 Team Leader</option>
                                    <option value="admin">🛡 Admin</option>
                                </select>
                            </div>

                            {/* Assigned Manager — only for Employee */}
                            {formData.role === 'employee' && (
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Assigned Manager (Team Leader)</label>
                                    <select
                                        className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-sm"
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
                                className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm transition-colors text-sm font-semibold disabled:opacity-60"
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
