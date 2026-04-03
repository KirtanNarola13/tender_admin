import { useEffect, useState } from 'react';
import api from '../services/api';
import CreatePOModal from '../components/CreatePOModal';
import { generatePOPDF } from '../utils/pdfGenerator';
import {
    Plus, Download, Truck, CheckCircle, Clock, Search,
    Filter, Eye, Warehouse, Calendar, X, User, MapPin,
    Mail, Phone, Receipt, Pencil
} from 'lucide-react';
import clsx from 'clsx';
import PageLoader from '../components/PageLoader';

const RecordDeliveryModal = ({ order, onClose, onSuccess }) => {
    const [deliveryQuantities, setDeliveryQuantities] = useState({});
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (order) {
            const initialQty = {};
            order.items.forEach(item => {
                const remaining = item.quantity - (item.receivedQuantity || 0);
                initialQty[item.product._id || item.product] = Math.max(0, remaining);
            });
            setDeliveryQuantities(initialQty);
        }
    }, [order]);

    if (!order) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const deliveredItems = Object.entries(deliveryQuantities)
                .filter(([_, qty]) => Number(qty) > 0)
                .map(([productId, qty]) => ({ productId, quantity: Number(qty) }));

            if (deliveredItems.length === 0) return alert('Enter at least one delivery quantity');

            // Validation: Delivery quantity cannot exceed remaining
            for (const dItem of deliveredItems) {
                const poItem = order.items.find(i => (i.product._id || i.product) === dItem.productId);
                const remaining = poItem.quantity - (poItem.receivedQuantity || 0);
                if (dItem.quantity > remaining) {
                    return alert(`Delivery for ${poItem.productName} (${dItem.quantity}) exceeds remaining expected (${remaining})`);
                }
            }

            await api.patch(`/purchase-orders/${order._id}/status`, { deliveredItems });
            onSuccess();
            onClose();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to record delivery');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
                <div className="bg-emerald-600 p-6 text-white flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Truck size={24} />
                        <div>
                            <h3 className="text-xl font-black">Record Shipment</h3>
                            <p className="text-emerald-100/70 text-[10px] font-bold uppercase tracking-widest">{order.poNumber}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={20} /></button>
                </div>
                
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    <div className="space-y-4">
                        {order.items.map((item, idx) => {
                            const pId = item.product._id || item.product;
                            const received = item.receivedQuantity || 0;
                            const remaining = item.quantity - received;
                            
                            return (
                                <div key={idx} className="bg-gray-50 border border-gray-100 rounded-2xl p-4 space-y-3">
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-bold text-gray-800 text-sm">{item.productName}</h4>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-gray-400 uppercase">Target</p>
                                            <p className="text-xs font-black text-gray-600">{item.quantity} PCS</p>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-white/60 p-2 rounded-xl border border-gray-100">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">Received</p>
                                            <p className="text-xs font-black text-emerald-600">{received} PCS</p>
                                        </div>
                                        <div className="bg-white/60 p-2 rounded-xl border border-gray-100">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">Expected</p>
                                            <p className="text-xs font-black text-gray-700">{remaining} PCS</p>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black text-primary uppercase tracking-widest mb-1.5 block">Delivering Now</label>
                                        <input 
                                            type="number"
                                            max={remaining}
                                            min={0}
                                            className="w-full border border-gray-200 p-2.5 rounded-xl text-sm font-black focus:ring-2 focus:ring-primary/20 outline-none"
                                            value={deliveryQuantities[pId] || ''}
                                            onChange={e => setDeliveryQuantities({ ...deliveryQuantities, [pId]: e.target.value })}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </form>

                <div className="p-6 bg-gray-50 border-t flex gap-3">
                    <button type="button" onClick={onClose} className="flex-1 py-3 px-4 bg-white border border-gray-200 rounded-xl font-bold text-sm text-gray-600 hover:bg-gray-100 transition-all">Cancel</button>
                    <button type="submit" onClick={handleSubmit} disabled={submitting} className="flex-2 py-3 px-8 bg-emerald-600 text-white rounded-xl font-black text-sm hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 disabled:opacity-50">
                        {submitting ? <Clock size={16} className="animate-spin" /> : <CheckCircle size={16} />} 
                        {submitting ? 'Recording...' : 'Record Delivery'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const ViewPOModal = ({ order, onClose }) => {
    if (!order) return null;
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="bg-primary px-4 py-4 sm:p-6 text-white flex justify-between items-center bg-gradient-to-r from-primary to-primary-dark">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/10 rounded-xl"><Receipt size={20} /></div>
                        <div>
                            <h3 className="text-base sm:text-xl font-black">{order.poNumber}</h3>
                            <p className="text-white/70 text-xs font-bold uppercase tracking-widest">
                                {new Date(order.date).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-4 sm:p-8 space-y-6 overflow-y-auto italic custom-scrollbar">
                    {/* Status Timeline */}
                    <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100 italic">
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 border-b pb-2">Shipment Timeline</h4>
                        <div className="relative flex justify-between items-start">
                            {/* Connector Line */}
                            <div className="absolute top-4 left-[10%] right-[10%] h-0.5 bg-gray-200 z-0">
                                <div 
                                    className="h-full bg-primary transition-all duration-1000" 
                                    style={{ width: order.deliveryStatus === 'PENDING' ? '0%' : order.deliveryStatus === 'IN_TRANSIT' ? '50%' : '100%' }}
                                />
                            </div>

                            {[
                                { label: 'Order Placed', status: 'PENDING', time: order.createdAt },
                                { label: 'In Transit', status: 'IN_TRANSIT', time: order.updatedAt, activeIf: ['IN_TRANSIT', 'PARTIAL', 'DELIVERED'] },
                                { 
                                    label: order.deliveryStatus === 'PARTIAL' ? 'Part-Received' : 'Delivered', 
                                    status: 'DELIVERED', 
                                    time: order.partialDeliveries?.[order.partialDeliveries.length - 1]?.deliveredAt || order.updatedAt, 
                                    activeIf: ['PARTIAL', 'DELIVERED'],
                                    sub: `${order.items.reduce((acc, i) => acc + (i.receivedQuantity || 0), 0)} PCS` 
                                }
                            ].map((step, idx) => {
                                const isActive = step.activeIf ? step.activeIf.includes(order.deliveryStatus) : true;
                                return (
                                    <div key={idx} className="relative z-10 flex flex-col items-center text-center w-1/3">
                                        <div className={clsx(
                                            "w-8 h-8 rounded-full flex items-center justify-center border-4 border-white shadow-sm transition-all duration-500",
                                            isActive ? "bg-primary text-white scale-110" : "bg-gray-200 text-gray-400"
                                        )}>
                                            {idx === 0 ? <Receipt size={14} /> : idx === 1 ? <Truck size={14} /> : <CheckCircle size={14} />}
                                        </div>
                                        <p className={clsx("text-[9px] font-black uppercase mt-2", isActive ? "text-primary" : "text-gray-400")}>{step.label}</p>
                                        <p className="text-[8px] text-gray-400 mt-0.5 font-bold">
                                            {step.sub && <span className="text-primary block leading-none mb-1 font-black">{step.sub}</span>}
                                            {new Date(step.time).toLocaleDateString()}
                                            <br />
                                            {new Date(step.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 font-medium">
                        <div className="space-y-3 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b pb-2 mb-2">Party / Vendor</h4>
                            <p className="flex items-center gap-2 text-sm text-gray-800 font-bold"><User size={13} className="text-primary shrink-0" />{order.party.name}</p>
                            <p className="flex items-center gap-2 text-sm text-gray-600"><Phone size={13} className="text-gray-400 shrink-0" />{order.party.phone || 'N/A'}</p>
                            <p className="flex items-center gap-2 text-sm text-gray-600"><Mail size={13} className="text-gray-400 shrink-0" />{order.party.email || 'N/A'}</p>
                            <p className="flex items-start gap-2 text-sm text-gray-600 leading-relaxed"><MapPin size={13} className="text-gray-400 shrink-0 mt-0.5" />{order.party.address || 'N/A'}</p>
                        </div>
                        <div className="space-y-4">
                            <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10">
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Target Point</h4>
                                <p className="flex items-center gap-2 text-sm font-black text-primary uppercase">{order.warehouse?.name || 'N/A'}</p>
                            </div>
                            <div>
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Order Progress</h4>
                                <div className="flex items-center gap-3">
                                    <div className="flex-1 bg-gray-100 h-2 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-emerald-500 rounded-full transition-all duration-1000" 
                                            style={{ width: `${Math.min(100, (order.items.reduce((acc, i) => acc + (i.receivedQuantity || 0), 0) / order.totals.totalQuantity) * 100)}%` }}
                                        />
                                    </div>
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                        {Math.round((order.items.reduce((acc, i) => acc + (i.receivedQuantity || 0), 0) / order.totals.totalQuantity) * 100)}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div>
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 px-1">Itemized Summary</h4>
                        <div className="border border-gray-100 rounded-2xl overflow-hidden overflow-x-auto shadow-sm">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50/50 border-b">
                                    <tr>
                                        <th className="px-4 py-4 font-black text-[10px] text-gray-400 uppercase">Item</th>
                                        <th className="px-4 py-4 font-black text-[10px] text-gray-400 uppercase text-center">Ordered</th>
                                        <th className="px-4 py-4 font-black text-[10px] text-gray-400 uppercase text-center">Received</th>
                                        <th className="px-4 py-4 font-black text-[10px] text-gray-400 uppercase text-center">Pending</th>
                                        <th className="px-4 py-4 font-black text-[10px] text-gray-400 uppercase text-right">Value</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {order.items.map((item, i) => {
                                        const pending = item.quantity - (item.receivedQuantity || 0);
                                        return (
                                            <tr key={i} className="hover:bg-gray-50/30 transition-colors">
                                                <td className="px-4 py-4 font-black text-gray-900 leading-tight">{item.productName}</td>
                                                <td className="px-4 py-4 text-center font-bold text-gray-400">{item.quantity}</td>
                                                <td className="px-4 py-4 text-center font-black text-emerald-600">{item.receivedQuantity || 0}</td>
                                                <td className={clsx("px-4 py-4 text-center font-black", pending > 0 ? "text-amber-500" : "text-gray-300")}>{pending}</td>
                                                <td className="px-4 py-4 text-right font-black text-gray-900 whitespace-nowrap">INR {item.amount?.toLocaleString() || '—'}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {order.partialDeliveries?.length > 0 && (
                        <div>
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 px-1">Activity Log (Partial Shipments)</h4>
                            <div className="space-y-2">
                                {order.partialDeliveries.map((delivery, dIdx) => (
                                    <div key={dIdx} className="bg-gray-50 border border-gray-100 rounded-xl p-3 flex justify-between items-center group hover:bg-gray-100/50 transition-all">
                                        <div>
                                            <p className="text-[10px] font-black text-gray-900 group-hover:text-primary transition-colors">Shipment #{order.partialDeliveries.length - dIdx}</p>
                                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tight">
                                                {new Date(delivery.deliveredAt).toLocaleString()} • {delivery.performedBy?.name || 'Admin'}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xs font-black text-emerald-600">+{delivery.items.reduce((acc, i) => acc + i.quantity, 0)} Units</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <div className="p-4 sm:p-6 bg-gray-50 border-t flex justify-end gap-3 shrink-0">
                    <button onClick={() => generatePOPDF(order)} className="flex items-center gap-2 px-4 sm:px-6 py-2.5 bg-white border border-gray-200 rounded-xl font-bold text-xs text-gray-600 hover:bg-gray-100 transition-all shadow-sm">
                        <Download size={14} /><span className="hidden sm:inline">Download Record</span><span className="sm:hidden">PDF</span>
                    </button>
                    <button onClick={onClose} className="px-6 py-2.5 bg-primary text-white rounded-xl font-black text-xs hover:bg-opacity-90 transition-all shadow-md shadow-primary/20">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

const PurchaseOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingOrder, setEditingOrder] = useState(null);
    const [viewingOrder, setViewingOrder] = useState(null);
    const [deliveryOrder, setDeliveryOrder] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => { fetchOrders(); }, []);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res = await api.get('/purchase-orders');
            setOrders(res.data);
        } catch (error) {
            console.error('Failed to fetch POs', error);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id, status) => {
        if (!window.confirm(`Mark this order as ${status}?`)) return;
        try {
            await api.patch(`/purchase-orders/${id}/status`, { deliveryStatus: status });
            fetchOrders();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to update status');
        }
    };

    if (loading) return <PageLoader text="Loading purchase orders..." />;

    const filteredOrders = orders.filter(o => {
        const matchesSearch =
            o.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            o.party.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || o.deliveryStatus === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const StatusBadge = ({ status }) => {
        const styles = {
            PENDING: 'bg-amber-50 text-amber-600 border-amber-200',
            IN_TRANSIT: 'bg-blue-50 text-blue-600 border-blue-200',
            PARTIAL: 'bg-purple-50 text-purple-600 border-purple-200',
            DELIVERED: 'bg-emerald-50 text-emerald-600 border-emerald-200',
        };
        const icons = {
            PENDING: <Clock size={11} />,
            IN_TRANSIT: <Truck size={11} />,
            PARTIAL: <Clock size={11} />, // Or a half-circle icon
            DELIVERED: <CheckCircle size={11} />,
        };
        return (
            <span className={clsx(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border whitespace-nowrap",
                styles[status]
            )}>
                {icons[status]}
                {status.replace('_', ' ')}
            </span>
        );
    };

    return (
        <div className="space-y-3">
            {/* Sticky header */}
            <div className="sticky top-0 z-10 bg-gray-50 pb-2 space-y-2">
                <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                        <h1 className="text-lg font-black text-gray-900 leading-tight">Purchase Orders</h1>
                        <p className="text-gray-400 text-xs mt-0.5">Manage vendor orders and incoming stock deliveries.</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-1.5 bg-primary text-white px-3 py-2 rounded-xl font-bold text-xs shadow-md shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all shrink-0"
                    >
                        <Plus size={15} />
                        <span className="hidden sm:inline">New Order</span>
                        <span className="sm:hidden">New</span>
                    </button>
                </div>
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                        <input
                            type="text"
                            placeholder="Search by PO# or party name..."
                            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                        <Filter size={14} className="text-gray-400 hidden sm:block" />
                        <select
                            className="border border-gray-200 rounded-xl bg-white px-2 py-2 text-xs font-bold text-gray-600 outline-none shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">All Status</option>
                            <option value="PENDING">Pending</option>
                            <option value="IN_TRANSIT">In Transit</option>
                            <option value="PARTIAL">Partial</option>
                            <option value="DELIVERED">Delivered</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-auto max-h-[60vh]">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50/50 text-left border-b border-gray-100">
                                <th className="sticky top-0 bg-gray-50/95 backdrop-blur-sm px-3 py-3 text-[10px] font-black uppercase text-gray-400">Order / Party</th>
                                <th className="sticky top-0 bg-gray-50/95 backdrop-blur-sm px-3 py-3 text-[10px] font-black uppercase text-gray-400 hidden sm:table-cell">Warehouse</th>
                                <th className="sticky top-0 bg-gray-50/95 backdrop-blur-sm px-3 py-3 text-[10px] font-black uppercase text-gray-400 hidden md:table-cell text-center">Received / Total</th>
                                <th className="sticky top-0 bg-gray-50/95 backdrop-blur-sm px-3 py-3 text-[10px] font-black uppercase text-gray-400">Status</th>
                                <th className="sticky top-0 bg-gray-50/95 backdrop-blur-sm px-3 py-3 text-[10px] font-black uppercase text-gray-400 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-10 text-center text-gray-400 italic text-sm">
                                        No purchase orders found.
                                    </td>
                                </tr>
                            ) : filteredOrders.map((po) => (
                                <tr key={po._id} className="hover:bg-gray-50/50 transition-colors group">
                                    {/* Merged Order + Party cell */}
                                    <td className="px-3 py-3">
                                        <span className="font-black text-gray-900 text-sm group-hover:text-primary transition-colors block leading-tight">{po.poNumber}</span>
                                        <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-0.5">
                                            <Calendar size={10} />
                                            {new Date(po.date).toLocaleDateString()}
                                        </div>
                                        <div className="font-semibold text-gray-600 text-xs truncate max-w-[130px] mt-1">{po.party.name}</div>
                                    </td>
                                    <td className="px-3 py-3 hidden sm:table-cell">
                                        <div className="flex items-center gap-1.5 text-gray-600">
                                            <Warehouse size={13} className="text-gray-300 shrink-0" />
                                            <span className="text-sm font-medium truncate max-w-[120px]">{po.warehouse?.name || 'N/A'}</span>
                                        </div>
                                    </td>
                                    <td className="px-3 py-3 hidden md:table-cell text-center whitespace-nowrap">
                                        <div className="flex flex-col items-center">
                                            <span className={clsx(
                                                "text-[10px] font-black py-0.5 px-2 rounded-lg",
                                                po.deliveryStatus === 'DELIVERED' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-600'
                                            )}>
                                                {po.items.reduce((acc, i) => acc + (i.receivedQuantity || 0), 0)} / {po.totals.totalQuantity}
                                            </span>
                                            <div className="w-16 h-1 bg-gray-100 rounded-full mt-1.5 overflow-hidden">
                                                <div 
                                                    className="h-full bg-primary transition-all duration-700" 
                                                    style={{ width: `${Math.min(100, (po.items.reduce((acc, i) => acc + (i.receivedQuantity || 0), 0) / po.totals.totalQuantity) * 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-3 py-3">
                                        <StatusBadge status={po.deliveryStatus} />
                                    </td>
                                    <td className="px-3 py-3 text-right">
                                        <div className="flex items-center justify-end gap-0.5">
                                            {po.deliveryStatus === 'PENDING' && (
                                                <button onClick={() => updateStatus(po._id, 'IN_TRANSIT')} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-all" title="Mark In Transit">
                                                    <Truck size={15} />
                                                </button>
                                            )}
                                            {(po.deliveryStatus === 'IN_TRANSIT' || po.deliveryStatus === 'PARTIAL') && (
                                                <button onClick={() => setDeliveryOrder(po)} className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all" title="Record Delivery Receipt">
                                                    <CheckCircle size={15} />
                                                </button>
                                            )}
                                            <button onClick={() => generatePOPDF(po)} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-all hidden sm:block" title="Download PDF">
                                                <Download size={15} />
                                            </button>
                                            <button onClick={() => setViewingOrder(po)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-all" title="View Details">
                                                <Eye size={15} />
                                            </button>
                                            {po.deliveryStatus === 'PENDING' && (
                                                <button onClick={() => { setEditingOrder(po); setShowModal(true); }} className="p-1.5 text-amber-500 hover:bg-amber-50 rounded-lg transition-all hidden sm:block" title="Edit PO">
                                                    <Pencil size={15} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <CreatePOModal
                isOpen={showModal}
                onClose={() => { setShowModal(false); setEditingOrder(null); }}
                onSuccess={fetchOrders}
                editData={editingOrder}
            />
            <ViewPOModal order={viewingOrder} onClose={() => setViewingOrder(null)} />
            <RecordDeliveryModal order={deliveryOrder} onClose={() => setDeliveryOrder(null)} onSuccess={fetchOrders} />
        </div>
    );
};

export default PurchaseOrders;
