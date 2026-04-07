import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useBranch } from '../context/BranchContext';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList
} from 'recharts';
import {
    Briefcase,
    CheckCircle,
    Clock,
    Users,
    TrendingUp,
    Shield,
    ClipboardList
} from 'lucide-react';
import PageLoader from '../components/PageLoader';

const COLORS_PIE = ['#ef4444', '#10B981']; // Pending (Amber), Completed (Emerald)

const Dashboard = () => {
    const navigate = useNavigate();
    const { activeBranch } = useBranch();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isMobile = windowWidth < 768;

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get(`/dashboard/stats?branch=${activeBranch}`);
                setStats(res.data);
            } catch (error) {
                console.error("Failed to fetch stats", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [activeBranch]);

    if (loading) return <PageLoader text="Loading dashboard..." />;
    if (!stats) return <div className="p-8 text-center text-red-500">Failed to load data</div>;

    const taskDistributionData = [
        { name: 'Pending', value: stats.pendingTasks || 0 },
        { name: 'Completed', value: stats.completedTasks || 0 }
    ];

    const totalTasks = stats.pendingTasks + stats.completedTasks;
    const completionRate = totalTasks > 0 ? Math.round((stats.completedTasks / totalTasks) * 100) : 0;

    return (
        <div className="space-y-6 pb-10">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="animate-in fade-in slide-in-from-left duration-500">
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                        Dashboard
                    </h1>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Real-time Operations & Logistics Monitor</p>
                </div>

            </div>

            {/* Top Metrics Row */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <StatCard
                    title="Active Projects"
                    count={stats.totalProjects}
                    icon={Briefcase}
                    color="text-indigo-600"
                    bg="bg-indigo-50"
                    border="border-indigo-100"
                    onClick={() => navigate('/projects')}
                />
                <StatCard
                    title="Work Orders"
                    count={stats.totalWorkOrders || 0}
                    icon={ClipboardList}
                    color="text-amber-600"
                    bg="bg-amber-50"
                    border="border-amber-100"
                    onClick={() => navigate('/projects')} // Could navigate to work orders specifically if there's a page
                />
                <StatCard
                    title="Team Leaders"
                    count={stats.totalTeamLeaders}
                    icon={Shield}
                    color="text-primary"
                    bg="bg-primary/5"
                    border="border-primary/20"
                    onClick={() => navigate('/users?role=team_leader')}
                />
                <StatCard
                    title="Employees"
                    count={stats.totalEmployees}
                    icon={Users}
                    color="text-sky-600"
                    bg="bg-sky-50"
                    border="border-sky-100"
                    onClick={() => navigate('/users?role=employee')}
                />
                <StatCard
                    title="Pending Tasks"
                    count={stats.pendingTasks}
                    icon={Clock}
                    color="text-red-600"
                    bg="bg-red-50"
                    border="border-red-100"
                    onClick={() => navigate('/tasks?status=pending')}
                />
                <StatCard
                    title="Completed Tasks"
                    count={stats.completedTasks}
                    icon={CheckCircle}
                    color="text-emerald-600"
                    bg="bg-emerald-50"
                    border="border-emerald-100"
                    onClick={() => navigate('/tasks?status=completed')}
                />
            </div>

            {/* Middle Section: Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">

                {/* 1. Task Distribution (PIE CHART) */}
                <div className="lg:col-span-4 bg-white p-6 rounded-md border border-gray-100 shadow-sm flex flex-col h-full hover:shadow-md transition-all">
                    <div className="mb-6">
                        <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Workflow Efficiency</h3>
                        <div className="flex items-center justify-between">
                            <span className="text-lg font-bold text-gray-800">Task Completion</span>
                            <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-black">
                                <TrendingUp size={12} /> {completionRate}%
                            </div>
                        </div>
                    </div>

                    <div className="relative flex-1 flex flex-col items-center justify-center min-h-[220px]">
                        {/* Center Overlay Label (Rendered before chart so tooltip is on top) */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                            <div className="text-3xl font-black text-gray-900 leading-tight">{totalTasks}</div>
                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Total Tasks</div>
                        </div>

                        <ResponsiveContainer width="100%" height={240} className="relative z-10">
                            <PieChart>
                                <Pie
                                    data={taskDistributionData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={90}
                                    paddingAngle={8}
                                    dataKey="value"
                                    animationBegin={0}
                                    animationDuration={1500}
                                >
                                    {taskDistributionData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS_PIE[index % COLORS_PIE.length]} stroke="rgba(255,255,255,0.5)" strokeWidth={2} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    wrapperStyle={{ zIndex: 50 }}
                                    contentStyle={{
                                        borderRadius: '12px',
                                        border: 'none',
                                        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)',
                                        fontSize: '11px',
                                        fontWeight: 'bold',
                                        backgroundColor: '#ffffff'
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-50">
                        <div className="flex items-start gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-[#ef4444] mt-1 shadow-sm shadow-amber-200" />
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase leading-none">Pending</p>
                                <p className="text-base font-black text-gray-800 mt-1">{stats.pendingTasks}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 shadow-sm shadow-emerald-200" />
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase leading-none">Completed</p>
                                <p className="text-base font-black text-gray-800 mt-1">{stats.completedTasks}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Site Progress Tracking (Bar Chart) */}
                <div className="lg:col-span-8 bg-white p-6 rounded-md border border-gray-100 shadow-sm h-full hover:shadow-md transition-all flex flex-col">
                    <div className="flex items-start justify-between mb-6 shrink-0">
                        <div>
                            <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Project Milestones</h3>
                            <span className="text-lg font-bold text-gray-800">Operational Progress</span>
                        </div>
                        <div className="bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest text-right">Avg Across Sites</p>
                            <p className="text-sm font-black text-primary text-right">72.4%</p>
                        </div>
                    </div>

                    <div className="overflow-y-auto pr-2 custom-scrollbar h-[400px]">
                        <div style={{ height: `${Math.max(400, (stats.projectStats?.length || 0) * 45)}px` }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={stats.projectStats || []}
                                    layout="vertical"
                                    margin={{ top: 5, right: 40, left: 20, bottom: 5 }}
                                >
                                    <XAxis type="number" hide domain={[0, 100]} />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        width={140}
                                        tick={{ fill: '#4b5563', fontSize: 10, fontWeight: 700 }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#f9fafb' }}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', fontSize: 11 }}
                                        formatter={(v) => [`${v}%`, 'Progress']}
                                    />
                                    <Bar dataKey="progress" fill="#B8860B" radius={[0, 4, 4, 0]} barSize={18}>
                                        <LabelList dataKey="progress" position="right" formatter={(v) => `${v}%`} fill="#6b7280" fontSize={10} fontWeight={800} />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Row: Inventory & Branches */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

                {/* Inventory Snapshot */}
                <div className="bg-white rounded-md border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full">
                    <div className="p-5 border-b border-gray-50 flex items-center justify-between bg-gray-50/30 shrink-0">
                        <div>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Global Stock</p>
                            <h3 className="text-sm font-black text-gray-800">Inventory Status</h3>
                        </div>
                        <button
                            onClick={() => navigate('/inventory')}
                            className="bg-white text-gray-500 hover:text-primary p-2 rounded border border-gray-200 transition-colors"
                        >
                            <TrendingUp size={14} />
                        </button>
                    </div>
                    <div className="overflow-y-auto p-5 custom-scrollbar h-[400px]">
                        <div style={{ height: `${Math.max(400, (stats.inventoryStats?.length || 0) * 45)}px` }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={stats.inventoryStats || []}
                                    layout="vertical"
                                    margin={{ top: 5, right: 50, left: 10, bottom: 5 }}
                                >
                                    <XAxis type="number" hide />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        width={140}
                                        tick={{ fill: '#4b5563', fontSize: 10, fontWeight: 700 }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', fontSize: 11 }}
                                    />
                                    <Bar dataKey="totalStock" fill="#B8860B" radius={[0, 4, 4, 0]} barSize={18}>
                                        <LabelList dataKey="totalStock" position="right" fill="#B8860B" fontSize={10} fontWeight={900} />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Regional Table */}
                <div className="bg-white rounded-md border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full">
                    <div className="p-5 border-b border-gray-50 bg-gray-50/30">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Territory Management</p>
                        <h3 className="text-sm font-black text-gray-800 uppercase">Field Unit Comparison</h3>
                    </div>
                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/50">
                                <tr>
                                    <th className="px-5 py-3 text-[10px] font-black text-gray-400 uppercase">Location</th>
                                    <th className="px-5 py-3 text-[10px] font-black text-gray-400 uppercase text-center">Sites</th>
                                    <th className="px-5 py-3 text-[10px] font-black text-gray-400 uppercase text-right">Yield %</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {stats.branchSummary?.map((b) => (
                                    <tr key={b.name} className="hover:bg-gray-50/50 transition-colors group cursor-default">
                                        <td className="px-5 py-4 min-w-[140px]">
                                            <div className="flex items-center gap-3">
                                                <div className="w-7 h-7 rounded-md bg-gray-100 flex items-center justify-center text-[10px] font-black text-gray-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                                    {b.name.charAt(0)}
                                                </div>
                                                <span className="text-xs font-black text-gray-700 uppercase tracking-tight">{b.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <span className="text-xs font-black text-gray-800">{b.projectCount}</span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <div className="w-16 h-1 bg-gray-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: `${b.avgProgress}%` }} />
                                                </div>
                                                <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">{b.avgProgress}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="p-4 border-t border-gray-50 bg-gray-50/10 text-center">
                        <button
                            onClick={() => navigate('/branches')}
                            className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] hover:text-primary transition-colors"
                        >
                            View Territory Ledger →
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// StatCard Component
const StatCard = ({ title, count, icon: Icon, color, bg, border, onClick }) => (
    <button
        onClick={onClick}
        className={`bg-white p-5 rounded-md border ${border} shadow-sm flex flex-col items-start gap-4 hover:shadow-md transition-all hover:translate-y-[-2px] active:translate-y-0 group relative overflow-hidden`}
    >
        <div className={`p-2 rounded-lg ${bg} ${color} transition-colors group-hover:bg-white group-hover:border group-hover:border-current border border-transparent`}>
            <Icon size={18} strokeWidth={2.5} />
        </div>
        <div>
            <h3 className="text-2xl font-black text-gray-900 tracking-tighter leading-none">{count}</h3>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1.5">{title}</p>
        </div>
        {/* Subtle Background Pattern */}
        <Icon size={64} className={`absolute -right-4 -bottom-4 opacity-[0.03] ${color} rotate-12 group-hover:rotate-0 transition-transform duration-700`} />
    </button>
);

export default Dashboard;
