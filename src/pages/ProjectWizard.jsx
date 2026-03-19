import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { ChevronRight, ChevronLeft, Trash2, Box, ArrowLeft, CheckCircle, Loader } from 'lucide-react';

const CATEGORIES = ['Primary', 'Upper Primary', 'Secondary', 'Higher Secondary', 'Residential'];

const ProjectWizard = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    const [projectData, setProjectData] = useState({
        name: '',
        client: '',
        category: 'Primary',
        location: '',
        startDate: '',
        deadline: '',
        description: '',
        assignedLeader: ''
    });

    const [availableProducts, setAvailableProducts] = useState([]);
    const [teamLeaders, setTeamLeaders] = useState([]);
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [dataLoading, setDataLoading] = useState(true);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const [prodRes, usersRes] = await Promise.all([
                api.get('/inventory/products'),
                api.get('/users?role=team_leader')
            ]);
            setAvailableProducts(prodRes.data);
            setTeamLeaders(usersRes.data.filter(u => u.role === 'team_leader'));
        } catch (e) {
            console.error('Failed to load wizard data', e);
        } finally {
            setDataLoading(false);
        }
    };

    // ── Product helpers ─────────────────────────────────────────────
    const addProduct = (productId) => {
        const product = availableProducts.find(p => p._id === productId);
        if (!product) return;
        if (selectedProducts.find(p => p.product._id === productId)) return;
        setSelectedProducts([...selectedProducts, { product, plannedQuantity: 1 }]);
    };

    const updateQuantity = (index, qty) => {
        const updated = [...selectedProducts];
        updated[index].plannedQuantity = Number(qty);
        setSelectedProducts(updated);
    };

    const removeProduct = (index) => {
        setSelectedProducts(selectedProducts.filter((_, i) => i !== index));
    };

    // ── Submit ──────────────────────────────────────────────────────
    const handleSubmit = async () => {
        if (!projectData.name || !projectData.assignedLeader || selectedProducts.length === 0) {
            alert('Please fill in Name, assign a Leader, and add at least one Product.');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                ...projectData,
                products: selectedProducts.map(item => ({
                    product: item.product._id,
                    plannedQuantity: item.plannedQuantity
                }))
            };

            await api.post('/projects', payload);
            alert('Project Launched Successfully! 🚀');
            navigate('/projects');
        } catch (e) {
            console.error(e);
            alert('Failed to create project: ' + (e.response?.data?.message || e.message));
        } finally {
            setLoading(false);
        }
    };

    // ── Step 1: Site Details ────────────────────────────────────────
    const renderStep1 = () => (
        <div className="space-y-5">
            <div>
                <h2 className="text-xl font-bold text-gray-900">Step 1: Site Details</h2>
                <p className="text-sm text-gray-400 mt-0.5">Enter the core information for this project</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Site Name *</label>
                    <input
                        className="w-full border border-gray-200 p-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="Enter Site Name"
                        value={projectData.name}
                        onChange={e => setProjectData({ ...projectData, name: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Client Name</label>
                    <input
                        className="w-full border border-gray-200 p-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="Enter Client Name"
                        value={projectData.client}
                        onChange={e => setProjectData({ ...projectData, client: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Category / Type</label>
                    <select
                        className="w-full border border-gray-200 p-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                        value={projectData.category}
                        onChange={e => setProjectData({ ...projectData, category: e.target.value })}
                    >
                        {CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Location / City</label>
                    <input
                        className="w-full border border-gray-200 p-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="Enter Location"
                        value={projectData.location}
                        onChange={e => setProjectData({ ...projectData, location: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Team Leader *</label>
                    <select
                        className="w-full border border-gray-200 p-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                        value={projectData.assignedLeader}
                        onChange={e => setProjectData({ ...projectData, assignedLeader: e.target.value })}
                    >
                        <option value="">— Select Team Leader —</option>
                        {teamLeaders.map(u => (
                            <option key={u._id} value={u._id}>{u.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Start Date</label>
                    <input
                        type="date"
                        className="w-full border border-gray-200 p-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        value={projectData.startDate}
                        onChange={e => {
                            const newStartDate = e.target.value;
                            const updates = { startDate: newStartDate };
                            if (newStartDate && projectData.deadline && new Date(projectData.deadline) < new Date(newStartDate)) {
                                updates.deadline = '';
                            }
                            setProjectData({ ...projectData, ...updates });
                        }}
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Deadline / End Date</label>
                    <input
                        type="date"
                        className="w-full border border-gray-200 p-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        value={projectData.deadline}
                        min={projectData.startDate || ''}
                        onChange={e => setProjectData({ ...projectData, deadline: e.target.value })}
                    />
                </div>
            </div>

            <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Description / Scope of Work</label>
                <textarea
                    className="w-full border border-gray-200 p-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    placeholder="Enter scope of work or notes..."
                    rows={3}
                    value={projectData.description}
                    onChange={e => setProjectData({ ...projectData, description: e.target.value })}
                />
            </div>
        </div>
    );

    // ── Step 2: Products ────────────────────────────────────────────
    const renderStep2 = () => (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Step 2: Products</h2>
                    <p className="text-sm text-gray-400 mt-0.5">Add products to this project's scope of supply</p>
                </div>
                <select
                    className="border border-gray-200 p-2.5 rounded-lg text-sm w-full sm:w-64 bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                    onChange={(e) => {
                        addProduct(e.target.value);
                        e.target.value = '';
                    }}
                >
                    <option value="">+ Add Product</option>
                    {availableProducts
                        .filter(p => !selectedProducts.find(sp => sp.product._id === p._id))
                        .map(p => (
                            <option key={p._id} value={p._id} disabled={p.totalStock <= 0}>
                                {p.name} (Stock: {p.totalStock || 0})
                            </option>
                        ))
                    }
                </select>
            </div>

            {selectedProducts.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 border border-dashed border-gray-300 rounded-xl text-gray-400">
                    <Box size={32} className="mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No products added yet. Select a product above.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {selectedProducts.map((item, idx) => {
                        const isStockLow = item.plannedQuantity > (item.product.totalStock || 0);
                        return (
                            <div
                                key={item.product._id}
                                className={`flex items-center justify-between border p-4 rounded-xl bg-white shadow-sm transition ${isStockLow ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="bg-blue-50 p-2 rounded-lg text-primary flex-shrink-0">
                                        <Box size={22} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm">{item.product.name}</h4>
                                        <p className="text-xs text-gray-500">
                                            {item.product.category} &nbsp;|&nbsp;
                                            <span className="font-semibold text-gray-700">Available: {item.product.totalStock || 0}</span>
                                        </p>
                                        {isStockLow && (
                                            <span className="text-xs text-red-600 font-bold">⚠ Exceeds current stock!</span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white">
                                        <span className="px-3 py-2 bg-gray-50 text-xs border-r text-gray-500">Qty</span>
                                        <input
                                            type="number"
                                            min="1"
                                            className="w-16 p-2 text-center text-sm outline-none"
                                            value={item.plannedQuantity}
                                            onChange={e => updateQuantity(idx, e.target.value)}
                                        />
                                    </div>
                                    <button
                                        onClick={() => removeProduct(idx)}
                                        className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );

    // ── Step 3: Review ──────────────────────────────────────────────
    const renderStep3 = () => (
        <div className="space-y-5">
            <div>
                <h2 className="text-xl font-bold text-gray-900">Step 3: Review & Launch</h2>
                <p className="text-sm text-gray-400 mt-0.5">Confirm all details before launching the project</p>
            </div>

            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 space-y-5">
                <div className="grid grid-cols-2 gap-4 text-sm">
                    {[
                        { label: 'Site Name', value: projectData.name },
                        { label: 'Client', value: projectData.client },
                        { label: 'Category', value: projectData.category },
                        { label: 'Location', value: projectData.location },
                        { label: 'Team Leader', value: teamLeaders.find(u => u._id === projectData.assignedLeader)?.name || 'Unassigned' },
                        { label: 'Start Date', value: projectData.startDate || '—' },
                        { label: 'Deadline', value: projectData.deadline || '—' },
                    ].map(({ label, value }) => (
                        <div key={label}>
                            <span className="text-gray-400 block text-xs uppercase tracking-wide">{label}</span>
                            <span className="font-semibold text-gray-800">{value || '—'}</span>
                        </div>
                    ))}
                </div>

                {projectData.description && (
                    <div>
                        <span className="text-gray-400 block text-xs uppercase tracking-wide mb-1">Description</span>
                        <p className="text-sm text-gray-700">{projectData.description}</p>
                    </div>
                )}

                <div className="border-t pt-4">
                    <h4 className="font-bold text-sm mb-3">Scope of Supply ({selectedProducts.length} products)</h4>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-gray-400 border-b">
                                    <th className="pb-2 font-medium">Product</th>
                                    <th className="pb-2 font-medium text-right">Qty</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedProducts.map((item, i) => (
                                    <tr key={i} className="border-b border-gray-100">
                                        <td className="py-2">{item.product.name}</td>
                                        <td className="py-2 text-right font-semibold">{item.plannedQuantity}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-sm text-blue-700 flex items-start gap-2">
                    <span className="text-base mt-0.5">ℹ️</span>
                    <span><b>Note:</b> Launching this project will automatically generate task lists for the Team Leader based on the standard installation steps for each product.</span>
                </div>
            </div>
        </div>
    );

    if (dataLoading) return (
        <div className="flex flex-col items-center justify-center min-h-64 gap-3 text-gray-400">
            <Loader size={28} className="animate-spin" />
            <p className="text-sm">Loading data...</p>
        </div>
    );

    return (
        <div className="max-w-3xl mx-auto py-6 px-4">

            {/* ── Header ─────────────────────────────────────────────── */}
            <div className="flex items-center gap-3 mb-8">
                <button
                    onClick={() => navigate('/projects')}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition text-sm font-medium shadow-sm"
                >
                    <ArrowLeft size={16} />
                    <span className="hidden sm:inline">Back</span>
                </button>
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Create Project</h1>
                    <p className="text-xs text-gray-400">Set up a new project site from scratch</p>
                </div>
            </div>

            {/* ── Step Progress ───────────────────────────────────────── */}
            <div className="flex items-center mb-8">
                {[
                    { num: 1, label: 'Site Details' },
                    { num: 2, label: 'Products' },
                    { num: 3, label: 'Review' }
                ].map((s, i, arr) => (
                    <div key={s.num} className={`flex items-center ${i < arr.length - 1 ? 'flex-1' : ''}`}>
                        <button
                            onClick={() => step > s.num && setStep(s.num)}
                            className={`flex items-center gap-2 ${step > s.num ? 'cursor-pointer' : 'cursor-default'}`}
                        >
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all
                                ${step > s.num
                                    ? 'bg-green-500 border-green-500 text-white'
                                    : step === s.num
                                        ? 'bg-primary border-primary text-white'
                                        : 'bg-white border-gray-300 text-gray-400'}`}
                            >
                                {step > s.num ? <CheckCircle size={16} /> : s.num}
                            </div>
                            <span className={`text-xs font-medium hidden sm:inline transition-colors
                                ${step === s.num ? 'text-primary' : step > s.num ? 'text-green-600' : 'text-gray-400'}`}
                            >
                                {s.label}
                            </span>
                        </button>
                        {i < arr.length - 1 && (
                            <div className={`h-0.5 flex-1 mx-3 rounded transition-all ${step > s.num ? 'bg-green-400' : 'bg-gray-200'}`} />
                        )}
                    </div>
                ))}
            </div>

            {/* ── Step Content ─────────────────────────────────────────── */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 min-h-[380px]">
                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}
                {step === 3 && renderStep3()}
            </div>

            {/* ── Navigation Footer ────────────────────────────────────── */}
            <div className="flex justify-between mt-6">
                <button
                    onClick={() => step === 1 ? navigate('/projects') : setStep(step - 1)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition text-sm font-medium"
                >
                    <ChevronLeft size={18} />
                    {step === 1 ? 'Cancel' : 'Previous'}
                </button>

                {step < 3 ? (
                    <button
                        onClick={() => {
                            if (step === 1 && projectData.startDate && projectData.deadline) {
                                if (new Date(projectData.deadline) < new Date(projectData.startDate)) {
                                    alert('End Date cannot be before Start Date.');
                                    return;
                                }
                            }
                            setStep(step + 1);
                        }}
                        disabled={step === 1 && (!projectData.name.trim() || !projectData.assignedLeader)}
                        className="flex items-center gap-2 px-7 py-2.5 rounded-lg bg-primary text-white font-semibold text-sm hover:bg-opacity-90 transition disabled:opacity-50 shadow"
                    >
                        Next <ChevronRight size={18} />
                    </button>
                ) : (
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex items-center gap-2 px-7 py-2.5 rounded-lg bg-green-600 text-white font-bold text-sm hover:bg-green-700 transition disabled:opacity-60 shadow"
                    >
                        {loading ? (
                            <><Loader size={16} className="animate-spin" /> Creating...</>
                        ) : (
                            <>🚀 Launch Project</>
                        )}
                    </button>
                )}
            </div>
        </div>
    );
};

export default ProjectWizard;
