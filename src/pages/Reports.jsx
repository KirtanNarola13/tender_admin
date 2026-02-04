import { useEffect, useState } from 'react';
import api from '../services/api';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Trophy, AlertCircle } from 'lucide-react';

const Reports = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await api.get('/dashboard/employee-performance');
                setData(res.data);
            } catch (error) {
                console.error("Failed to fetch reports", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <div className="p-8 text-center">Loading Reports...</div>;

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-gray-800">Employee Performance Reports</h1>

            {/* Performance Chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-700 mb-6">Task Completion by Employee</h3>
                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={data}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} />
                            <YAxis axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                            <Legend />
                            <Bar dataKey="completed" name="Completed" fill="#10B981" radius={[4, 4, 0, 0]} barSize={40} />
                            <Bar dataKey="pending" name="Pending" fill="#F59E0B" radius={[4, 4, 0, 0]} barSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Leaderboard Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center gap-2">
                    <Trophy className="text-yellow-500" size={20} />
                    <h3 className="text-lg font-semibold text-gray-800">Rankings & Details</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-500 text-sm uppercase">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Rank</th>
                                <th className="px-6 py-4 font-semibold">Employee</th>
                                <th className="px-6 py-4 font-semibold text-center">Completion Rate</th>
                                <th className="px-6 py-4 font-semibold text-center">Assigned</th>
                                <th className="px-6 py-4 font-semibold text-center">Completed</th>
                                <th className="px-6 py-4 font-semibold text-center">Pending</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {data.map((emp, index) => (
                                <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <span className={`
                                            inline-flex items-center justify-center w-8 h-8 rounded-full font-bold
                                            ${index === 0 ? 'bg-yellow-100 text-yellow-700' :
                                                index === 1 ? 'bg-gray-100 text-gray-700' :
                                                    index === 2 ? 'bg-orange-100 text-orange-700' : 'text-gray-500'}
                                        `}>
                                            {index + 1}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="font-medium text-gray-900">{emp.name}</p>
                                            <p className="text-sm text-gray-500">{emp.email}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${emp.completionRate >= 80 ? 'bg-green-100 text-green-700' :
                                                emp.completionRate >= 50 ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-red-100 text-red-700'
                                            }`}>
                                            {emp.completionRate}%
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center text-gray-700">{emp.totalAssigned}</td>
                                    <td className="px-6 py-4 text-center text-gray-700">{emp.completed}</td>
                                    <td className="px-6 py-4 text-center text-gray-700">{emp.pending}</td>
                                </tr>
                            ))}
                            {data.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500 flex flex-col items-center">
                                        <AlertCircle size={32} className="mb-2 text-gray-300" />
                                        No employee performance data available.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Reports;
