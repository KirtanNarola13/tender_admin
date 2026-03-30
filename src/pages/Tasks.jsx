import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
    Search,
    Filter,
    ChevronRight,
    FolderKanban,
    CheckCircle,
    Clock,
    AlertCircle,
} from 'lucide-react';
import api from '../services/api';

// ── Status colour helper (Synced from Mobile) ─────────
const getStatusColors = (status) => {
    switch (status) {
        case 'verified':
        case 'completed':
            return {
                badge: 'bg-task-done-bg text-task-done-fg border border-task-done-fg/20',
                dot: 'bg-task-done-fg',
                label: status === 'verified' ? 'Verified' : 'Completed',
            };
        case 'submitted':
            return {
                badge: 'bg-task-submitted-bg text-task-submitted-fg border border-task-submitted-fg/20',
                dot: 'bg-task-submitted-fg',
                label: 'Submitted',
            };
        case 'in-progress':
            return {
                badge: 'bg-task-working-bg text-task-working-fg border border-task-working-fg/20',
                dot: 'bg-task-working-fg',
                label: 'In Progress',
            };
        case 'locked':
            return {
                badge: 'bg-task-locked-bg text-task-locked-fg border border-task-locked-fg/20',
                dot: 'bg-task-locked-fg',
                label: 'Locked',
            };
        case 'pending':
        default:
            return {
                badge: 'bg-task-pending-bg text-task-pending-fg border border-task-pending-fg/20',
                dot: 'bg-task-pending-fg',
                label: 'Pending',
            };
    }
};

const Tasks = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const initialStatus = searchParams.get('status') || 'all';

    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState(initialStatus);

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

    // Group tasks by Team Leader (for the top-level list view)
    const groupedData = useMemo(() => {
        const filtered = tasks.filter(task => {
            const q = searchQuery.toLowerCase();
            const matchSearch =
                !q ||
                (task.stepName && task.stepName.toLowerCase().includes(q)) ||
                (task.project?.name && task.project.name.toLowerCase().includes(q)) ||
                (task.assignedTo?.name && task.assignedTo.name.toLowerCase().includes(q));
            const matchStatus = statusFilter === 'all' || task.status === statusFilter;
            return matchSearch && matchStatus;
        });

        return filtered.reduce((acc, task) => {
            const teamName = task.assignedTo?.name || 'Unassigned Leader';
            const teamId = task.assignedTo?._id || 'unassigned';
            const role = task.assignedTo?.role ? task.assignedTo.role.replace('_', ' ') : 'Team Leader';

            if (!acc[teamId]) {
                acc[teamId] = {
                    name: teamName,
                    role: role,
                    taskCount: 0,
                    pendingCount: 0,
                    workingCount: 0,
                    doneCount: 0,
                    projectNames: new Set(),
                };
            }
            acc[teamId].taskCount++;
            if (['pending', 'locked'].includes(task.status)) acc[teamId].pendingCount++;
            else if (['in-progress', 'submitted'].includes(task.status)) acc[teamId].workingCount++;
            else if (['completed', 'verified'].includes(task.status)) acc[teamId].doneCount++;
            if (task.project?.name) acc[teamId].projectNames.add(task.project.name);
            return acc;
        }, {});
    }, [tasks, searchQuery, statusFilter]);

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Task Management</h1>
                <p className="text-gray-500 text-sm mt-1">Click a team leader to view their ledger.</p>
            </div>

            {/* Filters & Search Toolbar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by leader, project, or task..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="flex items-center gap-2 text-sm text-gray-500 font-medium whitespace-nowrap">
                        <Filter size={16} /> Filter:
                    </div>
                    <select
                        className="w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        value={statusFilter}
                        onChange={(e) => {
                            const val = e.target.value;
                            setStatusFilter(val);
                            if (val === 'all') {
                                searchParams.delete('status');
                            } else {
                                searchParams.set('status', val);
                            }
                            setSearchParams(searchParams);
                        }}
                    >
                        <option value="all">All Statuses</option>
                        <option value="pending">🔴 Pending</option>
                        <option value="locked">🔴 Locked</option>
                        <option value="in-progress">🟡 In Progress</option>
                        <option value="submitted">🟡 Submitted</option>
                        <option value="completed">🟢 Completed</option>
                        <option value="verified">🟢 Verified</option>
                    </select>
                </div>
            </div>

            {/* Team Leader Cards — click to go to ledger */}
            <div className="space-y-4">
                {Object.keys(groupedData).length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
                        <Search size={40} className="mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">No tasks found</h3>
                        <p className="text-sm text-gray-500 mt-1">Try adjusting your search or filters.</p>
                    </div>
                ) : (
                    Object.entries(groupedData).map(([teamId, teamData]) => (
                        <button
                            key={teamId}
                            onClick={() => navigate(`/tasks/leader/${teamId}`)}
                            className="w-full bg-white border border-gray-200 shadow-sm rounded-xl p-5 flex items-center justify-between hover:border-primary hover:shadow-md transition-all group text-left"
                        >
                            {/* Left: Avatar + Info */}
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-xl border border-primary/20 shadow-sm group-hover:bg-primary/20 transition-all shrink-0">
                                    {teamData.name !== 'Unassigned Leader' ? teamData.name.charAt(0).toUpperCase() : '?'}
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-gray-900 group-hover:text-primary transition-colors leading-tight">
                                        {teamData.name}
                                    </h2>
                                    <p className="text-sm text-gray-500 capitalize mt-0.5">
                                        {teamData.role} • {teamData.taskCount} Tasks
                                    </p>
                                    {/* Projects preview */}
                                    {teamData.projectNames.size > 0 && (
                                        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                            <FolderKanban size={11} className="text-primary/60" />
                                            {[...teamData.projectNames].slice(0, 2).join(', ')}
                                            {teamData.projectNames.size > 2 && ` +${teamData.projectNames.size - 2} more`}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Right: Status Pills + Arrow */}
                            <div className="flex items-center gap-3">
                                <div className="hidden sm:flex items-center gap-2">
                                    {teamData.pendingCount > 0 && (
                                        <span className="flex items-center gap-1 bg-red-50 border border-red-200 text-red-600 text-xs font-bold px-2.5 py-1 rounded-full">
                                            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                                            {teamData.pendingCount}
                                        </span>
                                    )}
                                    {teamData.workingCount > 0 && (
                                        <span className="flex items-center gap-1 bg-yellow-50 border border-yellow-200 text-yellow-700 text-xs font-bold px-2.5 py-1 rounded-full">
                                            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                                            {teamData.workingCount}
                                        </span>
                                    )}
                                    {teamData.doneCount > 0 && (
                                        <span className="flex items-center gap-1 bg-green-50 border border-green-200 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full">
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                            {teamData.doneCount}
                                        </span>
                                    )}
                                </div>
                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                    <ChevronRight size={20} />
                                </div>
                            </div>
                        </button>
                    ))
                )}
            </div>
        </div>
    );
};

export default Tasks;
