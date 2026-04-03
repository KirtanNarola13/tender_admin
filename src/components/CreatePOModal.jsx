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
                    poNumber: editData.poNumber || '',
                    warehouse: editData.warehouse?._id || editData.warehouse || '',
                    project: editData.project?._id || editData.project || '',
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

    const [showPartyDetails, setShowPartyDetails] = useState(false);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl my-8 overflow-hidden transform transition-all animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="bg-primary p-5 text-white flex justify-between items-center bg-gradient-to-r from-primary to-primary-dark">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-xl">
                            <ShoppingCart size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-black">{editData ? 'Edit Purchase Order' : 'New Purchase Order'}</h3>
                            <p className="text-primary-light/70 text-[10px] font-bold uppercase tracking-widest">{editData ? 'Update existing details' : 'Stock replenishment order'}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[85vh] custom-scrollbar">
                    <div className="space-y-8">
                        {/* 1. Basic Party & Logistic Info */}
                        <section className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Order Information</h4>
                                <button 
                                    type="button"
                                    onClick={() => setShowPartyDetails(!showPartyDetails)}
                                    className="text-[10px] font-black uppercase text-primary hover:text-primary-dark transition-colors"
                                >
                                    {showPartyDetails ? '- Hide Contact' : '+ Add Party Contact'}
                                </button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="text-[9px] font-black uppercase text-gray-400 mb-1 ml-1 block">Party / Supplier Name</label>
                                    <input 
                                        required
                                        className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-semibold" 
                                        placeholder="Who are you ordering from?" 
                                        value={formData.party.name}
                                        onChange={e => setFormData({ ...formData, party: { ...formData.party, name: e.target.value } })}
                                    />
                                </div>

                                {showPartyDetails && (
                                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100 animate-in slide-in-from-top-2 duration-300">
                                        <div>
                                            <input 
                                                className={clsx(
                                                    "w-full border p-2.5 rounded-xl focus:ring-2 focus:border-primary outline-none transition-all text-sm",
                                                    errors.phone ? "border-red-500" : "border-gray-200"
                                                )}
                                                placeholder="Phone (10 digits)" 
                                                maxLength={10}
                                                value={formData.party.phone}
                                                onChange={e => setFormData({ ...formData, party: { ...formData.party, phone: e.target.value.replace(/\D/g, '') } })}
                                            />
                                        </div>
                                        <div>
                                            <input 
                                                className={clsx(
                                                    "w-full border p-2.5 rounded-xl focus:ring-2 focus:border-primary outline-none transition-all text-sm",
                                                    errors.email ? "border-red-500" : "border-gray-200"
                                                )}
                                                placeholder="Email Address" 
                                                value={formData.party.email}
                                                onChange={e => setFormData({ ...formData, party: { ...formData.party, email: e.target.value } })}
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <textarea 
                                                className="w-full border border-gray-200 p-2.5 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm" 
                                                placeholder="Full Billing Address" 
                                                rows="2"
                                                value={formData.party.address}
                                                onChange={e => setFormData({ ...formData, party: { ...formData.party, address: e.target.value } })}
                                            />
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="text-[9px] font-black uppercase text-gray-400 mb-1 ml-1 block">PO Date</label>
                                    <input 
                                        type="date"
                                        className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-semibold" 
                                        value={formData.date}
                                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="text-[9px] font-black uppercase text-gray-400 mb-1 ml-1 block">Target Warehouse</label>
                                    <select 
                                        required
                                        className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-semibold bg-white"
                                        value={formData.warehouse}
                                        onChange={e => setFormData({ ...formData, warehouse: e.target.value })}
                                    >
                                        <option value="">Select Target...</option>
                                        {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
                                    </select>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="text-[9px] font-black uppercase text-gray-400 mb-1 ml-1 block">Work Order Number (WON)</label>
                                    <select 
                                        required
                                        className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-semibold bg-white"
                                        value={formData.project}
                                        onChange={e => setFormData({ ...formData, project: e.target.value })}
                                    >
                                        <option value="">Select Work Order...</option>
                                        {(() => {
                                            const seen = new Set();
                                            return projects
                                                .filter(p => p.workOrder?.workOrderNumber)
                                                .filter(p => {
                                                    const won = p.workOrder.workOrderNumber;
                                                    if (seen.has(won)) return false;
                                                    seen.add(won);
                                                    return true;
                                                })
                                                .map(p => (
                                                    <option key={p._id} value={p._id}>
                                                        {p.workOrder.workOrderNumber}
                                                    </option>
                                                ));
                                        })()}
                                    </select>
                                </div>

                                {editData && (
                                    <div className="md:col-span-2">
                                        <label className="text-[9px] font-black uppercase text-gray-400 mb-1 ml-1 block">Purchase Order #</label>
                                        <div className="w-full bg-primary/5 border border-primary/10 p-3 rounded-xl text-sm font-black text-primary">
                                            {formData.poNumber}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* 2. Order Items Table-style */}
                        <section className="space-y-4">
                            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Order Items</h4>
                                <button 
                                    type="button" 
                                    onClick={addItem}
                                    className="flex items-center gap-1.5 text-primary hover:text-primary-dark font-black text-[10px] uppercase transition-all"
                                >
                                    <Plus size={14} /> Add Product
                                </button>
                            </div>

                            <div className="space-y-3">
                                {formData.items.map((item, idx) => (
                                    <div key={idx} className="flex flex-col md:flex-row gap-3 items-start p-4 bg-gray-50 border border-gray-100 rounded-2xl relative group">
                                        <button 
                                            type="button" 
                                            onClick={() => removeItem(idx)}
                                            className={clsx(
                                                "absolute -top-2 -right-2 p-1.5 bg-white text-red-500 rounded-full border border-gray-200 shadow-sm hover:bg-red-500 hover:text-white transition-all",
                                                formData.items.length === 1 && "hidden"
                                            )}
                                        >
                                            <Trash2 size={13} />
                                        </button>

                                        <div className="flex-1 w-full">
                                            <select 
                                                required
                                                className="w-full border border-gray-200 p-2.5 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-sm font-semibold bg-white"
                                                value={item.product}
                                                onChange={e => updateItem(idx, 'product', e.target.value)}
                                            >
                                                <option value="">Select Product...</option>
                                                {products.map(p => {
                                                    const whStock = p.stock?.find(s => (s.warehouse?._id || s.warehouse) === formData.warehouse)?.quantity || 0;
                                                    return <option key={p._id} value={p._id}>{p.name} {formData.warehouse ? `(${whStock} in stock)` : ''}</option>;
                                                })}
                                            </select>
                                        </div>

                                        <div className="flex gap-2 w-full md:w-auto">
                                            <div className="relative w-full md:w-28">
                                                <input 
                                                    required
                                                    type="number"
                                                    className="w-full border border-gray-200 p-2.5 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-sm font-black pr-10" 
                                                    placeholder="Qty" 
                                                    value={item.quantity}
                                                    onChange={e => updateItem(idx, 'quantity', e.target.value)}
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[8px] font-black text-gray-400">PCS</span>
                                            </div>
                                            <div className="relative w-full md:w-32">
                                                <input 
                                                    type="number"
                                                    className="w-full border border-gray-200 p-2.5 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-sm font-black pr-10" 
                                                    placeholder="Rate" 
                                                    value={item.unitPrice}
                                                    onChange={e => updateItem(idx, 'unitPrice', e.target.value)}
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[8px] font-black text-gray-400">INR</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* 3. Summary & Calculations */}
                        <div className="bg-primary/5 rounded-2xl p-5 border border-primary/10 flex items-center justify-between">
                            <div>
                                <p className="text-[9px] font-black text-primary/60 uppercase tracking-[0.2em] mb-1">Total Estimation</p>
                                <p className="text-2xl font-black text-primary">
                                    INR {formData.items.reduce((acc, curr) => acc + (Number(curr.quantity) * Number(curr.unitPrice) || 0), 0).toLocaleString()}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-gray-400 uppercase">{formData.items.length} Items Listed</p>
                                <p className="text-xs font-bold text-gray-500">Excl. Taxes & Freight</p>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-end items-center">
                        <button 
                            type="button" 
                            onClick={onClose}
                            className="text-gray-400 font-bold hover:text-gray-600 transition-all text-xs uppercase tracking-widest px-6 py-3"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={submitting}
                            className="w-full sm:w-auto px-12 py-4 rounded-2xl bg-primary text-white font-black shadow-xl shadow-primary/30 hover:bg-primary-dark transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 text-sm"
                        >
                            {submitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                            {submitting ? 'Processing...' : (editData ? 'Update Order' : 'Create Order')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreatePOModal;
