import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
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

const COLORS = ['#FFBB28', '#00C49F']; // Pending (Orange), Completed (Green)

const Dashboard = () => {
    const navigate = useNavigate();
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
                const res = await api.get('/dashboard/stats');
                setStats(res.data);
            } catch (error) {
                console.error("Failed to fetch stats", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <div className="p-8 text-center">Loading Dashboard...</div>;
    if (!stats) return <div className="p-8 text-center text-red-500">Failed to load data</div>;

    // Previous taskData is no longer needed for Pie chart

    return (
        <div className="space-y-8">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-1">Corporate Dashboard</h1>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard
                    title="Total Projects"
                    count={stats.totalProjects}
                    icon={Briefcase}
                    color="bg-primary"
                    onClick={() => navigate('/projects')}
                />
                <StatCard
                    title="Team Leaders"
                    count={stats.totalTeamLeaders}
                    icon={Users}
                    color="bg-indigo-500"
                    onClick={() => navigate('/users')}
                />
                <StatCard
                    title="Employees"
                    count={stats.totalEmployees}
                    icon={Users}
                    color="bg-purple-500"
                    onClick={() => navigate('/users')}
                />
                <StatCard
                    title="Pending Tasks"
                    count={stats.pendingTasks}
                    icon={Clock}
                    color="bg-orange-500"
                    onClick={() => navigate('/tasks?status=pending')}
                />
                <StatCard
                    title="Completed Tasks"
                    count={stats.completedTasks}
                    icon={CheckCircle}
                    color="bg-green-500"
                    onClick={() => navigate('/tasks?status=completed')}
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Project Progress Overview */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 lg:col-span-1 flex flex-col">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Progress</h3>
                    <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar" style={{ maxHeight: '400px' }}>
                        <div style={{ height: `${Math.max(300, (stats.projectStats?.length || 0) * 45)}px`, width: '100%' }}>
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
                    <div className="h-80 overflow-y-auto pr-2 custom-scrollbar">
                        <div style={{ height: `${Math.max(300, (stats.inventoryStats?.length || 0) * 45)}px`, width: '100%' }}>
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
                                        fill="#6366f1"
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

        </div>
    );
};

// Helper Component for Stats
const StatCard = ({ title, count, icon: Icon, color, onClick }) => (
    <button 
        onClick={onClick}
        className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between hover:shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] text-left w-full cursor-pointer"
    >
        <div>
            <p className="text-gray-500 text-sm font-medium uppercase tracking-wide">{title}</p>
            <h3 className="text-3xl font-bold text-gray-900 mt-1">{count}</h3>
        </div>
        <div className={`p-3 rounded-full ${color} bg-opacity-10`}>
            <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
        </div>
    </button>
);

export default Dashboard;
