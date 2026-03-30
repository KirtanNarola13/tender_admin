import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import api, { getImageUrl } from '../services/api';
import {
    ArrowLeft, Search, X, ChevronRight, Eye,
    CheckCircle, Clock, AlertCircle, SlidersHorizontal,
    FolderKanban, Package
} from 'lucide-react';
import ImageModal from '../components/ImageModal';

// ── Status colour helper ──────────────────────────────────────────────────────
const getStatusColors = (status) => {
    switch (status) {
        case 'verified':
        case 'completed':
            return {
                card: 'bg-green-50 border-green-200',
                badge: 'bg-green-100 text-green-700 border border-green-200',
                dot: 'bg-green-500',
                icon: <CheckCircle size={16} className="text-green-600 flex-shrink-0" />,
                label: status === 'verified' ? 'Verified' : 'Completed',
            };
        case 'submitted':
        case 'in-progress':
            return {
                card: 'bg-yellow-50 border-yellow-200',
                badge: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
                dot: 'bg-yellow-400',
                icon: <Clock size={16} className="text-yellow-600 flex-shrink-0" />,
                label: status === 'submitted' ? 'Submitted' : 'In Progress',
            };
        default:
            return {
                card: 'bg-red-50 border-red-200',
                badge: 'bg-red-100 text-red-600 border border-red-200',
                dot: 'bg-red-400',
                icon: <AlertCircle size={16} className="text-red-500 flex-shrink-0" />,
                label: status === 'locked' ? 'Locked' : 'Pending',
            };
    }
};

const STATUS_OPTS = [
    { value: 'all',         label: 'All Status' },
    { value: 'pending',     label: '🔴 Pending' },
    { value: 'locked',      label: '🔴 Locked' },
    { value: 'in-progress', label: '🟡 In Progress' },
    { value: 'submitted',   label: '🟡 Submitted' },
    { value: 'completed',   label: '🟢 Completed' },
    { value: 'verified',    label: '🟢 Verified' },
];

const TaskSteps = () => {
    const { leaderId, projectId, productId } = useParams();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const initialStatus = searchParams.get('status') || 'all';

    const [allTasks, setAllTasks] = useState([]);
    const [leaderName, setLeaderName] = useState('');
    const [projectName, setProjectName] = useState('');
    const [productName, setProductName] = useState('');
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState(initialStatus);
    const [showFilters, setShowFilters] = useState(initialStatus !== 'all');
    const [previewImage, setPreviewImage] = useState(null);

    useEffect(() => { fetchTasks(); }, []);

    const fetchTasks = async () => {
        try {
            const res = await api.get('/tasks');
            const scoped = res.data.filter(
                t =>
                    (t.assignedTo?._id || 'unassigned') === leaderId &&
                    (t.project?._id || 'unknown') === projectId &&
                    (t.product?._id || 'no_product') === productId
            );
            // Sort by sequence
            scoped.sort((a, b) => (a.sequence || 0) - (b.sequence || 0));
            setAllTasks(scoped);
            setLeaderName(scoped[0]?.assignedTo?.name || 'Leader');
            setProjectName(scoped[0]?.project?.name || 'Project');
            setProductName(scoped[0]?.product?.name || 'General / Setup');
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const filteredTasks = useMemo(() => {
        return allTasks.filter(t => {
            const q = searchQuery.toLowerCase();
            const matchSearch = !q || t.stepName?.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q);
            const matchStatus = statusFilter === 'all' || t.status === statusFilter;
            return matchSearch && matchStatus;
        });
    }, [allTasks, searchQuery, statusFilter]);

    const pendingCount  = allTasks.filter(t => ['pending','locked'].includes(t.status)).length;
    const workingCount  = allTasks.filter(t => ['in-progress','submitted'].includes(t.status)).length;
    const doneCount     = allTasks.filter(t => ['completed','verified'].includes(t.status)).length;
    const donePercent   = allTasks.length > 0 ? Math.round((doneCount / allTasks.length) * 100) : 0;
    const activeFiltersCount = statusFilter !== 'all' ? 1 : 0;

    return (
        <div className="w-full max-w-7xl mx-auto pb-10">
            {/* Header */}
            <div className="flex items-center gap-4 mb-2">
                <button
                    onClick={() => navigate(-1)}
                    className="w-10 h-10 rounded-xl bg-white border border-gray-200 shadow-sm hover:bg-gray-50 hover:shadow-md flex items-center justify-center text-gray-600 transition-all"
                >
                    <ArrowLeft size={20} />
                </button>
                <div className="flex items-center gap-3 flex-1">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm">
                        <Package size={20} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 leading-tight">{productName}</h1>
                        <p className="text-sm text-gray-500">
                            {loading ? '...' : `${filteredTasks.length} of ${allTasks.length} Step${allTasks.length !== 1 ? 's' : ''}`}
                        </p>
                    </div>
                </div>
                {/* Progress badge */}
                {!loading && (
                    <div className="hidden sm:flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-1.5 shadow-sm">
                        <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all"
                                style={{ width: `${donePercent}%`, background: donePercent === 100 ? '#16a34a' : '#B8860B' }}
                            />
                        </div>
                        <span className="text-xs font-bold text-gray-700">{donePercent}%</span>
                    </div>
                )}
            </div>

            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-6 ml-14 flex-wrap">
                <span className="hover:text-primary cursor-pointer" onClick={() => navigate(`/tasks${statusFilter !== 'all' ? `?status=${statusFilter}` : ''}`)}>Tasks</span>
                <ChevronRight size={13} />
                <span className="hover:text-primary cursor-pointer" onClick={() => navigate(`/tasks/leader/${leaderId}${statusFilter !== 'all' ? `?status=${statusFilter}` : ''}`)}>{leaderName}</span>
                <ChevronRight size={13} />
                <span className="hover:text-primary cursor-pointer" onClick={() => navigate(`/tasks/leader/${leaderId}/project/${projectId}${statusFilter !== 'all' ? `?status=${statusFilter}` : ''}`)}>{projectName}</span>
                <ChevronRight size={13} />
                <span className="text-gray-600 font-medium">{productName}</span>
            </div>

            {/* Summary Pills */}
            {!loading && (
                <div className="flex gap-3 mb-5 flex-wrap">
                    <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-full text-sm font-semibold">
                        <span className="w-2 h-2 rounded-full bg-red-400" />{pendingCount} Pending
                    </div>
                    <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-2 rounded-full text-sm font-semibold">
                        <span className="w-2 h-2 rounded-full bg-yellow-400" />{workingCount} Working
                    </div>
                    <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-full text-sm font-semibold">
                        <span className="w-2 h-2 rounded-full bg-green-500" />{doneCount} Done
                    </div>
                </div>
            )}

            {/* Search + Filters */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3 sm:p-4 mb-6">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-grow">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search size={17} className="text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search steps..."
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
                    <button
                        onClick={() => setShowFilters(p => !p)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${showFilters || activeFiltersCount > 0 ? 'bg-primary text-white border-primary shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
                    >
                        <SlidersHorizontal size={16} />
                        Filters
                        {activeFiltersCount > 0 && (
                            <span className="bg-white text-primary text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">{activeFiltersCount}</span>
                        )}
                    </button>
                </div>
                {showFilters && (
                    <div className="flex flex-col sm:flex-row gap-3 mt-3 pt-3 border-t border-gray-100 items-end">
                        <div className="flex-1">
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Status</label>
                            <div className="flex gap-2 flex-wrap">
                                {STATUS_OPTS.map(s => (
                                    <button
                                        key={s.value}
                                        onClick={() => {
                                            setStatusFilter(s.value);
                                            if (s.value === 'all') {
                                                searchParams.delete('status');
                                            } else {
                                                searchParams.set('status', s.value);
                                            }
                                            setSearchParams(searchParams);
                                        }}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${statusFilter === s.value ? 'bg-primary text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                    >
                                        {s.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {activeFiltersCount > 0 && (
                            <button
                                onClick={() => {
                                    setStatusFilter('all');
                                    searchParams.delete('status');
                                    setSearchParams(searchParams);
                                }}
                                className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600 font-medium px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
                            >
                                <X size={14} /> Reset
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Steps Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {[1,2,3,4,5,6].map(i => (
                        <div key={i} className="bg-white border border-gray-100 rounded-xl p-5 animate-pulse">
                            <div className="flex justify-between mb-4">
                                <div className="h-5 w-16 bg-gray-100 rounded-full" />
                                <div className="h-5 w-5 bg-gray-100 rounded" />
                            </div>
                            <div className="h-4 bg-gray-100 rounded mb-2 w-3/4" />
                            <div className="h-3 bg-gray-100 rounded mb-1 w-full" />
                            <div className="h-3 bg-gray-100 rounded w-2/3" />
                        </div>
                    ))}
                </div>
            ) : filteredTasks.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl border border-gray-200 shadow-sm">
                    <div className="text-5xl mb-4">🔍</div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">No steps found</h3>
                    <p className="text-sm text-gray-500">Try adjusting your search or filters.</p>
                    {(searchQuery || activeFiltersCount > 0) && (
                        <button onClick={() => { setSearchQuery(''); setStatusFilter('all'); }} className="mt-4 text-sm text-primary font-semibold hover:underline">
                            Clear filters
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredTasks.map(task => {
                        const sc = getStatusColors(task.status);
                        const photoEntries = task.photos ? Object.entries(task.photos) : [];
                        return (
                            <div
                                key={task._id}
                                className={`rounded-xl border p-5 flex flex-col transition-all ${sc.card}`}
                            >
                                {/* Top: Step number + Status badge */}
                                <div className="flex justify-between items-start mb-3">
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                        Step {task.sequence || '—'}
                                    </span>
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${sc.badge}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                                        {sc.label}
                                    </span>
                                </div>

                                {/* Step name */}
                                <h3 className="font-bold text-gray-900 text-[15px] leading-snug mb-1 transition-colors">
                                    {task.stepName || 'Unnamed Step'}
                                </h3>

                                {/* Description */}
                                {task.description && (
                                    <p className="text-xs text-gray-500 line-clamp-2 mb-3">{task.description}</p>
                                )}

                                {/* Photos */}
                                {photoEntries.length > 0 && (
                                    <div className="mb-3">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Proof Photos</p>
                                        <div className="grid grid-cols-3 gap-1.5">
                                            {photoEntries.slice(0, 3).map(([type, url]) => (
                                                <div
                                                    key={type}
                                                    onClick={e => { e.stopPropagation(); setPreviewImage(getImageUrl(url)); }}
                                                    className="aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200 hover:border-primary cursor-pointer transition-colors"
                                                    title={type}
                                                >
                                                    <img
                                                        src={getImageUrl(url)}
                                                        alt={type}
                                                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Footer */}
                                <div className="mt-auto pt-3 border-t border-black/5 flex items-center justify-between">
                                    <div className="flex items-center gap-1 text-xs text-gray-400">
                                        {sc.icon}
                                        <span className="capitalize">{task.status}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Image Preview Modal */}
            <ImageModal
                isOpen={!!previewImage}
                onClose={() => setPreviewImage(null)}
                imageUrl={previewImage}
                altText="Task Photo"
            />
        </div>
    );
};

export default TaskSteps;
