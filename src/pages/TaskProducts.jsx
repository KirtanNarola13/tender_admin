import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { ArrowLeft, Search, X, ChevronRight, Package } from 'lucide-react';

const TaskProducts = () => {
    const { leaderId, projectId } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const initialStatus = searchParams.get('status') || 'all';

    const [allTasks, setAllTasks] = useState([]);
    const [leaderName, setLeaderName] = useState('');
    const [projectName, setProjectName] = useState('');
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState(initialStatus);

    useEffect(() => { fetchTasks(); }, []);

    const fetchTasks = async () => {
        try {
            const res = await api.get('/tasks');
            const scoped = res.data.filter(
                t =>
                    (t.assignedTo?._id || 'unassigned') === leaderId &&
                    (t.project?._id || 'unknown') === projectId
            );
            setAllTasks(scoped);
            setLeaderName(scoped[0]?.assignedTo?.name || 'Leader');
            setProjectName(scoped[0]?.project?.name || 'Project');
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    // Group by product
    const productMap = useMemo(() => {
        const map = {};
        
        // --- Apply Status Filter BEFORE grouping ---
        const filtered = allTasks.filter(t => 
            statusFilter === 'all' || t.status === statusFilter
        );

        filtered.forEach(t => {
            const pid = t.product?._id || 'no_product';
            if (!map[pid]) {
                map[pid] = {
                    id: pid,
                    name: t.product?.name || 'General / Setup',
                    taskCount: 0,
                    pendingCount: 0,
                    workingCount: 0,
                    doneCount: 0,
                };
            }
            map[pid].taskCount++;
            if (['pending','locked'].includes(t.status)) map[pid].pendingCount++;
            else if (['in-progress','submitted'].includes(t.status)) map[pid].workingCount++;
            else map[pid].doneCount++;
        });
        return map;
    }, [allTasks, statusFilter]);

    const filteredProducts = Object.values(productMap).filter(p =>
        !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
                        <h1 className="text-xl font-bold text-gray-900 leading-tight">{projectName}</h1>
                        <p className="text-sm text-gray-500">
                            {leaderName} • {loading ? '...' : `${filteredProducts.length} Product${filteredProducts.length !== 1 ? 's' : ''}`}
                        </p>
                    </div>
                </div>
            </div>

            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-6 ml-14">
                <span className="hover:text-primary cursor-pointer" onClick={() => navigate(`/tasks${statusFilter !== 'all' ? `?status=${statusFilter}` : ''}`)}>Tasks</span>
                <ChevronRight size={13} />
                <span className="hover:text-primary cursor-pointer" onClick={() => navigate(`/tasks/leader/${leaderId}${statusFilter !== 'all' ? `?status=${statusFilter}` : ''}`)}>{leaderName}</span>
                <ChevronRight size={13} />
                <span className="text-gray-600 font-medium">{projectName}</span>
            </div>

            {/* Search + Filter */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3 sm:p-4 mb-6 flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search size={17} className="text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search products..."
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

                <div className="flex items-center gap-2">
                    <select
                        className="w-full sm:w-48 px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                        value={statusFilter}
                        onChange={(e) => {
                            const val = e.target.value;
                            setStatusFilter(val);
                            // We don't really need logic to SET searchParams here if we assume it comes from parent, 
                            // but for consistency let's add it if status is changed on this screen
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

            {/* Products List */}
            {loading ? (
                <div className="space-y-3">
                    {[1,2,3].map(i => (
                        <div key={i} className="bg-white border border-gray-100 rounded-xl p-5 animate-pulse flex gap-4 items-center">
                            <div className="w-12 h-12 bg-gray-100 rounded-xl" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-gray-100 rounded w-1/3" />
                                <div className="h-3 bg-gray-100 rounded w-1/4" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : filteredProducts.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl border border-gray-200 shadow-sm">
                    <div className="text-5xl mb-4">📦</div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">No products found</h3>
                    <p className="text-sm text-gray-500">No tasks assigned for this project.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredProducts.map(product => {
                        const total = product.taskCount;
                        const donePercent = total > 0 ? Math.round((product.doneCount / total) * 100) : 0;

                        return (
                            <button
                                key={product.id}
                                onClick={() => navigate(`/tasks/leader/${leaderId}/project/${projectId}/product/${product.id}${statusFilter !== 'all' ? `?status=${statusFilter}` : ''}`)}
                                className="w-full bg-white border border-gray-200 shadow-sm rounded-xl p-5 flex items-center justify-between hover:border-primary hover:shadow-md transition-all group text-left"
                            >
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                    <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm group-hover:bg-primary/20 transition-all shrink-0">
                                        <Package size={20} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h2 className="text-base font-bold text-gray-900 group-hover:text-primary transition-colors leading-tight truncate">
                                            {product.name}
                                        </h2>
                                        <p className="text-xs text-gray-500 mt-0.5">{product.taskCount} Step{product.taskCount !== 1 ? 's' : ''}</p>
                                        {/* Mini progress bar */}
                                        <div className="flex items-center gap-2 mt-2">
                                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden max-w-[140px]">
                                                <div
                                                    className="h-full rounded-full transition-all duration-500"
                                                    style={{ width: `${donePercent}%`, background: donePercent === 100 ? '#16a34a' : '#B8860B' }}
                                                />
                                            </div>
                                            <span className="text-xs text-gray-400 font-semibold">{donePercent}%</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 ml-3">
                                    <div className="hidden sm:flex items-center gap-2">
                                        {product.pendingCount > 0 && (
                                            <span className="flex items-center gap-1 bg-red-50 border border-red-200 text-red-600 text-xs font-bold px-2.5 py-1 rounded-full">
                                                <span className="w-1.5 h-1.5 rounded-full bg-red-400" />{product.pendingCount}
                                            </span>
                                        )}
                                        {product.workingCount > 0 && (
                                            <span className="flex items-center gap-1 bg-yellow-50 border border-yellow-200 text-yellow-700 text-xs font-bold px-2.5 py-1 rounded-full">
                                                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />{product.workingCount}
                                            </span>
                                        )}
                                        {product.doneCount > 0 && (
                                            <span className="flex items-center gap-1 bg-green-50 border border-green-200 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full">
                                                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />{product.doneCount}
                                            </span>
                                        )}
                                    </div>
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                        <ChevronRight size={20} />
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default TaskProducts;
