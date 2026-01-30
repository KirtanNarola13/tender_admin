import { useState, useEffect } from 'react';
import api from '../services/api';
import { Eye, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Tasks = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            const res = await api.get('/tasks');
            setTasks(res.data);
        } catch (error) {
            console.error('Failed to fetch tasks', error);
        } finally {
            setLoading(false);
        }
    };

    const verifyTask = async (taskId, status, reason = '') => {
        try {
            await api.post(`/tasks/${taskId}/verify`, { status, rejectionReason: reason });
            fetchTasks(); // Refresh
            alert(`Task ${status}`);
        } catch (error) {
            alert('Verification failed');
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Tasks Overview</h1>
                <button className="bg-primary text-white px-4 py-2 rounded">
                    + Assign New Task
                </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="bg-gray-50 border-b">
                            <th className="text-left p-4 font-medium text-gray-500">Site</th>
                            <th className="text-left p-4 font-medium text-gray-500">Project</th>
                            <th className="text-left p-4 font-medium text-gray-500">Team Leader</th>
                            <th className="text-left p-4 font-medium text-gray-500">Status</th>
                            <th className="text-left p-4 font-medium text-gray-500">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Array.isArray(tasks) && tasks.map((task) => (
                            <tr key={task._id} className="border-b hover:bg-gray-50">
                                <td className="p-4">{task.project?.location}</td>
                                <td className="p-4">{task.project?.name}</td>
                                <td className="p-4">{task.assignedTo?.name || 'Unassigned'}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase
                    ${task.status === 'verified' ? 'bg-green-100 text-green-800' :
                                            task.status === 'submitted' ? 'bg-orange-100 text-orange-800' :
                                                'bg-gray-100 text-gray-800'}`}>
                                        {task.status}
                                    </span>
                                </td>
                                <td className="p-4 flex space-x-2">
                                    {/* View Details / Verify Button */}
                                    <button onClick={() => navigate(`/tasks/${task._id}`)} className="text-blue-500 hover:text-blue-700">
                                        <Eye size={18} />
                                    </button>
                                    {task.status === 'submitted' && (
                                        <>
                                            <button onClick={() => verifyTask(task._id, 'verified')} className="text-green-500 hover:text-green-700" title="Approve">
                                                <CheckCircle size={18} />
                                            </button>
                                            <button onClick={() => verifyTask(task._id, 'in-progress', 'Rejected')} className="text-red-500 hover:text-red-700" title="Reject">
                                                <XCircle size={18} />
                                            </button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Tasks;
