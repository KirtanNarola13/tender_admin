import { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus } from 'lucide-react';

const Users = () => {
    const [users, setUsers] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'employee' });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/users?role=admin'); // Currently endpoint returns all
            setUsers(res.data);
        } catch (error) {
            console.error('Failed to fetch users');
        }
    };

    const createUser = async () => {
        try {
            await api.post('/users', newUser); // Using admin route
            setIsModalOpen(false);
            setNewUser({ name: '', email: '', password: '', role: 'employee' });
            fetchUsers();
        } catch (error) {
            alert('Failed to create user');
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">User Management</h1>
                <button
                    onClick={() => setIsModalOpen(true)}
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
                                <td className="p-4">
                                    <button className="text-blue-500 hover:text-blue-700">Edit</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white p-6 rounded-lg w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Create New User</h2>
                        <input
                            className="w-full border p-2 rounded mb-4"
                            placeholder="Name"
                            value={newUser.name}
                            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                        />
                        <input
                            className="w-full border p-2 rounded mb-4"
                            placeholder="Email"
                            type="email"
                            value={newUser.email}
                            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                        />
                        <input
                            className="w-full border p-2 rounded mb-4"
                            placeholder="Password"
                            type="password"
                            value={newUser.password}
                            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                        />
                        <select
                            className="w-full border p-2 rounded mb-4"
                            value={newUser.role}
                            onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                        >
                            <option value="team_leader">Team Leader</option>
                            <option value="verify_team">Verify Team</option>
                            <option value="viewer">Viewer</option>
                            <option value="admin">Admin</option>
                        </select>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded">Cancel</button>
                            <button onClick={createUser} className="px-4 py-2 bg-primary text-white rounded">Create</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Users;
