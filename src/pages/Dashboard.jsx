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
    TrendingUp
} from 'lucide-react';
import PageLoader from '../components/PageLoader';

const COLORS = ['#FFBB28', '#00C49F']; // Pending (Orange), Completed (Green)

const Dashboard = () => {
    const navigate = useNavigate();
    const { activeBranch } = useBranch();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [availableBranches, setAvailableBranches] = useState([]);
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

    useEffect(() => {
        const fetchBranches = async () => {
            try {
                const [pRes, uRes] = await Promise.all([
                    api.get('/projects'),
                    api.get('/users')
                ]);
                const pBranches = pRes.data.map(p => p.branch).filter(Boolean);
                const uBranches = uRes.data.flatMap(u => u.branches || []);
                const unique = [...new Set([...pBranches, ...uBranches])].sort();
                setAvailableBranches(unique);
            } catch (e) { }
        };
        fetchBranches();
    }, []);

    if (loading) return <PageLoader text="Loading dashboard..." />;
    if (!stats) return <div className="p-8 text-center text-red-500">Failed to load data</div>;

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                    <h1 className="text-lg font-bold text-gray-900 leading-tight">Corporate Dashboard</h1>
                    <p className="text-gray-400 text-xs mt-0.5 italic">Overview of projects and infrastructure progress</p>
                </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <StatCard
                    title="Total Projects"
                    count={stats.totalProjects}
                    icon={Briefcase}
                    color="bg-primary"
                    onClick={() => navigate('/projects', { state: { fromDashboard: true } })}
                />
                <StatCard
                    title="Team Leaders"
                    count={stats.totalTeamLeaders}
                    icon={Users}
                    color="bg-primary"
                    onClick={() => navigate('/users', { state: { fromDashboard: true } })}
                />
                <StatCard
                    title="Employees"
                    count={stats.totalEmployees}
                    icon={Users}
                    color="bg-accent"
                    onClick={() => navigate('/users', { state: { fromDashboard: true } })}
                />
                <StatCard
                    title="Pending Tasks"
                    count={stats.pendingTasks}
                    icon={Clock}
                    color="bg-red-500"
                    onClick={() => navigate('/tasks?status=pending', { state: { fromDashboard: true } })}
                />
                <StatCard
                    title="Completed Tasks"
                    count={stats.completedTasks}
                    icon={CheckCircle}
                    color="bg-green-500"
                    onClick={() => navigate('/tasks?status=completed', { state: { fromDashboard: true } })}
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
                {/* Project Progress Overview */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 lg:col-span-1 flex flex-col">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Progress</h3>
                    <div className="flex-grow overflow-y-auto md:max-h-[400px] overflow-x-hidden pr-2 custom-scrollbar" style={{ minHeight: '300px' }}>
                        <div style={{ height: `${Math.max(300, (stats?.projectStats?.length || 1) * 45)}px`, width: '100%', minHeight: '1px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={stats.projectStats || []}
                                    layout="vertical"
                                    margin={{ top: 5, right: 50, left: 10, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                                    <XAxis type="number" domain={[0, 100]} hide />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        width={120}
                                        tick={{ fill: '#4b5563', fontSize: 11, fontWeight: 500 }}
                                        axisLine={{ stroke: '#e5e7eb' }}
                                        tickLine={false}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#f9fafb' }}
                                        formatter={(value, name, props) => {
                                            if (name === 'Progress') return [`${value}%`, name];
                                            return [value, name];
                                        }}
                                        labelFormatter={(label) => {
                                            const project = stats.projectStats?.find(p => p.name === label);
                                            return `${label} (${project?.completedTasks}/${project?.totalTasks} Tasks)`;
                                        }}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                    />
                                    <Bar dataKey="progress" fill="#B8860B" radius={[0, 4, 4, 0]} barSize={24}>
                                        <LabelList dataKey="progress" position="right" formatter={(v) => `${v}%`} fill="#4b5563" fontSize={11} fontWeight={600} />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Inventory Stock Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 lg:col-span-2">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Inventory Stock Levels</h3>
                    <div className="h-auto md:h-80 overflow-y-auto md:overflow-y-auto overflow-x-hidden pr-2 custom-scrollbar" style={{ minHeight: '320px' }}>
                        <div style={{ height: `${Math.max(300, (stats?.inventoryStats?.length || 1) * 45)}px`, width: '100%', minHeight: '1px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={stats.inventoryStats || []}
                                    layout="vertical"
                                    margin={{
                                        top: 5,
                                        right: isMobile ? 45 : 75,
                                        left: isMobile ? -20 : 10,
                                        bottom: 5
                                    }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                                    <XAxis
                                        type="number"
                                        axisLine={{ stroke: '#e5e7eb' }}
                                        tickLine={false}
                                        tick={{ fill: '#9ca3af', fontSize: isMobile ? 10 : 12 }}
                                    />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        width={isMobile ? 100 : 160}
                                        axisLine={{ stroke: '#e5e7eb' }}
                                        tickLine={false}
                                        tick={{
                                            fill: '#4b5563',
                                            fontSize: isMobile ? 10 : 11,
                                            fontWeight: 500
                                        }}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#f9fafb' }}
                                        contentStyle={{
                                            borderRadius: '12px',
                                            border: 'none',
                                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                            padding: '12px'
                                        }}
                                    />
                                    <Bar
                                        dataKey="totalStock"
                                        fill="#B8860B"
                                        radius={[0, 6, 6, 0]}
                                        name="Stock Units"
                                        barSize={24}
                                    >
                                        <LabelList
                                            dataKey="totalStock"
                                            position="right"
                                            offset={10}
                                            fill="#4b5563"
                                            fontSize={12}
                                            fontWeight={600}
                                        />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>

            {/* Branch-wise Comparison Overview */}
            {stats.branchSummary && stats.branchSummary.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-8">
                    <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                        <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                            Regional Branch Performance
                        </h3>
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 bg-white px-2 py-1 rounded border border-gray-200">
                            Comparative View
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                                    <th className="px-4 py-3">Branch</th>
                                    <th className="px-4 py-3 text-center">Projects</th>
                                    <th className="px-4 py-3 text-center hidden sm:table-cell">Leaders</th>
                                    <th className="px-4 py-3 hidden sm:table-cell">Progress</th>
                                    <th className="px-4 py-3 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {stats.branchSummary.map((b) => (
                                    <tr key={b.name} className="hover:bg-gray-50/80 transition-colors">
                                        <td className="px-4 py-3">
                                            <span className="font-bold text-gray-800 text-sm">{b.name}</span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 text-gray-700 text-xs font-bold border border-gray-200">
                                                {b.projectCount}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center hidden sm:table-cell">
                                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-accent/10 text-accent text-xs font-bold border border-accent/20">
                                                {b.leaderCount}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 hidden sm:table-cell">
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-primary transition-all duration-500" style={{ width: `${b.avgProgress}%` }} />
                                                </div>
                                                <span className="text-xs font-bold text-gray-500 w-8 text-right">{b.avgProgress}%</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border whitespace-nowrap ${
                                                b.avgProgress === 100 ? 'bg-green-50 text-green-600 border-green-200'
                                                : b.avgProgress > 0 ? 'bg-primary/5 text-primary border-primary/20'
                                                : 'bg-red-50 text-red-600 border-red-200'
                                            }`}>
                                                {b.avgProgress === 100 ? 'Done' : b.avgProgress > 0 ? 'Active' : 'Planning'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

// Helper Component for Stats
const StatCard = ({ title, count, icon: Icon, color, onClick }) => (
    <button
        onClick={onClick}
        className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between hover:shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] text-left w-full cursor-pointer"
    >
        <div className="min-w-0">
            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wide truncate">{title}</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-0.5">{count}</h3>
        </div>
        <div className={`p-2.5 rounded-full ${color} bg-opacity-10 shrink-0 ml-2`}>
            <Icon className={`w-5 h-5 ${color.replace('bg-', 'text-')}`} />
        </div>
    </button>
);

export default Dashboard;
