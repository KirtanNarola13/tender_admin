import { useEffect, useState } from 'react';
import api from '../services/api';
import CreatePOModal from '../components/CreatePOModal';
import { generatePOPDF } from '../utils/pdfGenerator';
import {
    Plus, Download, Truck, CheckCircle, Clock, Search,
    Filter, Eye, Warehouse, Calendar, X, User, MapPin,
    Mail, Phone, Receipt, Pencil, Tag
} from 'lucide-react';
import clsx from 'clsx';
import PageLoader from '../components/PageLoader';
import { useAlert } from '../context/AlertContext';

import CustomSelect from '../components/CustomSelect';

const PO_STATUS_OPTIONS = [
    { value: 'all', label: 'All Status' },
    { value: 'ORDER_PLACED', label: 'Order Placed' },
    { value: 'ADVANCE', label: 'Advance' },
    { value: 'IN_PRODUCTION', label: 'In Production' },
    { value: 'TRANSIT', label: 'In Transit' },
    { value: 'PARTIAL', label: 'Partial Delivery' },
    { value: 'DELIVERED', label: 'Delivered' },
    { value: 'INSTALLATION', label: 'Installation' },
    { value: 'COMPLETED', label: 'Completed' },
];

const ORDERED_STATUSES = [
    'ORDER_PLACED', 'ADVANCE', 'IN_PRODUCTION', 'TRANSIT', 'DELIVERED', 'INSTALLATION', 'COMPLETED'
];

const STATUS_ICONS = {
    ORDER_PLACED: <Receipt size={14} />,
    ADVANCE: <Receipt size={14} />,
    IN_PRODUCTION: <Warehouse size={14} />,
    TRANSIT: <Truck size={14} />,
    DELIVERED: <CheckCircle size={14} />,
    INSTALLATION: <CheckCircle size={14} />,
    COMPLETED: <CheckCircle size={14} />,
    PARTIAL: <Clock size={14} />
};

const formatDateTime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const z = n => (n < 10 ? '0' : '') + n;
    return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}T${z(d.getHours())}:${z(d.getMinutes())}`;
};

const StatusUpdateModal = ({ order, onClose, onSuccess }) => {
    const [selectedStatus, setSelectedStatus] = useState('');
    const [expectedDate, setExpectedDate] = useState('');
    const [actualDate, setActualDate] = useState(formatDateTime(new Date()));
    const [notes, setNotes] = useState('');
    const [deliveryQuantities, setDeliveryQuantities] = useState({});
    const [loading, setLoading] = useState(false);
    const { showAlert } = useAlert();

    useEffect(() => {
        if (order) {
            const currentIdx = ORDERED_STATUSES.indexOf(order.deliveryStatus === 'PARTIAL' ? 'TRANSIT' : order.deliveryStatus);
            const nextIdx = Math.min(ORDERED_STATUSES.length - 1, currentIdx + 1);
            const nextStat = ORDERED_STATUSES[nextIdx];
            setSelectedStatus(nextStat);

            // Pre-fill expected date from current timeline if exists
            const nextTimeline = order.statusTimeline?.find(t => t.status === nextStat);
            if (nextTimeline?.expectedDate) {
                setExpectedDate(formatDateTime(nextTimeline.expectedDate));
            }

            // Init delivery quantities if target state is DELIVERED
            const qties = {};
            order.items.forEach(item => {
                const remaining = item.quantity - (item.receivedQuantity || 0);
                qties[item.product._id || item.product] = Math.max(0, remaining);
            });
            setDeliveryQuantities(qties);
        }
    }, [order]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const deliveredItems = Object.entries(deliveryQuantities)
            .filter(([_, qty]) => Number(qty) > 0)
            .map(([productId, qty]) => ({ productId, quantity: Number(qty) }));

        // Validation for items if status is DELIVERED
        if (selectedStatus === 'DELIVERED') {
            for (const dItem of deliveredItems) {
                const poItem = order.items.find(i => (i.product._id || i.product) === dItem.productId);
                const remaining = poItem.quantity - (poItem.receivedQuantity || 0);
                if (dItem.quantity > remaining) {
                    showAlert(`Delivery for ${poItem.productName} (${dItem.quantity}) exceeds remaining (${remaining})`, 'error');
                    setLoading(false);
                    return;
                }
            }
        }

        try {
            await api.patch(`/purchase-orders/${order._id}/status`, {
                deliveryStatus: selectedStatus,
                expectedDate: expectedDate ? new Date(expectedDate).toISOString() : '',
                actualDate: new Date(actualDate).toISOString(),
                notes,
                deliveredItems: selectedStatus === 'DELIVERED' ? deliveredItems : []
            });
            onSuccess();
            onClose();
        } catch (error) {
            showAlert(error.response?.data?.message || 'Update failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (!order) return null;

    const isDelivering = selectedStatus === 'DELIVERED';

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[120] flex items-center justify-center p-4 text-left">
            <div className={clsx(
                "bg-white rounded-2xl shadow-2xl w-full overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-200 flex flex-col",
                isDelivering ? "max-w-xl max-h-[90vh]" : "max-w-sm"
            )}>
                <div className={clsx(
                    "p-5 text-white flex justify-between items-center bg-gradient-to-br transition-colors duration-500",
                    isDelivering ? "from-emerald-600 to-emerald-700" : "from-amber-600 to-amber-700"
                )}>
                    <h3 className="text-lg font-black flex items-center gap-2">
                        {isDelivering ? <Truck size={18} className="animate-bounce" /> : <Clock size={18} className="animate-pulse" />}
                        {isDelivering ? 'Confirm Goods Receipt' : 'Progress Order'}
                    </h3>
                    <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-full transition-colors"><X size={18} /></button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
                    <div className={clsx(
                        "p-3 rounded-xl border transition-colors",
                        isDelivering ? "bg-emerald-50 border-emerald-100" : "bg-amber-50 border-amber-100"
                    )}>
                        <p className={clsx("text-[10px] font-black uppercase tracking-widest mb-1", isDelivering ? "text-emerald-600" : "text-amber-600")}>Target Milestone</p>
                        <div className="flex items-center gap-2">
                            <span className={clsx("text-lg font-black uppercase tracking-tight", isDelivering ? "text-emerald-800" : "text-amber-800")}>{selectedStatus.replace('_', ' ')}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Expected Date</label>
                            <input
                                type="datetime-local"
                                className="w-full border border-gray-200 p-2.5 rounded-xl text-[10px] font-bold focus:ring-2 focus:ring-primary/20 outline-none bg-gray-50/50"
                                value={expectedDate}
                                onChange={e => setExpectedDate(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Actual Date</label>
                            <input
                                type="datetime-local"
                                className="w-full border border-gray-200 p-2.5 rounded-xl text-[10px] font-bold focus:ring-2 focus:ring-primary/20 outline-none bg-white"
                                value={actualDate}
                                onChange={e => setActualDate(e.target.value)}
                            />
                        </div>
                    </div>

                    {isDelivering && (
                        <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Itemized Quantities</h4>
                            {order.items.map((item, idx) => {
                                const pId = item.product._id || item.product;
                                const remaining = item.quantity - (item.receivedQuantity || 0);
                                return (
                                    <div key={idx} className="bg-white p-3 rounded-xl border border-gray-100 flex items-center justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-black text-gray-800 truncate">{item.productName}</p>
                                            <p className="text-[9px] font-bold text-gray-400 uppercase">Remain: {remaining} PCS</p>
                                        </div>
                                        <div className="w-24">
                                            <input
                                                type="number"
                                                className="w-full border border-gray-100 bg-gray-50 p-1.5 rounded-lg text-xs font-black text-right focus:bg-white focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
                                                value={deliveryQuantities[pId] || ''}
                                                onChange={e => setDeliveryQuantities({ ...deliveryQuantities, [pId]: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Notes / Remark</label>
                        <textarea
                            className="w-full border border-gray-200 p-2.5 rounded-xl text-xs font-medium focus:ring-2 focus:ring-primary/20 outline-none bg-gray-50/50 resize-none"
                            placeholder="Add brief details about this update..."
                            rows={isDelivering ? 2 : 3}
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                        />
                    </div>

                    <div className="pt-2 flex gap-2">
                        <button type="button" onClick={onClose} className="flex-1 py-3 px-4 bg-gray-100 rounded-xl font-bold text-xs text-gray-600 hover:bg-gray-200 transition-all">Cancel</button>
                        <button type="submit" disabled={loading || !selectedStatus} className={clsx(
                            "flex-2 py-3 px-4 text-white rounded-xl font-black text-xs transition-all shadow-lg",
                            isDelivering ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200" : "bg-amber-600 hover:bg-amber-700 shadow-amber-200"
                        )}>
                            {loading ? 'Processing...' : `Confirm ${selectedStatus.replace('_', ' ')}`}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const ViewPOModal = ({ order, onClose }) => {
    if (!order) return null;
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-5xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="bg-primary px-4 py-4 sm:p-6 text-white flex justify-between items-center bg-gradient-to-r from-primary to-primary-dark">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/10 rounded-xl"><Receipt size={20} /></div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h3 className="text-base sm:text-xl font-black">{order.poNumber}</h3>
                                {order.project?.workOrder?.workOrderNumber && (
                                    <span className="bg-white/20 px-2 py-1 rounded text-xs font-black uppercase tracking-wider backdrop-blur-sm">
                                        WON: {order.project.workOrder.workOrderNumber}
                                    </span>
                                )}
                            </div>
                            <p className="text-white/70 text-sm font-bold uppercase tracking-widest mt-1">
                                {new Date(order.date).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-4 sm:p-8 space-y-6 overflow-y-auto custom-scrollbar">
                    <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <h4 className="text-sm font-black text-primary uppercase tracking-widest mb-4 border-b border-primary/10 pb-2 flex items-center gap-2">
                            Shipment Journey
                        </h4>

                        {/* Mobile View: Vertical Timeline */}
                        <div className="sm:hidden space-y-6 relative ml-4">
                            {/* Vertical connecting line */}
                            <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-gray-100 z-0">
                                <div
                                    className="w-full bg-primary transition-all duration-1000 origin-top"
                                    style={{
                                        height: `${(ORDERED_STATUSES.indexOf(order.deliveryStatus === 'PARTIAL' ? 'DELIVERED' : order.deliveryStatus) / (ORDERED_STATUSES.length - 1)) * 100}%`
                                    }}
                                />
                            </div>

                            {ORDERED_STATUSES.map((stepStatus, idx) => {
                                const timelineItem = order.statusTimeline?.find(t => t.status === stepStatus);
                                const isCompleted = timelineItem?.isCompleted;
                                const isCurrent = order.deliveryStatus === stepStatus || (order.deliveryStatus === 'PARTIAL' && stepStatus === 'DELIVERED');
                                const isActive = isCompleted || isCurrent;

                                return (
                                    <div key={idx} className="relative z-10 flex items-start gap-5">
                                        <div className={clsx(
                                            "w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-4 border-white shadow-sm transition-all duration-500 text-base",
                                            isCompleted ? "bg-primary text-white" : isCurrent ? "bg-amber-500 text-white animate-pulse" : "bg-gray-100 text-gray-400"
                                        )}>
                                            {STATUS_ICONS[stepStatus] || <Clock size={16} />}
                                        </div>
                                        <div className="pt-1.5 flex-1">
                                            <p className={clsx("text-sm font-bold uppercase mb-1.5", isActive ? "text-primary" : "text-gray-400")}>
                                                {stepStatus.replace('_', ' ')}
                                                {stepStatus === 'DELIVERED' && order.deliveryStatus === 'PARTIAL' && <span className="ml-2 text-[11px] font-medium text-amber-500">(PARTIAL)</span>}
                                            </p>
                                            <div className="flex flex-wrap gap-x-8 gap-y-3">
                                                <div>
                                                    <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider mb-0.5">Expected</p>
                                                    <p className="text-sm font-medium text-gray-700 leading-tight">
                                                        {timelineItem?.expectedDate ? new Date(timelineItem.expectedDate).toLocaleDateString() : '—'}
                                                        {timelineItem?.expectedDate && (
                                                            <span className="opacity-60 text-xs ml-2 font-medium whitespace-nowrap">{new Date(timelineItem.expectedDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                        )}
                                                    </p>
                                                </div>
                                                {(timelineItem?.actualDate || stepStatus === 'ORDER_PLACED') && (
                                                    <div>
                                                        <p className="text-[11px] text-primary/50 font-medium uppercase tracking-wider mb-0.5">Real</p>
                                                        <p className="text-sm font-medium text-primary leading-tight">
                                                            {new Date(timelineItem?.actualDate || order.date).toLocaleDateString()}
                                                            <span className="opacity-60 text-xs ml-2 font-medium whitespace-nowrap">{new Date(timelineItem?.actualDate || order.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                            {timelineItem?.notes && (
                                                <div className="mt-3 bg-gray-50/80 border border-gray-100 p-3 rounded-xl">
                                                    <p className="text-[10px] font-medium uppercase text-gray-400 tracking-widest mb-1 flex items-center gap-1.5 leading-none">
                                                        Remark
                                                    </p>
                                                    <p className="text-xs font-medium text-gray-600 italic">"{timelineItem.notes}"</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Desktop View: Horizontal Timeline */}
                        <div className="hidden sm:block relative mt-4">
                            {/* Horizontal line connecting dots */}
                            <div className="absolute top-[20px] left-[5%] right-[5%] h-[2px] bg-gray-100 z-0">
                                <div
                                    className="w-full bg-primary transition-all duration-1000"
                                    style={{
                                        width: `${(ORDERED_STATUSES.indexOf(order.deliveryStatus === 'PARTIAL' ? 'DELIVERED' : order.deliveryStatus) / (ORDERED_STATUSES.length - 1)) * 100}%`
                                    }}
                                />
                            </div>

                            <div className="relative flex justify-between items-start">
                                {ORDERED_STATUSES.map((stepStatus, idx) => {
                                    const timelineItem = order.statusTimeline?.find(t => t.status === stepStatus);
                                    const isCompleted = timelineItem?.isCompleted;
                                    const isCurrent = order.deliveryStatus === stepStatus || (order.deliveryStatus === 'PARTIAL' && stepStatus === 'DELIVERED');
                                    const isActive = isCompleted || isCurrent;
                                    const displayActual = timelineItem?.actualDate || (stepStatus === 'ORDER_PLACED' ? order.date : null);

                                    return (
                                        <div key={idx} className="relative z-10 flex flex-col items-center text-center w-full px-1">
                                            <div className={clsx(
                                                "w-11 h-11 rounded-full flex items-center justify-center border-4 border-white shadow-sm transition-all duration-500",
                                                isCompleted ? "bg-primary text-white" : isCurrent ? "bg-amber-500 text-white animate-pulse" : "bg-gray-100 text-gray-400"
                                            )}>
                                                {STATUS_ICONS[stepStatus] || <Clock size={16} />}
                                            </div>
                                            <p className={clsx("text-[11px] font-bold uppercase mt-3 px-1 leading-tight", isActive ? "text-primary" : "text-gray-400")}>
                                                {stepStatus.replace('_', ' ')}
                                                {stepStatus === 'DELIVERED' && order.deliveryStatus === 'PARTIAL' && <span className="block text-[9px] font-medium text-amber-500">(PARTIAL)</span>}
                                            </p>

                                            <div className="mt-3 space-y-2.5 min-h-[65px] font-medium">
                                                <div>
                                                    <p className="text-[9px] text-gray-400 uppercase tracking-wide leading-none mb-1">Expected</p>
                                                    <p className="text-xs text-gray-600 leading-tight">
                                                        {timelineItem?.expectedDate ? new Date(timelineItem.expectedDate).toLocaleDateString() : '—'}
                                                        {timelineItem?.expectedDate && (
                                                            <span className="block text-[9px] opacity-60 mt-0.5">{new Date(timelineItem.expectedDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                        )}
                                                    </p>
                                                </div>
                                                {displayActual && (
                                                    <div className="bg-primary/5 p-2 rounded-xl text-primary border border-primary/10">
                                                        <p className="text-[9px] uppercase tracking-wide opacity-70 leading-none mb-1">Real Date</p>
                                                        <p className="text-xs my-0.5">{new Date(displayActual).toLocaleDateString()}</p>
                                                        <p className="text-[9px] opacity-60 leading-none">{new Date(displayActual).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                    </div>
                                                )}
                                                {timelineItem?.notes && (
                                                    <div className="bg-amber-50/50 border border-amber-100/50 p-1.5 rounded-lg flex flex-col items-center">
                                                        <p className="text-[7px] text-amber-600 font-medium uppercase tracking-widest leading-none mb-1">Remark</p>
                                                        <p className="text-[9px] font-medium text-gray-600 italic leading-tight truncate max-w-full" title={timelineItem.notes}>"{timelineItem.notes}"</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 font-medium">
                        <div className="space-y-3 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                            <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest border-b pb-2 mb-2">Party / Vendor</h4>
                            <p className="flex items-center gap-3 text-base text-gray-800 font-bold"><User size={16} className="text-primary shrink-0" />{order.party.name}</p>
                            <p className="flex items-center gap-3 text-sm text-gray-600"><Phone size={16} className="text-gray-400 shrink-0" />{order.party.phone || 'N/A'}</p>
                            <p className="flex items-center gap-3 text-sm text-gray-600"><Mail size={16} className="text-gray-400 shrink-0" />{order.party.email || 'N/A'}</p>
                            <p className="flex items-start gap-3 text-sm text-gray-600 leading-relaxed"><MapPin size={16} className="text-gray-400 shrink-0 mt-0.5" />{order.party.address || 'N/A'}</p>
                        </div>
                        <div className="space-y-4">
                            <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10">
                                <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Target Point</h4>
                                <p className="flex items-center gap-3 text-base font-black text-primary uppercase mb-2">
                                    <Warehouse size={16} className="shrink-0" />
                                    {order.warehouse?.name || 'N/A'}
                                </p>
                                {order.project?.workOrder?.workOrderNumber && (
                                    <div className="flex items-center gap-1.5 text-xs font-black text-primary/70 uppercase tracking-widest border-t border-primary/10 pt-2 mt-2">
                                        <Tag size={14} />
                                        Linked WON: {order.project.workOrder.workOrderNumber}
                                    </div>
                                )}
                            </div>
                            <div>
                                <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2 px-1">Order Progress</h4>
                                <div className="flex items-center gap-3">
                                    <div className="flex-1 bg-gray-100 h-2.5 rounded-full overflow-hidden shadow-inner">
                                        <div
                                            className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                                            style={{ width: `${Math.min(100, (order.items.reduce((acc, i) => acc + (i.receivedQuantity || 0), 0) / order.totals.totalQuantity) * 100)}%` }}
                                        />
                                    </div>
                                    <span className="text-xs font-black text-gray-500 uppercase tracking-widest">
                                        {Math.round((order.items.reduce((acc, i) => acc + (i.receivedQuantity || 0), 0) / order.totals.totalQuantity) * 100)}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-sm font-black text-gray-500 uppercase tracking-widest mb-4 px-1">Itemized Summary</h4>
                        <div className="border border-gray-100 rounded-2xl overflow-hidden overflow-x-auto shadow-sm">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 text-left border-b">
                                    <tr>
                                        <th className="px-5 py-4 font-black text-xs text-gray-500 uppercase tracking-widest">Item Detail</th>
                                        <th className="px-5 py-4 font-black text-xs text-gray-500 uppercase tracking-widest text-center">Ordered</th>
                                        <th className="px-5 py-4 font-black text-xs text-gray-500 uppercase tracking-widest text-center">Received</th>
                                        <th className="px-5 py-4 font-black text-xs text-gray-500 uppercase tracking-widest text-center">Pending</th>
                                        <th className="px-5 py-4 font-black text-xs text-gray-500 uppercase tracking-widest text-right whitespace-nowrap">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {order.items.map((item, i) => {
                                        const pending = item.quantity - (item.receivedQuantity || 0);
                                        return (
                                            <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-5 py-5 font-black text-gray-900 text-sm leading-tight">{item.productName}</td>
                                                <td className="px-5 py-5 text-center font-bold text-gray-600 text-sm">{item.quantity}</td>
                                                <td className="px-5 py-5 text-center font-black text-emerald-600 text-sm">{item.receivedQuantity || 0}</td>
                                                <td className={clsx("px-5 py-5 text-center font-black text-sm", pending > 0 ? "text-amber-500" : "text-gray-300")}>{pending}</td>
                                                <td className="px-5 py-5 text-right font-black text-gray-900 text-sm whitespace-nowrap lg:pr-8">INR {item.amount?.toLocaleString() || '—'}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {order.partialDeliveries?.length > 0 && (
                        <div>
                            <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3 px-1 mt-6">Activity Log (Partial Shipments)</h4>
                            <div className="space-y-3">
                                {order.partialDeliveries.map((delivery, dIdx) => (
                                    <div key={dIdx} className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex justify-between items-center group hover:bg-gray-100/50 transition-all">
                                        <div>
                                            <p className="text-sm font-black text-gray-900 group-hover:text-primary transition-colors">Shipment {dIdx + 1}</p>
                                            <p className="text-xs text-gray-500 font-bold uppercase tracking-tight mt-1">
                                                {new Date(delivery.deliveredAt).toLocaleString()} • {delivery.performedBy?.name || 'Admin'}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-base font-black text-emerald-600">+{delivery.items.reduce((acc, i) => acc + i.quantity, 0)} Units</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <div className="p-4 sm:p-6 bg-gray-50 border-t flex justify-end gap-3 shrink-0">
                    <button onClick={() => generatePOPDF(order)} className="flex items-center gap-2 px-4 sm:px-6 py-3 bg-white border border-gray-200 rounded-md font-bold text-xs text-gray-600 hover:bg-gray-100 transition-all shadow-sm">
                        <Download size={14} /><span className="hidden sm:inline">Download Record</span><span className="sm:hidden">PDF</span>
                    </button>
                    <button onClick={onClose} className="px-6 py-3 bg-primary text-white rounded-md font-black text-xs hover:bg-opacity-90 transition-all shadow-md shadow-primary/20">
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
    const [statusUpdateOrder, setStatusUpdateOrder] = useState(null);
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
            ORDER_PLACED: 'bg-gray-50 text-gray-600 border-gray-200',
            ADVANCE: 'bg-blue-50 text-blue-600 border-blue-200',
            IN_PRODUCTION: 'bg-indigo-50 text-indigo-600 border-indigo-200',
            TRANSIT: 'bg-cyan-50 text-cyan-600 border-cyan-200',
            PARTIAL: 'bg-amber-50 text-amber-600 border-amber-200',
            DELIVERED: 'bg-emerald-50 text-emerald-600 border-emerald-200',
            INSTALLATION: 'bg-purple-50 text-purple-600 border-purple-200',
            COMPLETED: 'bg-primary text-white border-primary shadow-sm shadow-primary/10',
        };
        const icons = {
            ORDER_PLACED: <Receipt size={11} />,
            ADVANCE: <Receipt size={11} />,
            IN_PRODUCTION: <Warehouse size={11} />,
            TRANSIT: <Truck size={11} />,
            PARTIAL: <Clock size={11} />,
            DELIVERED: <CheckCircle size={11} />,
            INSTALLATION: <CheckCircle size={11} />,
            COMPLETED: <CheckCircle size={11} />,
        };
        return (
            <span className={clsx(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border whitespace-nowrap",
                styles[status]
            )}>
                {icons[status] || <Clock size={11} />}
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
                        className="flex items-center gap-1.5 bg-primary text-white px-3 py-3 rounded-md font-bold text-xs shadow-md shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all shrink-0"
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
                            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-md bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                        <CustomSelect
                            value={statusFilter}
                            onChange={setStatusFilter}
                            options={PO_STATUS_OPTIONS}
                        />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-auto" style={{ maxHeight: 'calc(100dvh - 260px)' }}>
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
                                        {po.project?.workOrder?.workOrderNumber && (
                                            <div className="flex items-center gap-1 text-[10px] text-primary mt-1 font-black uppercase">
                                                <Tag size={10} />
                                                WON: {po.project.workOrder.workOrderNumber}
                                            </div>
                                        )}
                                        <div className="font-semibold text-gray-400 text-[10px] uppercase tracking-tighter mt-1">{po.party.name}</div>
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
                                        <div className="flex items-center justify-end gap-1.5">
                                            {po.deliveryStatus !== 'COMPLETED' && (() => {
                                                const currentIdx = ORDERED_STATUSES.indexOf(po.deliveryStatus === 'PARTIAL' ? 'TRANSIT' : po.deliveryStatus);
                                                const nextIdx = Math.min(ORDERED_STATUSES.length - 1, currentIdx + 1);
                                                const nextStat = ORDERED_STATUSES[nextIdx];

                                                if (nextStat && nextStat !== po.deliveryStatus) {
                                                    return (
                                                        <button
                                                            onClick={() => setStatusUpdateOrder(po)}
                                                            className="px-2.5 py-1.5 bg-amber-50 text-amber-600 border border-amber-100 rounded-full text-[9px] font-black uppercase hover:bg-amber-600 hover:text-white transition-all shadow-sm flex items-center gap-1.5"
                                                        >
                                                            <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                                                            {nextStat.replace('_', ' ')}
                                                        </button>
                                                    );
                                                }
                                                return null;
                                            })()}

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

            {statusUpdateOrder && <StatusUpdateModal order={statusUpdateOrder} onClose={() => setStatusUpdateOrder(null)} onSuccess={fetchOrders} />}
        </div>
    );
};

export default PurchaseOrders;
