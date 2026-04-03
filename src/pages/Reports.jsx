import { useEffect, useState } from 'react';
import api from '../services/api';
import { useBranch } from '../context/BranchContext';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Trophy, AlertCircle, Eye, X } from 'lucide-react';
import PageLoader from '../components/PageLoader';

const Reports = () => {
    const { activeBranch } = useBranch();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewingEmp, setViewingEmp] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await api.get(`/dashboard/employee-performance?branch=all`);
                setData(res.data);
            } catch (error) {
                console.error("Failed to fetch reports", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <PageLoader text="Loading reports..." />;

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-lg font-bold text-gray-900 leading-tight">Employee Performance Reports</h1>
                <p className="text-gray-400 text-xs mt-0.5">Task completion and rankings across all employees.</p>
            </div>

            {/* Performance Chart */}
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Task Completion by Employee</h3>
                <div className="h-64 sm:h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                            <Legend />
                            <Bar dataKey="completed" name="Completed" fill="#10B981" radius={[4, 4, 0, 0]} barSize={32} />
                            <Bar dataKey="pending" name="Pending" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={32} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Leaderboard Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center gap-2">
                    <Trophy className="text-yellow-500" size={18} />
                    <h3 className="text-sm font-semibold text-gray-800">Rankings & Details</h3>
                </div>
                <div className="overflow-auto max-h-[60vh]">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                            <tr>
                                <th className="sticky top-0 bg-gray-50 px-4 py-3 font-semibold">#</th>
                                <th className="sticky top-0 bg-gray-50 px-4 py-3 font-semibold">Employee</th>
                                <th className="sticky top-0 bg-gray-50 px-4 py-3 font-semibold text-center">Rate</th>
                                <th className="sticky top-0 bg-gray-50 px-4 py-3 font-semibold text-center hidden sm:table-cell">Assigned</th>
                                <th className="sticky top-0 bg-gray-50 px-4 py-3 font-semibold text-center hidden sm:table-cell">Done</th>
                                <th className="sticky top-0 bg-gray-50 px-4 py-3 font-semibold text-center hidden sm:table-cell">Pending</th>
                                {/* Eye column — mobile only */}
                                <th className="sticky top-0 bg-gray-50 px-4 py-3 sm:hidden" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {data.map((emp, index) => (
                                <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full font-bold text-xs ${
                                            index === 0 ? 'bg-yellow-100 text-yellow-700' :
                                            index === 1 ? 'bg-gray-100 text-gray-700' :
                                            index === 2 ? 'bg-orange-100 text-orange-700' : 'text-gray-500'
                                        }`}>{index + 1}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <p className="font-medium text-gray-900 text-sm">{emp.name}</p>
                                        <p className="text-xs text-gray-400 truncate max-w-[120px] sm:max-w-none">{emp.email}</p>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                            emp.completionRate >= 80 ? 'bg-green-100 text-green-700' :
                                            emp.completionRate >= 50 ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-red-100 text-red-700'
                                        }`}>{emp.completionRate}%</span>
                                    </td>
                                    <td className="px-4 py-3 text-center text-sm text-gray-700 hidden sm:table-cell">{emp.totalAssigned}</td>
                                    <td className="px-4 py-3 text-center text-sm text-gray-700 hidden sm:table-cell">{emp.completed}</td>
                                    <td className="px-4 py-3 text-center text-sm text-gray-700 hidden sm:table-cell">{emp.pending}</td>
                                    {/* Eye button — mobile only */}
                                    <td className="px-3 py-3 sm:hidden">
                                        <button
                                            onClick={() => setViewingEmp(emp)}
                                            className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                                        >
                                            <Eye size={15} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {data.length === 0 && (
                                <tr>
                                    <td colSpan="7" className="px-6 py-8 text-center text-gray-400">
                                        <AlertCircle size={28} className="mb-2 text-gray-300 mx-auto" />
                                        No employee performance data available.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* View modal — shows hidden columns on mobile */}
            {viewingEmp && (
                <div
                    className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center p-4 z-[100] backdrop-blur-sm"
                    onClick={() => setViewingEmp(null)}
                >
                    <div
                        className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="p-4 border-b flex items-center justify-between">
                            <div>
                                <p className="font-bold text-gray-900 text-sm">{viewingEmp.name}</p>
                                <p className="text-xs text-gray-400">{viewingEmp.email}</p>
                            </div>
                            <button onClick={() => setViewingEmp(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                                <X size={16} />
                            </button>
                        </div>
                        <div className="p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Completion Rate</span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                    viewingEmp.completionRate >= 80 ? 'bg-green-100 text-green-700' :
                                    viewingEmp.completionRate >= 50 ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-red-100 text-red-700'
                                }`}>{viewingEmp.completionRate}%</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Assigned</span>
                                <span className="text-sm font-semibold text-gray-700">{viewingEmp.totalAssigned}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Completed</span>
                                <span className="text-sm font-semibold text-green-600">{viewingEmp.completed}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pending</span>
                                <span className="text-sm font-semibold text-red-600">{viewingEmp.pending}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Reports;
