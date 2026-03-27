import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
    ArrowLeft, Search, Filter, Briefcase, Users, ChevronRight,
    Trash2, SlidersHorizontal, Layout, X, Calendar
} from 'lucide-react';
import DeleteConfirmModal from '../components/DeleteConfirmModal';

const CATEGORY_ICONS = {
    'Primary': '🏫',
    'Upper Primary': '📚',
    'Secondary': '🎓',
    'Higher Secondary': '🏛️',
    'Residential': '🏠',
    'Other': '📁',
};

const CategoryProjects = () => {
    const { categoryName } = useParams();
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();

    const [allProjects, setAllProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('updatedAt_desc');
    const [statusFilter, setStatusFilter] = useState('all');
    const [showFilters, setShowFilters] = useState(false);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [projectToDelete, setProjectToDelete] = useState(null);

    const decodedCategory = decodeURIComponent(categoryName);
    const emoji = CATEGORY_ICONS[decodedCategory] || '📁';

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            setLoading(true);
            const res = await api.get('/projects');
            // Filter only this category
            const filtered = res.data.filter(p => (p.category || 'Other') === decodedCategory);
            setAllProjects(filtered);
        } catch (error) {
            console.error('Failed to fetch projects');
        } finally {
            setLoading(false);
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

    const filteredProjects = [...allProjects]
        .filter(p => {
            const matchSearch =
                p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.description?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchStatus = statusFilter === 'all' || (p.status || 'pending') === statusFilter;
            return matchSearch && matchStatus;
        })
        .sort((a, b) => {
            if (sortBy === 'name_asc') return (a.name || '').localeCompare(b.name || '');
            if (sortBy === 'createdAt_desc') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
            return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
        });

    const activeFiltersCount = (statusFilter !== 'all' ? 1 : 0) + (sortBy !== 'updatedAt_desc' ? 1 : 0);

    return (
        <div className="w-full max-w-7xl mx-auto pb-10">

            {/* ── Top Header Bar ── */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => navigate('/projects')}
                    className="flex items-center justify-center w-10 h-10 rounded-xl bg-white border border-gray-200 shadow-sm hover:bg-gray-50 hover:shadow-md text-gray-600 transition-all"
                >
                    <ArrowLeft size={20} />
                </button>

                <div className="flex items-center gap-3 flex-1">
                    <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-2xl shadow-sm">
                        {emoji}
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 leading-tight">{decodedCategory}</h1>
                        <p className="text-sm text-gray-500">
                            {loading ? 'Loading...' : `${filteredProjects.length} of ${allProjects.length} project${allProjects.length !== 1 ? 's' : ''}`}
                        </p>
                    </div>
                </div>

                {currentUser?.role !== 'admin_viewer' && (
                    <Link
                        to="/projects/new"
                        className="hidden sm:flex bg-primary hover:bg-blue-600 text-white px-4 py-2.5 rounded-lg items-center gap-2 transition-colors font-semibold text-sm shadow-sm"
                    >
                        + New Project
                    </Link>
                )}
            </div>

            {/* ── Search + Filter Row ── */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3 sm:p-4 mb-6">
                <div className="flex flex-col sm:flex-row gap-3">
                    {/* Search */}
                    <div className="relative flex-grow">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search size={17} className="text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder={`Search in ${decodedCategory}...`}
                            className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all bg-gray-50/50"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                            >
                                <X size={15} />
                            </button>
                        )}
                    </div>

                    {/* Filter Toggle Button */}
                    <button
                        onClick={() => setShowFilters(prev => !prev)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${showFilters || activeFiltersCount > 0
                            ? 'bg-primary text-white border-primary shadow-sm'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                    >
                        <SlidersHorizontal size={16} />
                        Filters
                        {activeFiltersCount > 0 && (
                            <span className="bg-white text-primary text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                {activeFiltersCount}
                            </span>
                        )}
                    </button>
                </div>

                {/* Expanded Filters */}
                {showFilters && (
                    <div className="flex flex-col sm:flex-row gap-3 mt-3 pt-3 border-t border-gray-100">
                        {/* Status Filter */}
                        <div className="flex-1">
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Status</label>
                            <div className="flex gap-2 flex-wrap">
                                {['all', 'active', 'pending', 'completed'].map(s => (
                                    <button
                                        key={s}
                                        onClick={() => setStatusFilter(s)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${statusFilter === s
                                            ? 'bg-primary text-white shadow-sm'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        {s === 'all' ? 'All Status' : s}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Sort */}
                        <div className="sm:w-52">
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Sort By</label>
                            <select
                                className="w-full border border-gray-200 rounded-lg text-sm py-2 px-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white"
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                            >
                                <option value="updatedAt_desc">Recently Updated</option>
                                <option value="createdAt_desc">Recently Created</option>
                                <option value="name_asc">Name (A–Z)</option>
                            </select>
                        </div>

                        {/* Reset */}
                        {activeFiltersCount > 0 && (
                            <div className="flex items-end">
                                <button
                                    onClick={() => { setStatusFilter('all'); setSortBy('updatedAt_desc'); }}
                                    className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600 font-medium px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
                                >
                                    <X size={14} /> Reset
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ── Projects Grid ── */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="bg-white border border-gray-100 rounded-xl p-5 animate-pulse">
                            <div className="flex justify-between mb-4">
                                <div className="h-6 w-20 bg-gray-100 rounded-full" />
                                <div className="h-6 w-6 bg-gray-100 rounded" />
                            </div>
                            <div className="h-5 bg-gray-100 rounded mb-2 w-3/4" />
                            <div className="h-4 bg-gray-100 rounded mb-1 w-full" />
                            <div className="h-4 bg-gray-100 rounded mb-6 w-2/3" />
                            <div className="h-px bg-gray-100 mb-4" />
                            <div className="h-4 bg-gray-100 rounded w-1/2" />
                        </div>
                    ))}
                </div>
            ) : filteredProjects.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl border border-gray-200 shadow-sm">
                    <div className="text-5xl mb-4">🔍</div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {searchQuery || statusFilter !== 'all' ? 'No projects match your filters' : 'No projects yet'}
                    </h3>
                    <p className="text-sm text-gray-500 mb-5">
                        {searchQuery || statusFilter !== 'all'
                            ? 'Try adjusting your search or filters.'
                            : `No projects found in the "${decodedCategory}" category.`}
                    </p>
                    {(searchQuery || statusFilter !== 'all') && (
                        <button
                            onClick={() => { setSearchQuery(''); setStatusFilter('all'); }}
                            className="text-sm text-primary font-semibold hover:underline"
                        >
                            Clear filters
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProjects.map((project) => (
                        <Link
                            key={project._id}
                            to={`/projects/${project._id}`}
                            className="bg-white border border-gray-200 shadow-sm rounded-xl p-5 flex flex-col relative overflow-hidden h-full hover:shadow-md hover:border-blue-200 transition-all group/card"
                        >
                            {/* Status & Delete */}
                            <div className="flex justify-between items-start mb-4 w-full">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${project.status === 'active'
                                    ? 'bg-green-50 text-green-700 border border-green-200'
                                    : project.status === 'completed'
                                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                        : 'bg-orange-50 text-orange-700 border border-orange-200'
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

                            <p className="text-sm text-gray-500 mb-6 line-clamp-2 flex-grow">
                                {project.description || 'No detailed description available.'}
                            </p>

                            {/* Footer */}
                            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
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

export default CategoryProjects;
