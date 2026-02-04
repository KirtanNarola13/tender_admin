import { useEffect, useState } from 'react';
import api from '../services/api';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid
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
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

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

    const taskData = [
        { name: 'Pending', value: stats.pendingTasks },
        { name: 'Completed', value: stats.completedTasks },
    ];

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-gray-800">Corporate Dashboard</h1>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard
                    title="Total Projects"
                    count={stats.totalProjects}
                    icon={Briefcase}
                    color="bg-blue-500"
                />
                <StatCard
                    title="Team Leaders"
                    count={stats.totalTeamLeaders}
                    icon={Users}
                    color="bg-indigo-500"
                />
                <StatCard
                    title="Employees"
                    count={stats.totalEmployees}
                    icon={Users}
                    color="bg-purple-500"
                />
                <StatCard
                    title="Pending Tasks"
                    count={stats.pendingTasks}
                    icon={Clock}
                    color="bg-orange-500"
                />
                <StatCard
                    title="Completed Tasks"
                    count={stats.completedTasks}
                    icon={CheckCircle}
                    color="bg-green-500"
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Task Distribution */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-1">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4">Task Overview</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={taskData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {taskData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Inventory Stock Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4">Inventory Stock Levels</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.inventoryStats || []} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} />
                                <YAxis allowDecimals={false} />
                                <Tooltip
                                    cursor={{ fill: '#f3f4f6' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Bar dataKey="totalStock" fill="#6366f1" radius={[4, 4, 0, 0]} name="Stock Units" barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Quick Actions Row */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h3 className="text-lg font-semibold text-gray-700">Quick Actions</h3>
                    <p className="text-gray-500 text-sm">
                        Pending tasks require your attention. Quickly review and verify completions.
                    </p>
                </div>

                <a
                    href="/verify"
                    className="flex items-center gap-3 px-6 py-3 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors group"
                >
                    <div className="flex items-center gap-3">
                        <CheckCircle className="text-indigo-600" size={20} />
                        <span className="text-indigo-900 font-bold">Verify Pending Tasks</span>
                    </div>
                    <TrendingUp className="text-indigo-400 group-hover:translate-x-1 transition-transform" size={18} />
                </a>
            </div>
        </div>
    );
};

// Helper Component for Stats
const StatCard = ({ title, count, icon: Icon, color }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
        <div>
            <p className="text-gray-500 text-sm font-medium uppercase tracking-wide">{title}</p>
            <h3 className="text-3xl font-bold text-gray-900 mt-1">{count}</h3>
        </div>
        <div className={`p-3 rounded-full ${color} bg-opacity-10`}>
            <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
        </div>
    </div>
);

export default Dashboard;
