import { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useBranch } from '../context/BranchContext';
import { Plus, Briefcase, Layout, Search, ChevronRight, ArrowLeft } from 'lucide-react';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import PageLoader from '../components/PageLoader';

const Projects = () => {
    const { user: currentUser } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const fromDashboard = location.state?.fromDashboard;
    const { activeBranch } = useBranch();

    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('updatedAt_desc');
    const [newProject, setNewProject] = useState({ name: '', description: '' });

    const [showSchoolModal, setShowSchoolModal] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);
    const [newSchool, setNewSchool] = useState({ id: '' });
    const [users, setUsers] = useState([]);
    const [selectedLeader, setSelectedLeader] = useState('');
    const [projectSchools, setProjectSchools] = useState([]);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [projectToDelete, setProjectToDelete] = useState(null);

    useEffect(() => {
        fetchProjects();
        fetchUsers();
    }, []);

    const fetchProjects = async () => {
        try {
            const res = await api.get('/projects');
            setProjects(res.data);
        } catch (error) {
            console.error('Failed to fetch projects');
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const res = await api.get('/users?role=team_leader');
            setUsers(res.data.filter(u => u.role === 'team_leader'));
        } catch (e) {}
    };

    const handleCreate = async () => {
        try {
            await api.post('/projects', newProject);
            setIsModalOpen(false);
            setNewProject({ name: '', description: '' });
            fetchProjects();
        } catch (error) {
            alert('Failed to create project');
        }
    };

    const openAssignModal = async (project) => {
        setSelectedProject(project);
        try {
            const res = await api.get(`/schools?projectId=${project._id}`);
            setProjectSchools(res.data);
            setShowSchoolModal(true);
        } catch (e) {
            console.error('Failed to fetch schools');
        }
    };

    const handleAssignLeader = async () => {
        if (!selectedLeader) return alert('Select Team Leader');
        try {
            await api.put(`/projects/${selectedProject._id}`, { assignedLeader: selectedLeader });
            setShowSchoolModal(false);
            setSelectedLeader('');
            alert('Team Leader Assigned Successfully!');
            fetchProjects();
        } catch (e) {
            alert('Failed to assign: ' + (e.response?.data?.message || e.message));
        }
    };

    const handleDelete = (id, name) => {
        setProjectToDelete({ id, name });
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!projectToDelete) return;
        try {
            await api.delete(`/projects/${projectToDelete.id}`);
            fetchProjects();
        } catch (error) {
            alert('Failed to delete project: ' + (error.response?.data?.message || error.message));
        }
    };

    const goToCategory = (category) => {
        navigate(`/projects/category/${encodeURIComponent(category)}`);
    };

    const filteredAndSortedProjects = [...projects]
        .filter(p => {
            const matchesSearch =
                p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.description?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesBranch = activeBranch === 'all' || p.branch === activeBranch;
            return matchesSearch && matchesBranch;
        })
        .sort((a, b) => {
            if (sortBy === 'name_asc') return (a.name || '').localeCompare(b.name || '');
            if (sortBy === 'createdAt_desc') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
            if (sortBy === 'updatedAt_desc') return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
            return 0;
        });

    const groupedProjects = filteredAndSortedProjects.reduce((acc, project) => {
        const category = project.category || 'Other';
        if (!acc[category]) acc[category] = [];
        acc[category].push(project);
        return acc;
    }, {});

    const allCategories = Object.keys(groupedProjects);
    const definedOrder = ['Primary', 'Upper Primary', 'Secondary', 'Higher Secondary', 'Residential'];
    const sortedCategories = [
        ...definedOrder.filter(cat => allCategories.includes(cat)),
        ...allCategories.filter(cat => !definedOrder.includes(cat) && cat !== 'Other').sort(),
        ...(allCategories.includes('Other') ? ['Other'] : []),
    ];

    if (loading) return <PageLoader text="Loading projects..." />;

    return (
        <div className="w-full space-y-3 max-w-7xl mx-auto pb-8">
            {/* Sticky header */}
            <div className="sticky top-0 z-10 bg-gray-50 pb-2 space-y-2">
                <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                        {fromDashboard && (
                            <button onClick={() => navigate('/')} className="flex items-center gap-1 text-primary text-xs font-bold uppercase tracking-wider mb-1">
                                <ArrowLeft size={12} /> Back
                            </button>
                        )}
                        <h1 className="text-lg font-bold text-gray-900 leading-tight">Project Portfolio</h1>
                        <p className="text-gray-400 text-xs mt-0.5">Manage and track your active tender projects.</p>
                    </div>
                    {currentUser?.role !== 'admin_viewer' && (
                        <Link
                            to="/projects/new"
                            className="flex items-center gap-1.5 bg-primary text-white px-3 py-2 rounded-xl font-bold text-xs shadow-md shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all shrink-0"
                        >
                            <Plus size={14} /> New Project
                        </Link>
                    )}
                </div>

                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search projects..."
                            className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-xl bg-white text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none shadow-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <select
                        className="border border-gray-200 rounded-xl bg-white px-2 py-2 text-xs font-medium text-gray-600 outline-none shadow-sm focus:ring-2 focus:ring-primary/20 shrink-0"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                    >
                        <option value="updatedAt_desc">Recently Updated</option>
                        <option value="createdAt_desc">Recently Created</option>
                        <option value="name_asc">Name A–Z</option>
                    </select>
                </div>
            </div>

            <div className="space-y-3">
                {sortedCategories.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
                        <Briefcase size={36} className="mx-auto text-gray-300 mb-3" />
                        <h3 className="text-base font-medium text-gray-900">No projects found</h3>
                        <p className="text-sm text-gray-500 mt-1">Get started by creating your first project.</p>
                    </div>
                ) : (
                    sortedCategories.map((category) => (
                        <button
                            key={category}
                            onClick={() => goToCategory(category)}
                            className="w-full flex items-center justify-between bg-white border border-gray-200 shadow-sm p-3 sm:p-4 rounded-xl transition-all group focus:outline-none hover:border-primary hover:shadow-md"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg flex shrink-0 items-center justify-center bg-primary/10 text-primary border border-primary/20 group-hover:bg-primary/20 transition-all">
                                    <Layout size={18} strokeWidth={2} />
                                </div>
                                <div className="text-left">
                                    <h2 className="font-bold text-gray-900 text-sm sm:text-base group-hover:text-primary transition-colors leading-tight">
                                        {category}
                                    </h2>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        {groupedProjects[category].length} {groupedProjects[category].length === 1 ? 'Project' : 'Active Projects'}
                                    </p>
                                </div>
                            </div>
                            <div className="w-7 h-7 rounded-full flex shrink-0 items-center justify-center text-gray-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                <ChevronRight size={18} />
                            </div>
                        </button>
                    ))
                )}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                    <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Create New Project</h2>
                        <input
                            className="w-full border border-gray-300 p-2.5 rounded-lg mb-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                            placeholder="Project Name"
                            value={newProject.name}
                            onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                        />
                        <textarea
                            className="w-full border border-gray-300 p-2.5 rounded-lg mb-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none min-h-[100px]"
                            placeholder="Description"
                            value={newProject.description}
                            onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                        />
                        <div className="flex justify-end gap-3 mt-2">
                            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
                            <button onClick={handleCreate} className="px-6 py-2.5 text-sm font-bold bg-primary text-white hover:bg-opacity-90 rounded-lg shadow-lg shadow-primary/20">Create</button>
                        </div>
                    </div>
                </div>
            )}

            {showSchoolModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                    <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md">
                        <h2 className="text-lg font-bold text-gray-900 mb-2">Assign Team Leader</h2>
                        <p className="text-sm text-gray-500 mb-5">Select a school in <b>{selectedProject?.name}</b> and assign a leader.</p>
                        <label className="block mb-1.5 text-sm font-medium text-gray-700">Select School</label>
                        <select
                            className="w-full border border-gray-300 p-2.5 rounded-lg mb-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white"
                            value={newSchool.id}
                            onChange={(e) => setNewSchool({ ...newSchool, id: e.target.value })}
                        >
                            <option value="">-- Choose School --</option>
                            {projectSchools.map(s => (
                                <option key={s._id} value={s._id}>{s.name} ({s.address})</option>
                            ))}
                        </select>
                        <label className="block mb-1.5 text-sm font-medium text-gray-700">Assign Team Leader</label>
                        <select
                            className="w-full border border-gray-300 p-2.5 rounded-lg mb-6 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white"
                            value={selectedLeader}
                            onChange={(e) => setSelectedLeader(e.target.value)}
                        >
                            <option value="">-- Select User --</option>
                            {users.map(u => (
                                <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
                            ))}
                        </select>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setShowSchoolModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
                            <button onClick={handleAssignLeader} className="px-6 py-2.5 text-sm font-bold bg-primary text-white hover:bg-opacity-90 rounded-lg shadow-lg shadow-primary/20">Assign</button>
                        </div>
                    </div>
                </div>
            )}

            <DeleteConfirmModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={confirmDelete}
                itemName={projectToDelete?.name}
                title="Delete Project?"
            />
        </div>
    );
};

export default Projects;
