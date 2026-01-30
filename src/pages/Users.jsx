import { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus } from 'lucide-react';

const Users = () => {
    const [users, setUsers] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'employee' });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/users?role=admin');
            setUsers(res.data);
        } catch (error) {
            console.error('Failed to fetch users');
        }
    };

    const handleOpenModal = (user = null) => {
        if (user) {
            setEditingUser(user);
            setFormData({ name: user.name, email: user.email, password: '', role: user.role });
        } else {
            setEditingUser(null);
            setFormData({ name: '', email: '', password: '', role: 'employee' });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async () => {
        try {
            if (editingUser) {
                await api.put(`/users/${editingUser._id}`, formData);
            } else {
                await api.post('/users', formData);
            }
            setIsModalOpen(false);
            fetchUsers();
            alert(editingUser ? 'User updated successfully' : 'User created successfully');
        } catch (error) {
            alert(error.response?.data?.message || 'Operation failed');
        }
    };

    const handleDelete = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;

        try {
            await api.delete(`/users/${userId}`);
            fetchUsers();
            alert('User deleted successfully');
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to delete user');
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">User Management</h1>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-primary text-white px-4 py-2 rounded flex items-center gap-2"
                >
                    <Plus size={20} /> Create User
                </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="bg-gray-50 border-b">
                            <th className="text-left p-4">Name</th>
                            <th className="text-left p-4">Email</th>
                            <th className="text-left p-4">Role</th>
                            <th className="text-left p-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Array.isArray(users) && users.map((user) => (
                            <tr key={user._id} className="border-b hover:bg-gray-50">
                                <td className="p-4">{user.name}</td>
                                <td className="p-4">{user.email}</td>
                                <td className="p-4 capitalize">{user.role.replace('_', ' ')}</td>
                                <td className="p-4 flex gap-3">
                                    <button
                                        onClick={() => handleOpenModal(user)}
                                        className="text-blue-500 hover:text-blue-700"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(user._id)}
                                        className="text-red-500 hover:text-red-700"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white p-6 rounded-lg w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">{editingUser ? 'Edit User' : 'Create New User'}</h2>
                        <input
                            className="w-full border p-2 rounded mb-4"
                            placeholder="Name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                        <input
                            className="w-full border p-2 rounded mb-4"
                            placeholder="Email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                        <input
                            className="w-full border p-2 rounded mb-4"
                            placeholder={editingUser ? "Password (leave blank to keep)" : "Password"}
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                        <select
                            className="w-full border p-2 rounded mb-4"
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        >
                            <option value="team_leader">Team Leader</option>
                            <option value="verify_team">Verify Team</option>
                            <option value="viewer">Viewer</option>
                            <option value="admin">Admin</option>
                        </select>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded">Cancel</button>
                            <button onClick={handleSubmit} className="px-4 py-2 bg-primary text-white rounded">
                                {editingUser ? 'Save Changes' : 'Create User'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Users;
