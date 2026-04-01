import { useEffect, useState } from 'react';
import api from '../services/api';
import CreatePOModal from '../components/CreatePOModal';
import { generatePOPDF } from '../utils/pdfGenerator';
import { 
    Plus, 
    FileText, 
    Download, 
    Truck, 
    CheckCircle, 
    Clock, 
    Search, 
    Filter, 
    Eye, 
    MoreVertical,
    Warehouse,
    Calendar,
    ArrowRight,
    X, 
    User, 
    MapPin, 
    Mail, 
    Phone,
    Receipt,
    Pencil
} from 'lucide-react';
import clsx from 'clsx';

// --- View Order Modal ---
const ViewPOModal = ({ order, onClose }) => {
    if (!order) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in duration-200">
                <div className="bg-primary p-6 text-white flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/10 rounded-xl">
                            <Receipt size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black">{order.poNumber}</h3>
                            <p className="text-primary-light/80 text-xs font-bold uppercase tracking-widest">{new Date(order.date).toLocaleDateString()}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 font-medium">
                        <div className="space-y-3">
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Party / Vendor</h4>
                            <p className="flex items-center gap-2 text-sm text-gray-800"><User size={14} className="text-gray-400" /> {order.party.name}</p>
                            <p className="flex items-center gap-2 text-sm text-gray-800"><Phone size={14} className="text-gray-400" /> {order.party.phone || 'N/A'}</p>
                            <p className="flex items-center gap-2 text-sm text-gray-800"><Mail size={14} className="text-gray-400" /> {order.party.email || 'N/A'}</p>
                            <p className="flex items-start gap-2 text-sm text-gray-800"><MapPin size={14} className="text-gray-400 mt-1" /> {order.party.address || 'N/A'}</p>
                        </div>
                        <div className="space-y-3">
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Logistic Point</h4>
                            <p className="flex items-center gap-2 text-sm font-black text-gray-900 border-l-4 border-primary pl-3">{order.warehouse?.name || 'N/A'}</p>
                            <div className="mt-6">
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Status History</h4>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className={clsx(
                                        "px-3 py-1 rounded-full text-[10px] font-black tracking-widest border",
                                        order.deliveryStatus === 'DELIVERED' ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-amber-50 text-amber-600 border-amber-200"
                                    )}>
                                        {order.deliveryStatus}
                                    </span>
                                    <span className="text-[10px] text-gray-300 font-bold">Updated: {new Date(order.updatedAt).toLocaleTimeString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Ordered Items</h4>
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

                <div className="p-6 bg-gray-50 border-t flex justify-end gap-3">
                    <button onClick={() => generatePOPDF(order)} className="flex items-center gap-2 px-6 py-2 bg-white border border-gray-200 rounded-xl font-bold text-sm text-gray-600 hover:bg-gray-100 transition-all">
                        <Download size={18} /> Download PDF
                    </button>
                    <button onClick={onClose} className="px-6 py-2 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary-dark transition-all">
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

    useEffect(() => {
        fetchOrders();
    }, []);

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

    const filteredOrders = orders.filter(o => {
        const matchesSearch = o.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             o.party.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || o.deliveryStatus === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const StatusBadge = ({ status }) => {
        const styles = {
            'PENDING': 'bg-amber-50 text-amber-600 border-amber-200',
            'IN_TRANSIT': 'bg-blue-50 text-blue-600 border-blue-200',
            'DELIVERED': 'bg-emerald-50 text-emerald-600 border-emerald-200'
        };

        const icons = {
            'PENDING': <Clock size={12} />,
            'IN_TRANSIT': <Truck size={12} />,
            'DELIVERED': <CheckCircle size={12} />
        };

        return (
            <span className={clsx(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider border",
                styles[status]
            )}>
                {icons[status]}
                {status.replace('_', ' ')}
            </span>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Purchase Orders</h1>
                    <p className="text-gray-500 text-sm mt-1">Manage vendor orders and incoming stock deliveries.</p>
                </div>
                <button 
                    onClick={() => setShowModal(true)}
                    className="bg-primary text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 active:scale-95"
                >
                    <Plus size={20} /> New Order
                </button>
            </div>

            {/* Filters Row */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center">
                <div className="relative flex-1 min-w-[300px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search by PO# or Party Name..." 
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-100 bg-gray-50/50 focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter size={18} className="text-gray-400" />
                    <select 
                        className="bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/10"
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

            {/* List Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50/50 text-left border-b border-gray-100">
                                <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400">Order Details</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400">Party / Vendor</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400">Warehouse</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400">Items / Qty</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400">Status</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr><td colSpan="6" className="p-12 text-center text-gray-400"><Clock className="animate-spin inline mr-2" /> Loading Orders...</td></tr>
                            ) : filteredOrders.length === 0 ? (
                                <tr><td colSpan="6" className="p-12 text-center text-gray-400 italic">No purchase orders found matching your criteria.</td></tr>
                            ) : filteredOrders.map((po) => (
                                <tr key={po._id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-black text-gray-900 group-hover:text-primary transition-colors">{po.poNumber}</span>
                                            <div className="flex items-center gap-1 text-[11px] text-gray-400 mt-0.5">
                                                <Calendar size={12} />
                                                {new Date(po.date).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-800 text-sm">{po.party.name}</div>
                                        <div className="text-xs text-gray-400 truncate max-w-[150px]">{po.party.phone || 'No Contact'}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <Warehouse size={16} className="text-gray-300" />
                                            <span className="text-sm font-medium">{po.warehouse?.name || 'N/A'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-black text-gray-700 bg-gray-100 px-2 py-0.5 rounded-lg">{po.totals.totalQuantity}</span>
                                            <span className="text-[11px] text-gray-400 font-bold uppercase">Items Total</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <StatusBadge status={po.deliveryStatus} />
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {/* Status Updates */}
                                            {po.deliveryStatus === 'PENDING' && (
                                                <button 
                                                    onClick={() => updateStatus(po._id, 'IN_TRANSIT')}
                                                    className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                                                    title="Mark In Transit"
                                                >
                                                    <Truck size={18} />
                                                </button>
                                            )}
                                            {po.deliveryStatus === 'IN_TRANSIT' && (
                                                <button 
                                                    onClick={() => updateStatus(po._id, 'DELIVERED')}
                                                    className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all"
                                                    title="Mark Delivered"
                                                >
                                                    <CheckCircle size={18} />
                                                </button>
                                            )}
                                            <div className="h-4 w-[1px] bg-gray-200 mx-1" />
                                            {/* Utilities */}
                                            <button 
                                                onClick={() => generatePOPDF(po)}
                                                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-all"
                                                title="Download PDF"
                                            >
                                                <Download size={18} />
                                            </button>
                                            <button 
                                                onClick={() => setViewingOrder(po)}
                                                className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-all"
                                                title="View Details"
                                            >
                                                <Eye size={18} />
                                            </button>
                                            {po.deliveryStatus === 'PENDING' && (
                                                <button 
                                                    onClick={() => { setEditingOrder(po); setShowModal(true); }}
                                                    className="p-2 text-amber-500 hover:bg-amber-50 rounded-lg transition-all"
                                                    title="Edit PO"
                                                >
                                                    <Pencil size={18} />
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

            <ViewPOModal 
                order={viewingOrder} 
                onClose={() => setViewingOrder(null)} 
            />
        </div>
    );
};

export default PurchaseOrders;
