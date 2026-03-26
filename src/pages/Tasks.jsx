import { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import {
    Eye,
    CheckCircle,
    Search,
    Filter,
    Calendar,
    User,
    Briefcase,
    ChevronDown,
    FolderKanban,
    Package,
    Clock,
    AlertCircle,
    Layout
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Tasks = () => {
    const [tasks, setTasks] = useState([]);
    const [filteredTasks, setFilteredTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // Expand/Collapse state
    const [expandedTeams, setExpandedTeams] = useState({});
    const [expandedProjects, setExpandedProjects] = useState({});

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
                (task.assignedTo?.name && task.assignedTo.name.toLowerCase().includes(lowerQuery)) ||
                (task.stepName && task.stepName.toLowerCase().includes(lowerQuery))
            );
        }

        // 2. Status Filter
        if (statusFilter !== 'all') {
            result = result.filter(task => task.status === statusFilter);
        }

        setFilteredTasks(result);
    };

    const toggleTeam = (teamId) => {
        setExpandedTeams(prev => ({ ...prev, [teamId]: !prev[teamId] }));
    };

    const toggleProject = (projectId) => {
        setExpandedProjects(prev => ({ ...prev, [projectId]: !prev[projectId] }));
    };

    const groupedData = useMemo(() => {
        return filteredTasks.reduce((acc, task) => {
            const teamName = task.assignedTo?.name || 'Unassigned Leader';
            const teamId = task.assignedTo?._id || 'unassigned';
            const role = task.assignedTo?.role ? task.assignedTo.role.replace('_', ' ') : '';
            const projectName = task.project?.name || 'Unknown Project';
            const projectId = task.project?._id || 'unknown_project';
            const productName = task.product?.name || 'Overall Setup';
            const productId = task.product?._id || 'overall_setup';

            // Initialize Team
            if (!acc[teamId]) {
                acc[teamId] = {
                    name: teamName,
                    role: role,
                    taskCount: 0,
                    projects: {}
                };
            }

            // Initialize Project under Team
            if (!acc[teamId].projects[projectId]) {
                acc[teamId].projects[projectId] = {
                    name: projectName,
                    taskCount: 0,
                    products: {}
                };
            }

            // Initialize Product under Project
            if (!acc[teamId].projects[projectId].products[productId]) {
                acc[teamId].projects[projectId].products[productId] = {
                    name: productName,
                    tasks: []
                };
            }

            // Push Task and increment counts
            acc[teamId].projects[projectId].products[productId].tasks.push(task);
            acc[teamId].taskCount++;
            acc[teamId].projects[projectId].taskCount++;

            return acc;
        }, {});
    }, [filteredTasks]);

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
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Task Management</h1>
                    <p className="text-gray-500 text-sm mt-1">Monitor and manage all globally assigned tasks.</p>
                </div>
            </div>

            {/* Filters & Search Toolbar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search project, assignee, or task..."
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

            {/* Nested Accordion View */}
            <div className="space-y-6">
                {Object.keys(groupedData).length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
                        <Search size={40} className="mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">No tasks found</h3>
                        <p className="text-sm text-gray-500 mt-1">Try adjusting your search or filters.</p>
                    </div>
                ) : (
                    Object.entries(groupedData).map(([teamId, teamData]) => (
                        <div key={teamId} className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden transition-all">
                            {/* Team Leader Header */}
                            <button
                                onClick={() => toggleTeam(teamId)}
                                className="w-full p-5 flex items-center justify-between hover:bg-gray-50 transition-colors border-b border-gray-100 group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg border border-indigo-100 shadow-sm group-hover:bg-indigo-100 transition-colors">
                                        {teamData.name !== 'Unassigned Leader' ? teamData.name.charAt(0).toUpperCase() : '?'}
                                    </div>
                                    <div className="text-left">
                                        <h2 className="text-lg font-bold text-gray-900 leading-tight">
                                            {teamData.name}
                                        </h2>
                                        <p className="text-sm font-medium text-gray-500 capitalize mt-0.5">
                                            {teamData.role || 'Team Leader'} • {teamData.taskCount} Tasks
                                        </p>
                                    </div>
                                </div>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-gray-400 transition-transform duration-300 ${expandedTeams[teamId] ? 'rotate-180 bg-gray-100 text-gray-600 shadow-sm' : 'bg-transparent group-hover:bg-gray-100'}`}>
                                    <ChevronDown size={20} />
                                </div>
                            </button>

                            {/* Projects Content under Team */}
                            <div className={`${expandedTeams[teamId] ? 'block' : 'hidden'} p-4 bg-gray-50/50`}>
                                <div className="space-y-5">
                                    {Object.entries(teamData.projects).map(([projectId, projectData]) => (
                                        <div key={projectId} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                                            {/* Project Header */}
                                            <button
                                                onClick={() => toggleProject(projectId)}
                                                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-all border-b border-gray-100"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                                                        <FolderKanban size={16} strokeWidth={2.5} />
                                                    </div>
                                                    <div className="text-left">
                                                        <h3 className="font-bold text-gray-900 text-base">{projectData.name}</h3>
                                                        <span className="text-xs text-gray-500 font-medium">{projectData.taskCount} Active Tasks</span>
                                                    </div>
                                                </div>
                                                <ChevronDown size={18} className={`text-gray-400 transition-transform ${expandedProjects[projectId] ? 'rotate-180' : ''}`} />
                                            </button>

                                            {/* Products & Tasks Content */}
                                            <div className={`${expandedProjects[projectId] ? 'block' : 'hidden'} bg-gray-50 p-5 border-t border-gray-100`}>
                                                <div className="space-y-8">
                                                    {Object.entries(projectData.products).map(([productId, productData]) => (
                                                        <div key={productId}>
                                                            <div className="flex items-center gap-2 mb-4 px-1">
                                                                <Package size={16} className="text-gray-500" />
                                                                <h4 className="font-bold text-[13px] text-gray-800 uppercase tracking-widest">{productData.name}</h4>
                                                                <div className="h-px bg-gray-200 flex-grow ml-2"></div>
                                                            </div>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                                                {productData.tasks.map(task => (
                                                                    <div
                                                                        key={task._id}
                                                                        onClick={() => navigate(`/tasks/${task._id}`)}
                                                                        className={`p-4 rounded-xl border shadow-sm text-sm cursor-pointer transition-all hover:-translate-y-1 hover:shadow-md ${
                                                                            task.status === 'completed' || task.status === 'verified'
                                                                                ? 'bg-green-50/50 border-green-200/60'
                                                                                : task.status === 'pending' || task.status === 'in-progress'
                                                                                    ? 'bg-blue-50/50 border-blue-200/60'
                                                                                    : 'bg-white border-gray-200'
                                                                        }`}
                                                                    >
                                                                        <div className="flex justify-between items-start mb-4">
                                                                            <span className="font-bold text-gray-900 text-[15px] leading-tight pr-2">
                                                                                {task.sequence ? `Step ${task.sequence}: ` : ''}{task.stepName || 'Unnamed Step'}
                                                                            </span>
                                                                            {task.status === 'verified' && <CheckCircle size={18} className="text-green-600 flex-shrink-0" />}
                                                                            {(task.status === 'completed' || task.status === 'submitted') && <Clock size={18} className="text-blue-600 flex-shrink-0" />}
                                                                            {task.status === 'in-progress' && <Clock size={18} className="text-yellow-600 flex-shrink-0" />}
                                                                            {task.status === 'locked' && <AlertCircle size={18} className="text-gray-400 flex-shrink-0" />}
                                                                            {task.status === 'pending' && <AlertCircle size={18} className="text-gray-400 flex-shrink-0" />}
                                                                        </div>
                                                                        <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                                                                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${
                                                                                task.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                                                task.status === 'verified' ? 'bg-blue-100 text-blue-700' :
                                                                                task.status === 'submitted' ? 'bg-orange-100 text-orange-700' :
                                                                                task.status === 'in-progress' ? 'bg-yellow-100 text-yellow-700' :
                                                                                task.status === 'locked' ? 'bg-gray-100 text-gray-500' :
                                                                                'bg-gray-100 text-gray-600'
                                                                            }`}>
                                                                                {task.status}
                                                                            </span>
                                                                            <div className="w-7 h-7 rounded flex items-center justify-center bg-gray-50 border border-gray-200 text-gray-400 hover:text-primary hover:border-primary/20 transition-colors">
                                                                                <Eye size={14} />
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Tasks;
