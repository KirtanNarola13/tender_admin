import { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useBranch } from '../context/BranchContext';
import { Plus, Briefcase, Layout, Search, ChevronRight, ArrowLeft, Trash2, Calendar, MapPin, Users } from 'lucide-react';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import PageLoader from '../components/PageLoader';

import CustomSelect from '../components/CustomSelect';
import FormSelect from '../components/FormSelect';

const SORT_OPTIONS = [
    { value: 'updatedAt_desc', label: 'Recently Updated' },
    { value: 'createdAt_desc', label: 'Recently Created' },
    { value: 'name_asc', label: 'Name A–Z' },
];

const Projects = () => {

    const { user: currentUser } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const fromDashboard = location.state?.fromDashboard;
    const { activeBranch } = useBranch();

    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('updatedAt_desc');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newProject, setNewProject] = useState({ name: '', description: '' });

    const [showSchoolModal, setShowSchoolModal] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);
    const [newSchool, setNewSchool] = useState({ id: '' });
    const [users, setUsers] = useState([]);
    const [selectedLeader, setSelectedLeader] = useState('');
    const [projectSchools, setProjectSchools] = useState([]);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [projectToDelete, setProjectToDelete] = useState(null);

    const [workOrders, setWorkOrders] = useState([]);
    const [searchParams, setSearchParams] = useSearchParams();

    // Drill-down State derived from URL
    const wonId = searchParams.get('won');
    const catName = searchParams.get('cat');

    const selectedWON = workOrders.find(w => w._id === wonId) || null;
    const selectedCategory = selectedWON?.categories?.find(c => c.name === catName) || null;

    const setSelectedWON = (w) => {
        if (!w) setSearchParams({});
        else setSearchParams({ won: w._id });
    };

    const setSelectedCategory = (c) => {
        if (!c) setSearchParams({ won: wonId });
        else setSearchParams({ won: wonId, cat: c.name });
    };

    useEffect(() => {
        fetchWorkOrders();
        fetchProjects();
        fetchUsers();
    }, []);

    const fetchWorkOrders = async () => {
        try {
            const res = await api.get('/workorders');
            setWorkOrders(res.data);
        } catch (error) {
            console.error('Failed to fetch work orders');
        }
    };

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
        } catch (e) { }
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
            const matchesWON = !selectedWON || (p.workOrder?._id || p.workOrder) === selectedWON._id;
            const matchesCat = !selectedCategory || p.workOrderCategory === selectedCategory.name;
            return matchesSearch && matchesBranch && matchesWON && matchesCat;
        })
        .sort((a, b) => {
            if (sortBy === 'name_asc') return (a.name || '').localeCompare(b.name || '');
            if (sortBy === 'createdAt_desc') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
            if (sortBy === 'updatedAt_desc') return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
            return 0;
        });

    const [isWOModalOpen, setIsWOModalOpen] = useState(false);
    const [newWO, setNewWO] = useState({ workOrderNumber: '', description: '', categories: [{ name: '' }] });

    const handleCreateWO = async () => {
        if (!newWO.workOrderNumber || newWO.categories.some(c => !c.name)) {
            return alert('Please fill in WON and all category names');
        }
        try {
            await api.post('/workorders', newWO);
            setIsWOModalOpen(false);
            setNewWO({ workOrderNumber: '', description: '', categories: [{ name: '' }] });
            fetchWorkOrders();
        } catch (error) {
            alert('Failed to create Work Order');
        }
    };

    const addWOCategory = () => {
        setNewWO({ ...newWO, categories: [...newWO.categories, { name: '' }] });
    };

    const removeWOCategory = (index) => {
        setNewWO({ ...newWO, categories: newWO.categories.filter((_, i) => i !== index) });
    };

    const updateWOCategory = (index, name) => {
        const cats = [...newWO.categories];
        cats[index].name = name;
        setNewWO({ ...newWO, categories: cats });
    };

    if (loading) return <PageLoader text="Loading projects..." />;

    return (
        <div className="w-full space-y-3 max-w-7xl mx-auto pb-8">
            {/* Sticky header */}
            <div className="sticky top-0 z-10 bg-gray-50 pb-2 space-y-2">
                <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                        {(fromDashboard || wonId) && (
                            <button
                                onClick={() => {
                                    if (catName) setSelectedCategory(null);
                                    else if (wonId) setSelectedWON(null);
                                    else navigate('/');
                                }}
                                className="flex items-center gap-1 text-primary text-xs font-bold uppercase tracking-wider mb-1"
                            >
                                <ArrowLeft size={12} /> Back
                            </button>
                        )}
                        <h1 className="text-lg font-bold text-gray-900 leading-tight">
                            {selectedCategory ? selectedCategory.name : selectedWON ? selectedWON.workOrderNumber : 'Work Orders'}
                        </h1>
                        <p className="text-gray-400 text-xs mt-0.5">
                            {selectedCategory ? 'Projects in this category' : selectedWON ? 'Categories in this work order' : 'Select a work order to view projects.'}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {!selectedWON && currentUser?.role !== 'admin_viewer' && (
                            <button
                                onClick={() => setIsWOModalOpen(true)}
                                className="flex items-center gap-1.5 bg-white text-primary border border-primary px-3 py-3 rounded-md font-bold text-xs shadow-sm hover:bg-primary/5 transition-all shrink-0"
                            >
                                <Plus size={14} /> New WON
                            </button>
                        )}
                        {currentUser?.role !== 'admin_viewer' && (
                            <Link
                                to="/projects/new"
                                className="flex items-center gap-1.5 bg-primary text-white px-3 py-3 rounded-md font-bold text-xs shadow-md shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all shrink-0"
                            >
                                <Plus size={14} /> New Project
                            </Link>
                        )}
                    </div>
                </div>

                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search projects..."
                            className="w-full pl-8 pr-3 py-3 border border-gray-200 rounded-lg bg-white text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none shadow-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <CustomSelect
                        value={sortBy}
                        onChange={setSortBy}
                        options={SORT_OPTIONS}
                    />
                </div>
            </div>

            <div className="space-y-3">
                {!selectedWON ? (
                    // VIEW 1: WON LIST
                    workOrders
                        .filter(won => won.categories?.some(cat => cat.projects?.length > 0))
                        .map((won) => (
                            <button
                                key={won._id}
                                onClick={() => setSelectedWON(won)}
                                className="w-full flex items-center justify-between bg-white border border-gray-200 shadow-sm p-3 sm:p-4 rounded-xl transition-all group focus:outline-none hover:border-primary hover:shadow-md"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg flex shrink-0 items-center justify-center bg-primary/10 text-primary border border-primary/20 group-hover:bg-primary/20 transition-all">
                                        <Briefcase size={18} strokeWidth={2} />
                                    </div>
                                    <div className="text-left">
                                        <h2 className="font-bold text-gray-900 text-sm sm:text-base group-hover:text-primary transition-colors leading-tight">
                                            {won.workOrderNumber}
                                        </h2>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {won.description || 'No description'} • {won.categories?.length || 0} Categories
                                        </p>
                                    </div>
                                </div>
                                <div className="w-7 h-7 rounded-full flex shrink-0 items-center justify-center text-gray-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                    <ChevronRight size={18} />
                                </div>
                            </button>
                        ))
                ) : !selectedCategory ? (
                    // VIEW 2: CATEGORY LIST
                    selectedWON.categories
                        .filter(cat => cat.projects?.length > 0)
                        .map((cat) => (
                            <button
                                key={cat.name}
                                onClick={() => setSelectedCategory(cat)}
                                className="w-full flex items-center justify-between bg-white border border-gray-200 shadow-sm p-3 sm:p-4 rounded-xl transition-all group focus:outline-none hover:border-primary hover:shadow-md"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg flex shrink-0 items-center justify-center bg-primary/10 text-primary border border-primary/20 group-hover:bg-primary/20 transition-all">
                                        <Layout size={18} strokeWidth={2} />
                                    </div>
                                    <div className="text-left">
                                        <h2 className="font-bold text-gray-900 text-sm sm:text-base group-hover:text-primary transition-colors leading-tight">
                                            {cat.name}
                                        </h2>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {cat.projects?.length || 0} Projects in this category
                                        </p>
                                    </div>
                                </div>
                                <div className="w-7 h-7 rounded-full flex shrink-0 items-center justify-center text-gray-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                    <ChevronRight size={18} />
                                </div>
                            </button>
                        ))
                ) : (
                    // VIEW 3: PROJECT LIST
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredAndSortedProjects.map((project) => (
                            <Link
                                key={project._id}
                                to={`/projects/${project._id}`}
                                className="bg-white border border-gray-200 shadow-sm rounded-xl p-5 flex flex-col relative overflow-hidden h-full hover:shadow-md hover:border-primary/30 transition-all group/card"
                            >
                                {/* Status & Delete */}
                                <div className="flex justify-between items-start mb-4 w-full">
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${project.status === 'active'
                                        ? 'bg-green-50 text-green-700 border border-green-200'
                                        : project.status === 'completed'
                                            ? 'bg-green-50 text-green-700 border border-green-200'
                                            : 'bg-red-50 text-red-700 border border-red-200'
                                        }`}>
                                        <span className="w-1.5 h-1.5 rounded-full mr-1.5 inline-block bg-current opacity-70" />
                                        {project.status || 'Pending'}
                                    </span>
                                    {currentUser?.role !== 'admin_viewer' && (
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleDelete(project._id, project.name);
                                            }}
                                            className="text-gray-400 hover:text-red-500 transition-colors bg-white rounded-lg p-1.5 hover:bg-red-50"
                                            title="Delete Project"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>

                                <h3 className="text-lg font-bold text-gray-900 mb-2 truncate group-hover/card:text-primary transition-colors">
                                    {project.name}
                                </h3>

                                <p className="text-xs text-gray-500 mb-4 line-clamp-2">
                                    {project.description || 'No detailed description available.'}
                                </p>

                                {/* Important Details Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-2 mb-6">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className="p-1.5 rounded-lg bg-gray-50 text-gray-400 shrink-0">
                                            <Briefcase size={14} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tight leading-none mb-0.5">Client</p>
                                            <p className="text-xs font-semibold text-gray-700 truncate">{project.client || '—'}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className="p-1.5 rounded-lg bg-gray-50 text-gray-400 shrink-0">
                                            <MapPin size={14} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tight leading-none mb-0.5">Location</p>
                                            <p className="text-xs font-semibold text-gray-700 truncate">{project.location || '—'}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className="p-1.5 rounded-lg bg-gray-50 text-gray-400 shrink-0">
                                            <Calendar size={14} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tight leading-none mb-0.5">Timeline</p>
                                            <p className="text-xs font-semibold text-gray-700 truncate">
                                                {project.startDate ? new Date(project.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
                                                {" → "}
                                                {project.deadline ? new Date(project.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className="p-1.5 rounded-lg bg-gray-50 text-gray-400 shrink-0">
                                            <Layout size={14} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tight leading-none mb-0.5">Branch</p>
                                            <p className="text-xs font-semibold text-gray-700 truncate">{project.branch || 'Global'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 border border-gray-200">
                                            <Users size={14} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-400 font-semibold uppercase">Lead</p>
                                            <p className="text-sm font-medium text-gray-700">{project.assignedLeader?.name || 'Unassigned'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {project.updatedAt && (
                                            <span className="text-xs text-gray-400 hidden sm:block">
                                                {new Date(project.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                            </span>
                                        )}
                                        <ChevronRight size={18} className="text-gray-300 group-hover/card:text-primary transition-colors" />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {(workOrders.length === 0 && !loading) && (
                    <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
                        <Briefcase size={36} className="mx-auto text-gray-300 mb-3" />
                        <h3 className="text-base font-medium text-gray-900">No Work Orders found</h3>
                        <p className="text-sm text-gray-500 mt-1">Please create a work order in the admin panel first.</p>
                    </div>
                )}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100] backdrop-blur-sm">
                    <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Create New Project</h2>
                        <input
                            className="w-full border border-gray-300 p-2.5 rounded-xl mb-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                            placeholder="Project Name"
                            value={newProject.name}
                            onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                        />
                        <textarea
                            className="w-full border border-gray-300 p-2.5 rounded-xl mb-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none min-h-[100px]"
                            placeholder="Description"
                            value={newProject.description}
                            onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                        />
                        <div className="flex justify-end gap-3 mt-2">
                            <button onClick={() => setIsModalOpen(false)} className="px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md">Cancel</button>
                            <button onClick={handleCreate} className="px-6 py-3 text-sm font-bold bg-primary text-white hover:bg-opacity-90 rounded-md shadow-lg shadow-primary/20">Create</button>
                        </div>
                    </div>
                </div>
            )}

            {isWOModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100] backdrop-blur-sm">
                    <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Create Work Order</h2>

                        <label className="block text-xs font-semibold text-gray-600 mb-1">Work Order Number *</label>
                        <input
                            className="w-full border border-gray-300 p-2.5 rounded-xl mb-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                            placeholder="e.g. WON/2024/001"
                            value={newWO.workOrderNumber}
                            onChange={(e) => setNewWO({ ...newWO, workOrderNumber: e.target.value })}
                        />

                        <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
                        <textarea
                            className="w-full border border-gray-300 p-2.5 rounded-xl mb-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none min-h-[60px]"
                            placeholder="Enter description..."
                            value={newWO.description}
                            onChange={(e) => setNewWO({ ...newWO, description: e.target.value })}
                        />

                 

                        <div className="flex justify-end gap-3 mt-4">
                            <button onClick={() => setIsWOModalOpen(false)} className="px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md">Cancel</button>
                            <button onClick={handleCreateWO} className="px-6 py-3 text-sm font-bold bg-primary text-white hover:bg-opacity-90 rounded-md shadow-lg shadow-primary/20">Create WON</button>
                        </div>
                    </div>
                </div>
            )}

            {showSchoolModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100] backdrop-blur-sm">
                    <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md">
                        <h2 className="text-lg font-bold text-gray-900 mb-2">Assign Team Leader</h2>
                        <p className="text-sm text-gray-500 mb-5">Select a school in <b>{selectedProject?.name}</b> and assign a leader.</p>
                        <label className="block mb-1.5 text-sm font-medium text-gray-700">Select School</label>
                        <FormSelect
                            value={newSchool.id}
                            onChange={(val) => setNewSchool({ ...newSchool, id: val })}
                            options={projectSchools.map(s => ({ value: s._id, label: `${s.name} (${s.address})` }))}
                            placeholder="-- Choose School --"
                        />
                        <label className="block mb-1.5 mt-4 text-sm font-medium text-gray-700">Assign Team Leader</label>
                        <FormSelect
                            value={selectedLeader}
                            onChange={setSelectedLeader}
                            options={users.map(u => ({ value: u._id, label: `${u.name} (${u.email})` }))}
                            placeholder="-- Select User --"
                            searchable
                        />
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setShowSchoolModal(false)} className="px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md">Cancel</button>
                            <button onClick={handleAssignLeader} className="px-6 py-3 text-sm font-bold bg-primary text-white hover:bg-opacity-90 rounded-md shadow-lg shadow-primary/20">Assign</button>
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
