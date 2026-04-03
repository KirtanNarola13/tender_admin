import { useState, useEffect } from 'react';
import api from '../services/api';
import { X, Plus, Trash2, Loader2, Save, ShoppingCart, User, Home, Receipt } from 'lucide-react';
import clsx from 'clsx';

const CreatePOModal = ({ isOpen, onClose, onSuccess, editData }) => {
    const [warehouses, setWarehouses] = useState([]);
    const [products, setProducts] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    const [formData, setFormData] = useState({
        poNumber: '',
        party: { name: '', phone: '', address: '', email: '' },
        warehouse: '',
        project: '',
        items: [{ product: '', quantity: '', unitPrice: '' }],
        date: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        if (isOpen) {
            setErrors({});
            fetchInitialData();
            
            if (editData) {
                setFormData({
                    party: { 
                        name: editData.party?.name || '', 
                        phone: editData.party?.phone || '', 
                        address: editData.party?.address || '', 
                        email: editData.party?.email || '' 
                    },
                    warehouse: editData.warehouse?._id || editData.warehouse || '',
                    items: editData.items?.map(i => ({
                        product: i.product?._id || i.product || '',
                        quantity: i.quantity,
                        unitPrice: i.unitPrice
                    })) || [{ product: '', quantity: '', unitPrice: '' }],
                    date: new Date(editData.date).toISOString().split('T')[0]
                });
            } else {
                setFormData({
                    party: { name: '', phone: '', address: '', email: '' },
                    warehouse: '',
                    items: [{ product: '', quantity: '', unitPrice: '' }],
                    date: new Date().toISOString().split('T')[0]
                });
            }
        }
    }, [isOpen, editData]);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [wareRes, prodRes, projRes] = await Promise.all([
                api.get('/inventory/warehouses'),
                api.get('/inventory/products'),
                api.get('/projects')
            ]);
            setWarehouses(wareRes.data);
            setProducts(prodRes.data);
            setProjects(projRes.data);
        } catch (error) {
            console.error('Failed to fetch modal data', error);
        } finally {
            setLoading(false);
        }
    };

    const addItem = () => {
        setFormData({
            ...formData,
            items: [...formData.items, { product: '', quantity: '', unitPrice: '' }]
        });
    };

    const removeItem = (index) => {
        if (formData.items.length === 1) return;
        const newItems = formData.items.filter((_, i) => i !== index);
        setFormData({ ...formData, items: newItems });
    };

    const updateItem = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index][field] = value;
        setFormData({ ...formData, items: newItems });
    };

    const validate = () => {
        const newErrors = {};
        const { phone, email } = formData.party;

        // Phone: Optional, but if provided must be exactly 10 digits
        if (phone && !/^\d{10}$/.test(phone)) {
            newErrors.phone = 'Enter a valid 10-digit phone number';
        }

        // Email: Optional, but if provided must be valid format
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            newErrors.email = 'Enter a valid email address';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        
        setSubmitting(true);
        try {
            // Map items for backend
            const payload = {
                ...formData,
                items: formData.items.map(item => {
                    const productObj = products.find(p => p._id === item.product);
                    return {
                        ...item,
                        productName: productObj?.name || 'Unknown Product' // Snapshot name
                    };
                })
            };

            if (editData) {
                await api.put(`/purchase-orders/${editData._id}`, payload);
            } else {
                await api.post('/purchase-orders', payload);
            }
            onSuccess();
            onClose();
        } catch (error) {
            alert(error.response?.data?.message || 'Error processing PO');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-8 overflow-hidden transform transition-all animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="bg-primary p-6 text-white flex justify-between items-center bg-gradient-to-r from-primary to-primary/90">
                    <div className="flex items-center gap-3">
                        <ShoppingCart size={24} />
                        <div>
                            <h3 className="text-xl font-bold">{editData ? 'Update Purchase Order' : 'New Purchase Order'}</h3>
                            <p className="text-primary-light/80 text-xs mt-0.5">{editData ? 'Modify the details of your existing PO.' : 'Fill in the details to create a new PO and track stock.'}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[80vh] custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Left Column: Party & Basic Info */}
                        <div className="space-y-6">
                            <section>
                                <h4 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-gray-400 mb-4">
                                    <User size={16} /> Party Details (Supplier)
                                </h4>
                                <div className="space-y-3">
                                    <input 
                                        required
                                        className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm" 
                                        placeholder="Party/Client Name" 
                                        value={formData.party.name}
                                        onChange={e => setFormData({ ...formData, party: { ...formData.party, name: e.target.value } })}
                                    />
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <input 
                                                className={clsx(
                                                    "w-full border p-3 rounded-xl focus:ring-2 focus:border-primary outline-none transition-all text-sm",
                                                    errors.phone ? "border-red-500 focus:ring-red-200" : "border-gray-200 focus:ring-primary/20"
                                                )}
                                                placeholder="Phone Number" 
                                                maxLength={10}
                                                value={formData.party.phone}
                                                onChange={e => setFormData({ ...formData, party: { ...formData.party, phone: e.target.value.replace(/\D/g, '') } })}
                                            />
                                            {errors.phone && <p className="text-[9px] text-red-500 font-bold ml-2 mt-1">{errors.phone}</p>}
                                        </div>
                                        <div>
                                            <input 
                                                className={clsx(
                                                    "w-full border p-3 rounded-xl focus:ring-2 focus:border-primary outline-none transition-all text-sm",
                                                    errors.email ? "border-red-500 focus:ring-red-200" : "border-gray-200 focus:ring-primary/20"
                                                )}
                                                placeholder="Email Address" 
                                                value={formData.party.email}
                                                onChange={e => setFormData({ ...formData, party: { ...formData.party, email: e.target.value } })}
                                            />
                                            {errors.email && <p className="text-[9px] text-red-500 font-bold ml-2 mt-1">{errors.email}</p>}
                                        </div>
                                    </div>
                                    <textarea 
                                        className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm" 
                                        placeholder="Full Billing Address" 
                                        rows="2"
                                        value={formData.party.address}
                                        onChange={e => setFormData({ ...formData, party: { ...formData.party, address: e.target.value } })}
                                    />
                                </div>
                            </section>

                            <section>
                                <h4 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-gray-400 mb-4">
                                    <Home size={16} /> Logistic Details
                                </h4>
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-gray-400 mb-1 block ml-1">Site / Project (Optional)</label>
                                        <select 
                                            className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm bg-white"
                                            value={formData.project}
                                            onChange={e => {
                                                const projId = e.target.value;
                                                const proj = projects.find(p => p._id === projId);
                                                setFormData({ 
                                                    ...formData, 
                                                    project: projId,
                                                    // Auto-fill PO Number if it's currently empty or previously auto-filled
                                                    poNumber: (proj?.workOrder?.workOrderNumber || proj?.name || formData.poNumber) 
                                                });
                                            }}
                                        >
                                            <option value="">Select Project...</option>
                                            {projects.map(p => <option key={p._id} value={p._id}>{p.name} ({p.workOrder?.workOrderNumber || 'No WON'})</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-gray-400 mb-1 block ml-1">PO Number (Auto-gen if empty)</label>
                                        <input 
                                            className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm" 
                                            placeholder="e.g. WON-2024-001" 
                                            value={formData.poNumber}
                                            onChange={e => setFormData({ ...formData, poNumber: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-[10px] font-black uppercase text-gray-400 mb-1 block ml-1">PO Date</label>
                                            <input 
                                                type="date"
                                                className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm" 
                                                value={formData.date}
                                                onChange={e => setFormData({ ...formData, date: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase text-gray-400 mb-1 block ml-1">Warehouse</label>
                                            <select 
                                                required
                                                className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm bg-white"
                                                value={formData.warehouse}
                                                onChange={e => setFormData({ ...formData, warehouse: e.target.value })}
                                            >
                                                <option value="">Select Target...</option>
                                                {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>

                        {/* Right Column: Items */}
                        <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 flex flex-col h-full">
                            <h4 className="flex items-center justify-between text-sm font-black uppercase tracking-wider text-gray-400 mb-4">
                                <span className="flex items-center gap-2"><Receipt size={16} /> Order Items</span>
                                <button 
                                    type="button" 
                                    onClick={addItem}
                                    className="text-primary hover:text-primary-dark font-black text-[10px] py-1 px-3 bg-primary/10 rounded-full border border-primary/20 transition-all hover:bg-primary/20"
                                >
                                    + ADD ITEM
                                </button>
                            </h4>

                            <div className="space-y-4 flex-1 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                                {formData.items.map((item, idx) => (
                                    <div key={idx} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-3 relative group">
                                        <button 
                                            type="button" 
                                            onClick={() => removeItem(idx)}
                                            className={clsx(
                                                "absolute -top-2 -right-2 p-1.5 bg-red-50 text-red-500 rounded-full border border-red-100 shadow-sm hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100",
                                                formData.items.length === 1 && "hidden"
                                            )}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                        
                                        <select 
                                            required
                                            className="w-full border border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none text-sm bg-white"
                                            value={item.product}
                                            onChange={e => updateItem(idx, 'product', e.target.value)}
                                        >
                                            <option value="">Select Product...</option>
                                            {products.map(p => {
                                                // Find stock in selected warehouse
                                                const whStock = p.stock?.find(s => (s.warehouse?._id || s.warehouse) === formData.warehouse)?.quantity || 0;
                                                return (
                                                    <option key={p._id} value={p._id}>
                                                        {p.name} (Wh Stock: {whStock})
                                                    </option>
                                                );
                                            })}
                                        </select>

                                        {item.product && formData.warehouse && (() => {
                                            const pObj = products.find(p => p._id === item.product);
                                            const whName = warehouses.find(w => w._id === formData.warehouse)?.name;
                                            const whStock = pObj?.stock?.find(s => (s.warehouse?._id || s.warehouse) === formData.warehouse)?.quantity || 0;
                                            return (
                                                <div className="flex items-center justify-between px-2 py-1.5 bg-gray-50 rounded-lg border border-gray-100">
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Current in {whName || 'Warehouse'}</span>
                                                    <span className={clsx(
                                                        "text-xs font-black",
                                                        whStock === 0 ? "text-amber-500" : "text-primary"
                                                    )}>
                                                        {whStock} PCS
                                                    </span>
                                                </div>
                                            );
                                        })()}

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="relative">
                                                <input 
                                                    required
                                                    type="number"
                                                    className="w-full border border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none text-sm pr-12" 
                                                    placeholder="Qty" 
                                                    value={item.quantity}
                                                    onChange={e => updateItem(idx, 'quantity', e.target.value)}
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-300">PCS</span>
                                            </div>
                                            <div className="relative">
                                                <input 
                                                    type="number"
                                                    className="w-full border border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none text-sm pr-12" 
                                                    placeholder="Rate (Opt)" 
                                                    value={item.unitPrice}
                                                    onChange={e => updateItem(idx, 'unitPrice', e.target.value)}
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-300">INR</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-4 mt-auto border-t border-gray-200 flex items-center justify-between">
                                <div className="text-xs text-gray-400 font-bold">
                                    Items: <span className="text-gray-900">{formData.items.length}</span>
                                </div>
                                <div className="text-right">
                                    {formData.items.reduce((acc, curr) => acc + (Number(curr.quantity) * Number(curr.unitPrice) || 0), 0) > 0 ? (
                                        <>
                                            <p className="text-[10px] text-gray-400 font-black uppercase">Estimation</p>
                                            <p className="text-lg font-black text-primary">
                                                INR {formData.items.reduce((acc, curr) => acc + (Number(curr.quantity) * Number(curr.unitPrice) || 0), 0).toLocaleString()}
                                            </p>
                                        </>
                                    ) : (
                                        <p className="text-[10px] text-gray-400 font-black uppercase italic">Price not specified (Optional)</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="mt-8 pt-6 border-t flex flex-col sm:flex-row gap-3 justify-end">
                        <button 
                            type="button" 
                            onClick={onClose}
                            className="px-6 py-3 rounded-xl border border-gray-200 text-gray-500 font-bold hover:bg-gray-50 transition-all text-sm mb-2 sm:mb-0 order-2 sm:order-none"
                        >
                            Discard
                        </button>
                        <button 
                            type="submit" 
                            disabled={submitting}
                            className="px-10 py-3 rounded-xl bg-primary text-white font-black shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 text-sm order-1 sm:order-none"
                        >
                            {submitting ? <><Loader2 size={18} className="animate-spin" /> {editData ? 'Updating...' : 'Processing...'}</> : <><Save size={18} /> {editData ? 'Update PO' : 'Create PO'}</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreatePOModal;
