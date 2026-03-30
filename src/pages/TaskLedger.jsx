import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
    ArrowLeft, Search, X, ChevronRight, FolderKanban, SlidersHorizontal
} from 'lucide-react';

// ── Status colour helper (shared) ─────────────────────────────────────────────
export const getStatusColors = (status) => {
    switch (status) {
        case 'verified':
        case 'completed':
            return {
                badge: 'bg-task-done-bg text-task-done-fg border border-task-done-fg/20',
                dot: 'bg-task-done-fg',
                label: status === 'verified' ? 'Verified' : 'Completed'
            };
        case 'submitted':
            return {
                badge: 'bg-task-submitted-bg text-task-submitted-fg border border-task-submitted-fg/20',
                dot: 'bg-task-submitted-fg',
                label: 'Submitted'
            };
        case 'in-progress':
            return {
                badge: 'bg-task-working-bg text-task-working-fg border border-task-working-fg/20',
                dot: 'bg-task-working-fg',
                label: 'In Progress'
            };
        case 'locked':
            return {
                badge: 'bg-task-locked-bg text-task-locked-fg border border-task-locked-fg/20',
                dot: 'bg-task-locked-fg',
                label: 'Locked'
            };
        case 'pending':
        default:
            return {
                badge: 'bg-task-pending-bg text-task-pending-fg border border-task-pending-fg/20',
                dot: 'bg-task-pending-fg',
                label: 'Pending'
            };
    }
};

const TaskLedger = () => {
    const { leaderId } = useParams();
    const navigate = useNavigate();

    const [allTasks, setAllTasks] = useState([]);
    const [leaderName, setLeaderName] = useState('');
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => { fetchTasks(); }, []);

    const fetchTasks = async () => {
        try {
            const res = await api.get('/tasks');
            const leaderTasks = res.data.filter(
                t => (t.assignedTo?._id || 'unassigned') === leaderId
            );
            setAllTasks(leaderTasks);
            const nameSource = leaderTasks[0] ?? res.data.find(t => (t.assignedTo?._id || 'unassigned') === leaderId);
            setLeaderName(nameSource?.assignedTo?.name || (leaderId === 'unassigned' ? 'Unassigned' : 'Team Leader'));
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    // Group tasks by project
    const projectMap = useMemo(() => {
        const map = {};
        allTasks.forEach(t => {
            const pid = t.project?._id || 'unknown';
            if (!map[pid]) {
                map[pid] = {
                    id: pid,
                    name: t.project?.name || 'Unknown Project',
                    category: t.project?.category || '',
                    taskCount: 0,
                    pendingCount: 0,
                    workingCount: 0,
                    doneCount: 0,
                    productNames: new Set(),
                };
            }
            map[pid].taskCount++;
            if (['pending','locked'].includes(t.status)) map[pid].pendingCount++;
            else if (['in-progress','submitted'].includes(t.status)) map[pid].workingCount++;
            else map[pid].doneCount++;
            if (t.product?.name) map[pid].productNames.add(t.product.name);
        });
        return map;
    }, [allTasks]);

    const filteredProjects = Object.values(projectMap).filter(p =>
        !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="w-full max-w-7xl mx-auto pb-10">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => navigate('/tasks')} className="w-10 h-10 rounded-xl bg-white border border-gray-200 shadow-sm hover:bg-gray-50 hover:shadow-md flex items-center justify-center text-gray-600 transition-all">
                    <ArrowLeft size={20} />
                </button>
                <div className="flex items-center gap-3 flex-1">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-xl shadow-sm">
                        {leaderName !== 'Unassigned' ? leaderName.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 leading-tight">{leaderName}</h1>
                        <p className="text-sm text-gray-500">
                            {loading ? 'Loading...' : `${filteredProjects.length} Project${filteredProjects.length !== 1 ? 's' : ''} • ${allTasks.length} Total Tasks`}
                        </p>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3 sm:p-4 mb-6">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search size={17} className="text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search projects..."
                        className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-gray-50/50"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
                            <X size={15} />
                        </button>
                    )}
                </div>
            </div>

            {/* Project List */}
            {loading ? (
                <div className="space-y-3">
                    {[1,2,3].map(i => (
                        <div key={i} className="bg-white border border-gray-100 rounded-xl p-5 animate-pulse flex gap-4 items-center">
                            <div className="w-12 h-12 bg-gray-100 rounded-xl" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-gray-100 rounded w-1/3" />
                                <div className="h-3 bg-gray-100 rounded w-1/2" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : filteredProjects.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl border border-gray-200 shadow-sm">
                    <div className="text-5xl mb-4">📂</div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">No projects found</h3>
                    <p className="text-sm text-gray-500">This leader has no assigned tasks yet.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredProjects.map(project => (
                        <button
                            key={project.id}
                            onClick={() => navigate(`/tasks/leader/${leaderId}/project/${project.id}`)}
                            className="w-full bg-white border border-gray-200 shadow-sm rounded-xl p-5 flex items-center justify-between hover:border-primary hover:shadow-md transition-all group text-left"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm group-hover:bg-primary/20 transition-all shrink-0">
                                    <FolderKanban size={20} />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-gray-900 group-hover:text-primary transition-colors leading-tight">
                                        {project.name}
                                    </h2>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        {project.taskCount} Task{project.taskCount !== 1 ? 's' : ''}
                                        {project.category ? ` • ${project.category}` : ''}
                                    </p>
                                    {project.productNames.size > 0 && (
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            {[...project.productNames].slice(0,3).join(', ')}
                                            {project.productNames.size > 3 ? ` +${project.productNames.size - 3} more` : ''}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="hidden sm:flex items-center gap-2">
                                    {project.pendingCount > 0 && (
                                        <span className="flex items-center gap-1 bg-red-50 border border-red-200 text-red-600 text-xs font-bold px-2.5 py-1 rounded-full">
                                            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />{project.pendingCount}
                                        </span>
                                    )}
                                    {project.workingCount > 0 && (
                                        <span className="flex items-center gap-1 bg-yellow-50 border border-yellow-200 text-yellow-700 text-xs font-bold px-2.5 py-1 rounded-full">
                                            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />{project.workingCount}
                                        </span>
                                    )}
                                    {project.doneCount > 0 && (
                                        <span className="flex items-center gap-1 bg-green-50 border border-green-200 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full">
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />{project.doneCount}
                                        </span>
                                    )}
                                </div>
                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                    <ChevronRight size={20} />
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TaskLedger;
