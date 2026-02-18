import { useState, useEffect } from 'react';
import api from '../services/api';
import {
    Eye,
    CheckCircle,
    XCircle,
    Search,
    Filter,
    Calendar,
    User,
    Briefcase
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Tasks = () => {
    const [tasks, setTasks] = useState([]);
    const [filteredTasks, setFilteredTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const navigate = useNavigate();

    useEffect(() => {
        fetchTasks();
    }, []);

    useEffect(() => {
        filterTasks();
    }, [tasks, searchQuery, statusFilter]);

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

    const filterTasks = () => {
        let result = tasks;

        // 1. Search Filter (Task Name, Project Name, Assignee Name)
        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            result = result.filter(task =>
                (task.title && task.title.toLowerCase().includes(lowerQuery)) ||
                (task.project?.name && task.project.name.toLowerCase().includes(lowerQuery)) ||
                (task.assignedTo?.name && task.assignedTo.name.toLowerCase().includes(lowerQuery))
            );
        }

        // 2. Status Filter
        if (statusFilter !== 'all') {
            result = result.filter(task => task.status === statusFilter);
        }

        setFilteredTasks(result);
    };

    const verifyTask = async (taskId, status, reason = '') => {
        if (!window.confirm(`Are you sure you want to ${status === 'verified' ? 'approve' : 'reject'} this task?`)) return;

        try {
            await api.post(`/tasks/${taskId}/verify`, { status, rejectionReason: reason });
            // Optimistic Update
            setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status: status } : t));
        } catch (error) {
            alert('Verification failed');
            fetchTasks(); // Revert on failure
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-800 border-green-200';
            case 'verified': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'submitted': return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'in-progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Task Management</h1>
                    <p className="text-gray-500 text-sm mt-1">Monitor and manage all project tasks</p>
                </div>
            </div>

            {/* Filters & Search Toolbar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">

                {/* Search Bar */}
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search project, assignee, or task..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Filter Dropdown */}
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <Filter className="text-gray-400" size={20} />
                    <select
                        className="w-full md:w-48 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="in-progress">In Progress</option>
                        <option value="submitted">Submitted</option>
                        <option value="completed">Completed</option>
                        <option value="verified">Verified</option>
                    </select>
                </div>
            </div>

            {/* Tasks Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-sm uppercase tracking-wider">Project Info</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-sm uppercase tracking-wider">Assignee</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-sm uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-sm uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredTasks.map((task) => (
                                <tr key={task._id} className="hover:bg-gray-50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2 font-medium text-gray-900">
                                                <Briefcase size={16} className="text-blue-500" />
                                                {task.project?.name || 'Unknown Project'}
                                            </div>
                                            <span className="text-xs text-gray-500 ml-6 flex items-center gap-1 mt-1">
                                                <Calendar size={12} />
                                                {task.project?.location || 'No Location'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                                                {task.assignedTo?.name ? task.assignedTo.name.charAt(0).toUpperCase() : '?'}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">
                                                    {task.assignedTo?.name || 'Unassigned'}
                                                </p>
                                                <p className="text-xs text-gray-500 capitalize">
                                                    {task.assignedTo?.role ? task.assignedTo.role.replace('_', ' ') : 'Employee'}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(task.status)} uppercase tracking-wide`}>
                                            {task.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => navigate(`/tasks/${task._id}`)}
                                                className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                                                title="View Details"
                                            >
                                                <Eye size={18} />
                                            </button>

                                            {task.status === 'submitted' && (
                                                <>
                                                    <button
                                                        onClick={() => verifyTask(task._id, 'verified')}
                                                        className="p-2 rounded-lg hover:bg-green-50 text-green-600 transition-colors"
                                                        title="Approve Task"
                                                    >
                                                        <CheckCircle size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => verifyTask(task._id, 'in-progress', 'Rejected')}
                                                        className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                                                        title="Reject Task"
                                                    >
                                                        <XCircle size={18} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredTasks.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center text-gray-400">
                                        <div className="flex flex-col items-center">
                                            <Search size={48} className="mb-4 text-gray-200" />
                                            <p className="text-lg font-medium">No tasks found</p>
                                            <p className="text-sm">Try adjusting your search or filters</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer / Pagination Placeholder */}
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 text-xs text-gray-500 flex justify-between items-center">
                    <span>Showing {filteredTasks.length} tasks</span>
                    {/* Add pagination here if needed later */}
                </div>
            </div>
        </div>
    );
};

export default Tasks;
