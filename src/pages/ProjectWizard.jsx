import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useBranch } from '../context/BranchContext';
import { ChevronRight, ChevronLeft, Trash2, Box, ArrowLeft, CheckCircle, Loader, Calendar, MapPin, User, Tag, Plus } from 'lucide-react';
import FormSelect from '../components/FormSelect';
import FormDatePicker from '../components/FormDatePicker';

const CATEGORIES = ['Primary', 'Upper Primary', 'Secondary', 'Higher Secondary', 'Residential'];

const today = new Date().toISOString().split('T')[0];

const ProjectWizard = () => {
    const { user: currentUser } = useAuth();
    const navigate = useNavigate();
    const { activeBranch, branches: globalBranches } = useBranch();
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
        assignedLeader: '',
        branch: activeBranch !== 'all' ? activeBranch : '',
        workOrder: '',
        workOrderCategory: ''
    });
    const [availableProducts, setAvailableProducts] = useState([]);
    const [teamLeaders, setTeamLeaders] = useState([]);
    const [workOrders, setWorkOrders] = useState([]);
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [newWON, setNewWON] = useState('');
    const [newWONCategory, setNewWONCategory] = useState('');
    const [isCreatingWON, setIsCreatingWON] = useState(false);
    const [isCreatingCat, setIsCreatingCat] = useState(false);
    const [branches, setBranches] = useState([]);
    const [dataLoading, setDataLoading] = useState(true);

    const handleCreateWON = async () => {
        if (!newWON.trim()) return;
        setIsCreatingWON(true);
        try {
            const res = await api.post('/workorders', {
                workOrderNumber: newWON,
                categories: [{ name: 'Primary' }] // Default category for new WON
            });
            setWorkOrders([...workOrders, res.data]);
            setProjectData({ 
                ...projectData, 
                workOrder: res.data._id, 
                workOrderCategory: 'Primary' 
            });
            setNewWON('');
        } catch (e) {
            alert('Failed to create Work Order');
        } finally {
            setIsCreatingWON(false);
        }
    };

    const handleCreateWONCategory = async () => {
        if (!newWONCategory.trim() || !projectData.workOrder) return;
        setIsCreatingCat(true);
        try {
            const selectedWO = workOrders.find(wo => wo._id === projectData.workOrder);
            if (!selectedWO) return;

            const updatedCategories = [...selectedWO.categories, { name: newWONCategory, projects: [] }];
            
            const res = await api.put(`/workorders/${projectData.workOrder}`, {
                categories: updatedCategories
            });

            // Update local state
            setWorkOrders(workOrders.map(wo => wo._id === res.data._id ? res.data : wo));
            setProjectData({ 
                ...projectData, 
                workOrderCategory: newWONCategory 
            });
            setNewWONCategory('');
        } catch (e) {
            alert('Failed to add Category');
        } finally {
            setIsCreatingCat(false);
        }
    };
    
    // Filtered team leaders based on selected branch
    const filteredLeaders = teamLeaders.filter(tl => 
        !projectData.branch || (tl.branches && tl.branches.includes(projectData.branch))
    );

    // Sync assigned leader when branch changes
    useEffect(() => {
        if (projectData.branch && projectData.assignedLeader) {
            const isAuthorized = filteredLeaders.some(tl => tl._id === projectData.assignedLeader);
            if (!isAuthorized) {
                setProjectData(prev => ({ ...prev, assignedLeader: '' }));
            }
        }
    }, [projectData.branch, filteredLeaders]);

    useEffect(() => {
        if (currentUser?.role === 'admin_viewer') {
            navigate('/projects');
            return;
        }
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const [prodRes, usersRes, projectsRes, woRes] = await Promise.all([
                api.get('/inventory/products'),
                api.get('/users?role=team_leader'),
                api.get('/projects'),
                api.get('/workorders')
            ]);
            setAvailableProducts(prodRes.data);
            setTeamLeaders(usersRes.data.filter(u => u.role === 'team_leader'));
            setWorkOrders(woRes.data);
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide ml-1">Site Name *</label>
                    <input
                        className="w-full border border-gray-200 p-3 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
                        placeholder="Enter Site Name"
                        value={projectData.name}
                        onChange={e => setProjectData({ ...projectData, name: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide ml-1">Client Name</label>
                    <input
                        className="w-full border border-gray-200 p-3 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
                        placeholder="Enter Client Name"
                        value={projectData.client}
                        onChange={e => setProjectData({ ...projectData, client: e.target.value })}
                    />
                </div>
                
                <FormSelect
                    label="Work Order Number *"
                    value={projectData.workOrder}
                    onChange={val => {
                        const wo = workOrders.find(w => w._id === val);
                        setProjectData({ ...projectData, workOrder: val, workOrderCategory: wo?.categories?.[0]?.name || '' });
                    }}
                    options={workOrders.map(wo => ({ label: wo.workOrderNumber, value: wo._id }))}
                    placeholder="— Select WON —"
                    icon={Tag}
                    searchable
                    footer={
                        <div className="flex gap-2 p-1" onClick={e => e.stopPropagation()}>
                            <input
                                className="flex-1 border border-gray-200 rounded-lg p-1.5 text-xs outline-none focus:border-primary"
                                placeholder="New WON (eg: WON-001)"
                                value={newWON}
                                onChange={e => setNewWON(e.target.value)}
                            />
                            <button
                                onClick={handleCreateWON}
                                disabled={!newWON || isCreatingWON}
                                className="bg-primary text-white p-1.5 rounded-lg hover:bg-opacity-90 disabled:opacity-50 transition-all shrink-0"
                                title="Add New WON"
                            >
                                <Plus size={14} />
                            </button>
                        </div>
                    }
                />

                <FormSelect
                    label="Category *"
                    value={projectData.workOrderCategory}
                    onChange={val => setProjectData({ ...projectData, workOrderCategory: val, category: val })}
                    options={
                        (workOrders.find(w => w._id === projectData.workOrder)?.categories || []).map(c => ({ label: c.name, value: c.name }))
                    }
                    placeholder={projectData.workOrder ? "— Select Category —" : "Select WON First"}
                    icon={Tag}
                    disabled={!projectData.workOrder}
                    searchable
                    footer={
                        <div className="flex gap-2 p-1" onClick={e => e.stopPropagation()}>
                            <input
                                className="flex-1 border border-gray-200 rounded-lg p-1.5 text-xs outline-none focus:border-primary disabled:bg-gray-100"
                                placeholder="New Category (e.g. Civil)"
                                value={newWONCategory}
                                onChange={e => setNewWONCategory(e.target.value)}
                                disabled={!projectData.workOrder}
                            />
                            <button
                                onClick={handleCreateWONCategory}
                                disabled={!newWONCategory || isCreatingCat || !projectData.workOrder}
                                className="bg-primary text-white p-1.5 rounded-lg hover:bg-opacity-90 disabled:opacity-50 transition-all shrink-0"
                                title="Add New Category"
                            >
                                <Plus size={14} />
                            </button>
                        </div>
                    }
                />
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide ml-1">Location / City</label>
                    <input
                        className="w-full border border-gray-200 p-3 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
                        placeholder="Enter Location"
                        value={projectData.location}
                        onChange={e => setProjectData({ ...projectData, location: e.target.value })}
                    />
                </div>

                <FormSelect
                    label="Branch / Region *"
                    value={projectData.branch}
                    onChange={val => setProjectData({ ...projectData, branch: val })}
                    options={globalBranches.map(b => ({ label: b, value: b }))}
                    placeholder="— Select Branch —"
                    icon={MapPin}
                />

                <FormSelect
                    label="Team Leader *"
                    value={projectData.assignedLeader}
                    onChange={val => setProjectData({ ...projectData, assignedLeader: val })}
                    options={filteredLeaders.map(u => ({ 
                        label: u.name, 
                        value: u._id,
                        sublabel: u.email 
                    }))}
                    placeholder={projectData.branch ? "— Select Team Leader —" : "Select Branch First"}
                    icon={User}
                    error={projectData.branch && filteredLeaders.length === 0 ? `No team leaders assigned to ${projectData.branch}` : null}
                />

                <FormDatePicker
                    label="Start Date"
                    value={projectData.startDate}
                    min={today}
                    onChange={val => {
                        const updates = { startDate: val };
                        if (val && projectData.deadline && new Date(projectData.deadline) < new Date(val)) {
                            updates.deadline = '';
                        }
                        setProjectData({ ...projectData, ...updates });
                    }}
                />

                <FormDatePicker
                    label="Deadline / End Date"
                    value={projectData.deadline}
                    min={projectData.startDate || today}
                    onChange={val => setProjectData({ ...projectData, deadline: val })}
                />
            </div>

            <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide ml-1">Description / Scope of Work</label>
                <textarea
                    className="w-full border border-gray-200 p-4 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white resize-none"
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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Step 2: Products</h2>
                    <p className="text-sm text-gray-400 mt-0.5">Add products to this project's scope of supply</p>
                </div>
                <div className="w-full sm:w-72">
                    <FormSelect
                        placeholder="+ Add Product"
                        value=""
                        onChange={(productId) => addProduct(productId)}
                        options={availableProducts
                            .filter(p => !selectedProducts.find(sp => sp.product._id === p._id))
                            .map(p => ({
                                label: p.name,
                                value: p._id,
                                sublabel: `Stock: ${p.totalStock || 0} | ${p.category}`,
                                disabled: (p.totalStock || 0) <= 0
                            }))
                        }
                        icon={Box}
                    />
                </div>
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
                                    <div className="bg-primary/10 p-2 rounded-lg text-primary flex-shrink-0">
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
                        { label: 'Branch', value: projectData.branch },
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

                <div className="bg-primary/10 border border-primary/20 p-3 rounded-lg text-sm text-primary flex items-start gap-2">
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
                        disabled={step === 1 && (!projectData.name.trim() || !projectData.assignedLeader || !projectData.workOrder || !projectData.workOrderCategory)}
                        className="flex items-center gap-2 px-7 py-2.5 rounded-lg bg-primary text-white font-semibold text-sm hover:bg-opacity-90 transition disabled:opacity-50 shadow"
                    >
                        Next <ChevronRight size={18} />
                    </button>
                ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="flex items-center gap-2 px-7 py-2.5 rounded-lg bg-primary text-white font-bold text-sm hover:bg-opacity-90 transition disabled:opacity-60 shadow-lg shadow-primary/20"
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
