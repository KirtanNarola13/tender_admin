import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Plus, Search, Building2, MapPin, Pencil, Trash2, ArrowLeft, Loader2, UserCheck } from 'lucide-react';
import { useBranch } from '../context/BranchContext';

const Branches = () => {
    const { user: currentUser } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const fromDashboard = location.state?.fromDashboard;
    const { refreshBranches } = useBranch();
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBranch, setEditingBranch] = useState(null);
    const [formData, setFormData] = useState({ name: '', location: '', description: '', status: 'active' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);
    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/branches');
            setBranches(res.data);
        } catch (error) {
            console.error('Failed to fetch branch data');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (branch = null) => {
        if (branch) {
            setEditingBranch(branch);
            setFormData({
                name: branch.name,
                location: branch.location,
                description: branch.description || '',
                status: branch.status || 'active'
            });
        } else {
            setEditingBranch(null);
            setFormData({ name: '', location: '', description: '', status: 'active' });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async () => {
        if (!formData.name || !formData.location) {
            alert('Name and Location are required');
            return;
        }

        setIsSubmitting(true);
        try {
            if (editingBranch) {
                await api.put(`/branches/${editingBranch._id}`, formData);
            } else {
                await api.post('/branches', formData);
            }
            setIsModalOpen(false);
            fetchData();
            if (refreshBranches) refreshBranches(); // Sync the global switcher
        } catch (error) {
            alert(error.response?.data?.message || 'Operation failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (branch) => {
        if (!window.confirm(`Are you sure you want to delete the "${branch.name}" branch?`)) return;
        try {
            await api.delete(`/branches/${branch._id}`);
            fetchData();
            if (refreshBranches) refreshBranches();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to delete branch');
        }
    };

    const filteredBranches = branches.filter(b => 
        b.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        b.location.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    {fromDashboard && (
                        <button 
                            onClick={() => navigate('/')}
                            className="flex items-center gap-1.5 text-primary text-xs font-bold uppercase tracking-wider hover:gap-2 transition-all w-fit mb-2"
                        >
                            <ArrowLeft size={14} /> Back to Dashboard
                        </button>
                    )}
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Branch Management</h1>
                    <p className="text-gray-500 text-sm mt-1">Define and manage regional territories for KG INFRA.</p>
                </div>
                {currentUser?.role === 'admin' && (
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center justify-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                        <Plus size={18} />
                        Add New Branch
                    </button>
                )}
            </div>

            {/* Toolbar */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by name or location..."
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <Loader2 className="animate-spin text-primary" size={40} />
                    <p className="text-gray-500 font-medium">Loading regional data...</p>
                </div>
            ) : filteredBranches.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Building2 className="text-gray-300" size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">No branches found</h3>
                    <p className="text-gray-500 text-sm mt-1">Try adjusting your search or add a new branch to get started.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredBranches.map((branch) => (
                        <div key={branch._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden group">
                            <div className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                                        <Building2 size={24} />
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={() => handleOpenModal(branch)}
                                            className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                                            title="Edit Branch"
                                        >
                                            <Pencil size={18} />
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(branch)}
                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Delete Branch"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 leading-tight mb-1">{branch.name}</h3>
                                <div className="flex items-center gap-1.5 text-gray-500 text-sm mb-4">
                                    <MapPin size={14} className="text-primary/60" />
                                    {branch.location}
                                </div>
                                
                                <div className="space-y-3 pt-4 border-t border-gray-50">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-gray-400 font-bold uppercase tracking-wider">Status</span>
                                        <span className={`px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter text-[10px] ${
                                            branch.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                                        }`}>
                                            {branch.status}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                    <div className="bg-white rounded-3xl w-full max-w-lg relative z-10 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">{editingBranch ? 'Edit Branch' : 'Register New Branch'}</h2>
                                <p className="text-xs text-gray-500 mt-0.5">Define a regional territory for site management</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400">
                                <Plus size={20} className="rotate-45" />
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Branch Name *</label>
                                    <input
                                        className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm transition-all shadow-sm"
                                        placeholder="e.g. Surat"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Location / City *</label>
                                    <input
                                        className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm transition-all shadow-sm"
                                        placeholder="e.g. Gujarat, India"
                                        value={formData.location}
                                        onChange={e => setFormData({ ...formData, location: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Description (Optional)</label>
                                <textarea
                                    className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm transition-all shadow-sm resize-none h-20"
                                    placeholder="Brief overview of this branch..."
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 text-gray-400">Operational Status</label>
                                    <select
                                        className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white text-sm transition-all shadow-sm"
                                        value={formData.status}
                                        onChange={e => setFormData({ ...formData, status: e.target.value })}
                                    >
                                        <option value="active">🟢 Active</option>
                                        <option value="inactive">🔴 Inactive</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/30">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-100 transition-colors text-sm font-bold"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="flex items-center justify-center gap-2 bg-primary text-white px-8 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="animate-spin" size={18} />
                                        Processing...
                                    </>
                                ) : editingBranch ? 'Update Branch' : 'Create Branch'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Branches;
