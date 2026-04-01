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

const ViewPOModal = ({ order, onClose }) => {
    if (!order) return null;
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-2xl overflow-hidden">
                <div className="bg-primary px-4 py-4 sm:p-6 text-white flex justify-between items-center">
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
                <div className="p-4 sm:p-8 space-y-5 max-h-[70vh] overflow-y-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 font-medium">
                        <div className="space-y-2">
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Party / Vendor</h4>
                            <p className="flex items-center gap-2 text-sm text-gray-800"><User size={13} className="text-gray-400 shrink-0" />{order.party.name}</p>
                            <p className="flex items-center gap-2 text-sm text-gray-800"><Phone size={13} className="text-gray-400 shrink-0" />{order.party.phone || 'N/A'}</p>
                            <p className="flex items-center gap-2 text-sm text-gray-800"><Mail size={13} className="text-gray-400 shrink-0" />{order.party.email || 'N/A'}</p>
                            <p className="flex items-start gap-2 text-sm text-gray-800"><MapPin size={13} className="text-gray-400 shrink-0 mt-0.5" />{order.party.address || 'N/A'}</p>
                        </div>
                        <div className="space-y-2">
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Logistic Point</h4>
                            <p className="flex items-center gap-2 text-sm font-black text-gray-900 border-l-4 border-primary pl-3">{order.warehouse?.name || 'N/A'}</p>
                            <div className="mt-4">
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Status</h4>
                                <div className="flex items-center gap-2">
                                    <span className={clsx(
                                        "px-3 py-1 rounded-full text-[10px] font-black tracking-widest border",
                                        order.deliveryStatus === 'DELIVERED'
                                            ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                                            : "bg-amber-50 text-amber-600 border-amber-200"
                                    )}>
                                        {order.deliveryStatus}
                                    </span>
                                    <span className="text-[10px] text-gray-300 font-bold">
                                        {new Date(order.updatedAt).toLocaleTimeString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div>
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Ordered Items</h4>
                        <div className="border rounded-2xl overflow-hidden overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-4 py-3 font-black text-[10px] text-gray-400 uppercase">Item</th>
                                        <th className="px-4 py-3 font-black text-[10px] text-gray-400 uppercase text-center">Qty</th>
                                        <th className="px-4 py-3 font-black text-[10px] text-gray-400 uppercase text-right">Price</th>
                                        <th className="px-4 py-3 font-black text-[10px] text-gray-400 uppercase text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 italic">
                                    {order.items.map((item, i) => (
                                        <tr key={i} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3 font-bold text-gray-900">{item.productName}</td>
                                            <td className="px-4 py-3 text-center font-black">{item.quantity}</td>
                                            <td className="px-4 py-3 text-right">INR {item.unitPrice || '—'}</td>
                                            <td className="px-4 py-3 text-right font-black">INR {item.amount || '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-gray-50 font-black">
                                    <tr>
                                        <td colSpan="3" className="px-4 py-3 text-right text-gray-400 uppercase text-[10px]">Grand Total</td>
                                        <td className="px-4 py-3 text-right text-primary">INR {order.totals.totalAmount.toLocaleString()}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </div>
                <div className="p-4 sm:p-6 bg-gray-50 border-t flex justify-end gap-3">
                    <button onClick={() => generatePOPDF(order)} className="flex items-center gap-2 px-4 sm:px-6 py-2 bg-white border border-gray-200 rounded-xl font-bold text-sm text-gray-600 hover:bg-gray-100 transition-all">
                        <Download size={16} /><span className="hidden sm:inline">Download PDF</span><span className="sm:hidden">PDF</span>
                    </button>
                    <button onClick={onClose} className="px-4 sm:px-6 py-2 bg-primary text-white rounded-xl font-bold text-sm hover:bg-opacity-90 transition-all">
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
            DELIVERED: 'bg-emerald-50 text-emerald-600 border-emerald-200',
        };
        const icons = {
            PENDING: <Clock size={11} />,
            IN_TRANSIT: <Truck size={11} />,
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
                                <th className="sticky top-0 bg-gray-50/95 backdrop-blur-sm px-3 py-3 text-[10px] font-black uppercase text-gray-400 hidden md:table-cell">Qty</th>
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
                                    <td className="px-3 py-3 hidden md:table-cell">
                                        <span className="text-sm font-black text-gray-700 bg-gray-100 px-2 py-0.5 rounded-lg">{po.totals.totalQuantity}</span>
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
                                            {po.deliveryStatus === 'IN_TRANSIT' && (
                                                <button onClick={() => updateStatus(po._id, 'DELIVERED')} className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all" title="Mark Delivered">
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
        </div>
    );
};

export default PurchaseOrders;
