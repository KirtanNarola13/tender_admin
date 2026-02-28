import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { ChevronRight, ChevronLeft, Trash2, Plus, Box } from 'lucide-react';

const ProjectWizard = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Data States
    const [projectData, setProjectData] = useState({
        name: '',
        client: '', // changed from clientName to match schema
        category: 'Primary', // Default to Primary
        location: '',
        startDate: '',
        deadline: '',
        description: '',
        assignedLeader: ''
    });

    const [availableProducts, setAvailableProducts] = useState([]);
    const [teamLeaders, setTeamLeaders] = useState([]);

    // Selected Products: [{ product: {_id, name...}, plannedQuantity: 10 }]
    const [selectedProducts, setSelectedProducts] = useState([]);

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
            console.error("Failed to load wizard data", e);
        }
    };

    // --- STEP 1: PROJECT / SITE DETAILS ---
    const renderStep1 = () => (
        <div className="space-y-4">
            <h2 className="text-xl font-bold">Step 1: Site Details</h2>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-bold mb-1">Site Name</label>
                    <input className="w-full border p-2 rounded" placeholder="Enter Site Name" value={projectData.name} onChange={e => setProjectData({ ...projectData, name: e.target.value })} />
                </div>
                <div>
                    <label className="block text-sm font-bold mb-1">Client Name</label>
                    <input className="w-full border p-2 rounded" placeholder="Enter Client Name" value={projectData.client} onChange={e => setProjectData({ ...projectData, client: e.target.value })} />
                </div>
                <div>
                    <label className="block text-sm font-bold mb-1">Category / School Type</label>
                    <select
                        className="w-full border p-2 rounded"
                        value={projectData.category}
                        onChange={e => setProjectData({ ...projectData, category: e.target.value })}
                    >
                        {['Primary', 'Upper Primary', 'Secondary', 'Higher Secondary', 'Residential'].map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-bold mb-1">Location/City</label>
                    <input className="w-full border p-2 rounded" placeholder="Enter Location" value={projectData.location} onChange={e => setProjectData({ ...projectData, location: e.target.value })} />
                </div>

                <div>
                    <label className="block text-sm font-bold mb-1">Team Leader</label>
                    <select
                        className="w-full border p-2 rounded"
                        value={projectData.assignedLeader}
                        onChange={e => setProjectData({ ...projectData, assignedLeader: e.target.value })}
                    >
                        <option value="">Select Team Leader</option>
                        {teamLeaders.map(u => (
                            <option key={u._id} value={u._id}>{u.name}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-bold mb-1">Start Date</label>
                    <input type="date" className="w-full border p-2 rounded" value={projectData.startDate} onChange={e => setProjectData({ ...projectData, startDate: e.target.value })} />
                </div>
                <div>
                    <label className="block text-sm font-bold mb-1">Deadline / End Date</label>
                    <input type="date" className="w-full border p-2 rounded" value={projectData.deadline} onChange={e => setProjectData({ ...projectData, deadline: e.target.value })} />
                </div>
            </div>
            <div>
                <label className="block text-sm font-bold mb-1">Description / Scope of Work</label>
                <textarea className="w-full border p-2 rounded" placeholder="Enter details..." rows="3" value={projectData.description} onChange={e => setProjectData({ ...projectData, description: e.target.value })} />
            </div>
        </div>
    );

    // --- STEP 2: SELECT PRODUCTS ---
    const addProduct = (productId) => {
        const product = availableProducts.find(p => p._id === productId);
        if (!product) return;
        if (selectedProducts.find(p => p.product._id === productId)) return; // Already added

        setSelectedProducts([...selectedProducts, { product, plannedQuantity: 1 }]);
    };

    const updateQuantity = (index, qty) => {
        const updated = [...selectedProducts];
        const val = Number(qty);
        // Simple client-side validation check (optional, but good for UI)
        if (updated[index].product.totalStock < val) {
            // Warning? For now just let them type, but maybe show red border?
        }
        updated[index].plannedQuantity = val;
        setSelectedProducts(updated);
    };

    const removeProduct = (index) => {
        setSelectedProducts(selectedProducts.filter((_, i) => i !== index));
    };

    const renderStep2 = () => (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Step 2: Add Products</h2>
                <select
                    className="border p-2 rounded w-64"
                    onChange={(e) => {
                        addProduct(e.target.value);
                        e.target.value = '';
                    }}
                >
                    <option value="">+ Add Product</option>
                    {availableProducts.map(p => (
                        <option key={p._id} value={p._id} disabled={p.totalStock <= 0}>
                            {p.name} (Stock: {p.totalStock || 0})
                        </option>
                    ))}
                </select>
            </div>

            {selectedProducts.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 border border-dashed rounded text-gray-400">
                    No products added yet. Select products above to add to this site.
                </div>
            ) : (
                <div className="space-y-3">
                    {selectedProducts.map((item, idx) => {
                        const isStockLow = item.plannedQuantity > (item.product.totalStock || 0);
                        return (
                            <div key={item.product._id} className={`flex items-center justify-between border p-4 rounded bg-white shadow-sm ${isStockLow ? 'border-red-300 bg-red-50' : ''}`}>
                                <div className="flex items-center gap-4">
                                    <div className="bg-blue-100 p-2 rounded text-primary">
                                        <Box size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold">{item.product.name}</h4>
                                        <p className="text-xs text-gray-500">
                                            {item.product.category} | <span className="font-bold text-gray-700">Available: {item.product.totalStock || 0}</span>
                                        </p>
                                        {isStockLow && <span className="text-xs text-red-600 font-bold">Exceeds Stock!</span>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center border rounded bg-white">
                                        <span className="px-3 bg-gray-100 text-sm border-r">Qty</span>
                                        <input
                                            type="number"
                                            min="1"
                                            className="w-20 p-2 text-center outline-none"
                                            value={item.plannedQuantity}
                                            onChange={e => updateQuantity(idx, e.target.value)}
                                        />
                                    </div>
                                    <button onClick={() => removeProduct(idx)} className="text-red-500 hover:bg-red-50 p-2 rounded">
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );

    // --- STEP 3: REVIEW ---
    const renderStep3 = () => (
        <div className="space-y-4">
            <h2 className="text-xl font-bold">Step 3: Review & Launch</h2>

            <div className="bg-gray-50 p-6 rounded-lg border space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <span className="text-gray-500 block">Project Name</span>
                        <span className="font-semibold">{projectData.name}</span>
                    </div>
                    <div>
                        <span className="text-gray-500 block">Client</span>
                        <span className="font-semibold">{projectData.client}</span>
                    </div>
                    <div>
                        <span className="text-gray-500 block">Location</span>
                        <span className="font-semibold">{projectData.location}</span>
                    </div>
                    <div>
                        <span className="text-gray-500 block">Category</span>
                        <span className="font-semibold">{projectData.category}</span>
                    </div>
                    <div>
                        <span className="text-gray-500 block">Team Leader</span>
                        <span className="font-semibold text-primary">
                            {teamLeaders.find(u => u._id === projectData.assignedLeader)?.name || 'Unassigned'}
                        </span>
                    </div>
                </div>

                <div className="border-t pt-4">
                    <h4 className="font-bold mb-2">Scope of Supply</h4>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-gray-500">
                                    <th className="pb-2">Product</th>
                                    <th className="pb-2 text-right">Quantity</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedProducts.map((item, i) => (
                                    <tr key={i} className="border-t border-gray-200">
                                        <td className="py-2">{item.product.name}</td>
                                        <td className="py-2 text-right font-medium">{item.plannedQuantity}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-blue-50 p-3 rounded text-sm text-blue-700">
                    ℹ️ <b>Note:</b> Launching this project will automatically generate task lists for the Team Leader based on the standard installation steps for each product.
                </div>
            </div>
        </div>
    );

    const handleSubmit = async () => {
        if (!projectData.name || !projectData.assignedLeader || selectedProducts.length === 0) {
            alert('Please fill in Name, Assign Leader, and add at least one Product.');
            return;
        }

        setLoading(true);
        try {
            // Prepare payload
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

    return (
        <div className="max-w-4xl mx-auto py-8">
            {/* Progress Bar */}
            <div className="flex justify-between mb-8 items-center">
                {[1, 2, 3].map(i => (
                    <div key={i} className={`flex items-center ${i < 3 ? 'flex-1' : ''}`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 ${step >= i ? 'bg-primary border-primary text-white' : 'bg-white border-gray-300 text-gray-400'}`}>
                            {i}
                        </div>
                        {i < 3 && <div className={`h-1 flex-1 mx-4 ${step > i ? 'bg-primary' : 'bg-gray-200'}`} />}
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-lg shadow-lg p-8 min-h-[400px]">
                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}
                {step === 3 && renderStep3()}
            </div>

            <div className="flex justify-between mt-8">
                <button
                    onClick={() => setStep(step - 1)}
                    disabled={step === 1}
                    className="flex items-center px-6 py-2 rounded border text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                >
                    <ChevronLeft size={20} /> Previous
                </button>

                {step < 3 ? (
                    <button
                        onClick={() => setStep(step + 1)}
                        className="flex items-center px-8 py-2 rounded bg-primary text-white font-medium hover:bg-opacity-90"
                    >
                        Next <ChevronRight size={20} />
                    </button>
                ) : (
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex items-center px-8 py-2 rounded bg-green-600 text-white font-bold hover:bg-green-700 disabled:opacity-70"
                    >
                        {loading ? 'Creating...' : 'Launch Project 🚀'}
                    </button>
                )}
            </div>
        </div>
    );
};

export default ProjectWizard;
