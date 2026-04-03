import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api, { getImageUrl } from '../services/api';
import { useBranch } from '../context/BranchContext';
import { generatePOPDF } from '../utils/pdfGenerator';
import {
    Package,
    ArrowLeft,
    Warehouse,
    History,
    Download,
    Clock,
    CheckCircle,
    Truck,
    AlertCircle,
    TrendingUp,
    Layers,
    Tag,
    Trash2,
    Calendar,
    ArrowUpRight,
    Home,
    Receipt
} from 'lucide-react';
import clsx from 'clsx';

const ProductDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { activeBranch } = useBranch();
    const [product, setProduct] = useState(null);
    const [history, setHistory] = useState([]);
    const [stockLogs, setStockLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [warehouses, setWarehouses] = useState([]);

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [prodRes, historyRes, wareRes, logsRes] = await Promise.all([
                api.get(`/inventory/products`), // Product list (to find by id)
                api.get(`/purchase-orders/product/${id}`),
                api.get(`/inventory/warehouses`),
                api.get(`/inventory/logs?product=${id}`)
            ]);

            console.log('DEBUG: History Res:', historyRes.data);
            console.log('DEBUG: Stock Logs Res:', logsRes.data);

            // Find specific product
            const foundProduct = prodRes.data.find(p => p._id === id);
            setProduct(foundProduct);
            setHistory(historyRes.data);
            setWarehouses(wareRes.data);
            setStockLogs(logsRes.data || []);
        } catch (error) {
            console.error('Failed to fetch product details', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-12 text-center text-gray-400 font-bold flex flex-col items-center gap-4">
        <Package className="animate-bounce" size={48} />
        Loading Product Ecosystem...
    </div>;

    if (!product) return <div className="p-12 text-center">
        <AlertCircle className="text-red-500 mx-auto mb-4" size={48} />
        <h2 className="text-2xl font-bold">Product Not Found</h2>
        <button onClick={() => navigate('/inventory')} className="mt-4 text-primary font-bold">Back to Inventory</button>
    </div>;

    const StatusBadge = ({ status }) => {
        const styles = {
            'PENDING': 'bg-amber-50 text-amber-600 border-amber-200',
            'IN_TRANSIT': 'bg-blue-50 text-blue-600 border-blue-200',
            'DELIVERED': 'bg-emerald-50 text-emerald-600 border-emerald-200'
        };
        return (
            <span className={clsx(
                "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border",
                styles[status]
            )}>
                {status.replace('_', ' ')}
            </span>
        );
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header / Breadcrumb */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => navigate('/inventory')}
                    className="group flex items-center gap-2 text-gray-400 hover:text-gray-900 transition-all font-bold text-sm"
                >
                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    BACK TO INVENTORY
                </button>
                {/* <div className="flex gap-3">
                    <button className="px-4 py-2 border rounded-xl hover:bg-gray-50 flex items-center gap-2 font-black text-[10px] uppercase transition-all">
                        <Trash2 size={16} /> Delete Product
                    </button>
                </div> */}
            </div>

            {/* Product Overview Card */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Product Profile */}
                <div className="lg:col-span-2 bg-white rounded-2xl p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-8">
                    <div className="w-48 h-48 bg-gray-50 rounded-2xl flex items-center justify-center border border-dashed border-gray-200 group overflow-hidden relative">
                        {product.images?.[0] ? (
                            <img src={getImageUrl(product.images[0])} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        ) : (
                            <Package size={48} className="text-gray-200 group-hover:text-primary/20 transition-colors" />
                        )}
                        <span className="absolute top-2 right-2 px-2 py-1 bg-white/80 backdrop-blur rounded-lg text-[9px] font-black tracking-widest text-primary uppercase shadow-sm">
                            SKU-{product.sku || 'N/A'}
                        </span>
                    </div>

                    <div className="flex-1 space-y-4">
                        <div className="space-y-1">
                            <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{product.category || 'GENERAL CATEGORY'}</span>
                            <h1 className="text-4xl font-black text-gray-900 tracking-tight">{product.name}</h1>
                        </div>
                        <p className="text-gray-500 text-sm leading-relaxed max-w-xl">
                            {product.description || 'No description provided for this product. Use the edit function to provide detailed specifications and usage instructions.'}
                        </p>
                        <div className="flex gap-4 pt-2">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full text-xs font-bold text-gray-600">
                                <Layers size={14} /> {product.steps?.length || 0} Steps
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full text-xs font-bold text-primary">
                                <Tag size={14} /> Market Standard
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stock Summary Stats */}
                <div className="bg-primary rounded-2xl p-8 shadow-lg shadow-primary/20 text-white flex flex-col justify-between relative overflow-hidden group">
                    <TrendingUp className="absolute -right-4 -top-4 w-32 h-32 text-white/5 group-hover:rotate-12 transition-transform duration-700" />
                    <div>
                        <p className="text-primary-light/80 text-xs font-black uppercase tracking-[0.2em] mb-2">
                            Global Availability (System)
                        </p>
                        <h2 className="text-7xl font-black tracking-tighter">
                            {product.stock?.reduce((acc, s) => acc + s.quantity, 0) || 0}
                        </h2>
                        <div className="flex flex-col gap-2 mt-2">
                            <p className="text-primary-light font-bold uppercase tracking-wide opacity-80">Units in Total System</p>

                            {activeBranch !== 'all' && (
                                <div className="mt-4 pt-4 border-t border-white/10">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-primary-light/70 font-medium">Stock in {activeBranch}</span>
                                        <span className="font-black bg-white/20 px-2 py-0.5 rounded-md text-xs">
                                            {(() => {
                                                return product.stock?.filter(s => {
                                                    const w = s.warehouse?._id ? s.warehouse : warehouses.find(wh => wh._id === s.warehouse);
                                                    return w?.branch?.toLowerCase() === activeBranch?.toLowerCase();
                                                }).reduce((acc, curr) => acc + curr.quantity, 0) || 0;
                                            })()} UNITS
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-white/10">
                        <p className="text-primary-light font-black uppercase tracking-widest text-[9px]">Incoming Shipments</p>
                        <div className="space-y-2">
                            {history
                                .filter(h => h.deliveryStatus === 'PENDING' || h.deliveryStatus === 'IN_TRANSIT' || h.deliveryStatus === 'PARTIAL')
                                .map(po => {
                                    const item = po.items.find(i => (i.product?._id || i.product) === id);
                                    const pending = (item?.quantity || 0) - (item?.receivedQuantity || 0);
                                    if (pending <= 0) return null;
                                    return (
                                        <div key={po._id} className="flex justify-between items-center bg-white/10 p-2 rounded-lg border border-white/5">
                                            <div>
                                                <p className="text-[10px] font-black">{po.poNumber}</p>
                                                <p className="text-[8px] opacity-70 font-bold uppercase tracking-tighter">{po.party?.name || 'Stock Order'}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-black">{pending} PCS</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            {history.filter(h => h.deliveryStatus === 'PENDING' || h.deliveryStatus === 'IN_TRANSIT' || h.deliveryStatus === 'PARTIAL').length === 0 && (
                                <p className="text-[10px] opacity-50 italic">No pending deliveries</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Detailed Tabs / Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Warehouse Breakdown */}
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 space-y-6">
                    <h3 className="text-xl font-black flex items-center gap-3">
                        <Warehouse size={24} className="text-primary" /> Warehouse Breakdown
                    </h3>
                    <div className="space-y-4">
                        {product.stock && product.stock.length > 0 ? product.stock
                            .map(s => {
                                // Prefer the populated object, fallback to warehouses list lookup
                                const warehouseObj = s.warehouse?._id ? s.warehouse : warehouses.find(w => w._id === s.warehouse);
                                const isCurrentBranch = warehouseObj?.branch?.toLowerCase() === activeBranch?.toLowerCase();
                                return (
                                    <div key={s.warehouse?._id || s.warehouse} className={clsx(
                                        "flex items-center justify-between p-4 rounded-2xl transition-all border",
                                        isCurrentBranch ? "bg-primary/5 border-primary/20 shadow-sm" : "bg-gray-50 border-transparent opacity-70 hover:opacity-100 hover:bg-white hover:shadow-md"
                                    )}>
                                        <div className="flex items-center gap-4">
                                            <div className={clsx(
                                                "w-10 h-10 rounded-xl border flex items-center justify-center shadow-sm",
                                                isCurrentBranch ? "bg-white border-primary/20 text-primary" : "bg-white border-gray-100 text-gray-400"
                                            )}>
                                                <Home size={18} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-black text-gray-900 text-sm uppercase tracking-tight">{warehouseObj?.name || 'Local Store'}</p>
                                                    {isCurrentBranch && <span className="px-1.5 py-0.5 bg-primary text-white text-[8px] font-black rounded uppercase tracking-widest">Active Branch</span>}
                                                </div>
                                                <p className="text-[10px] text-gray-400 font-bold">{warehouseObj?.location || 'Central Facility'}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-black text-gray-900">{s.quantity}</p>
                                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Qty</p>
                                        </div>
                                    </div>
                                );
                            }) : (
                            <div className="py-12 text-center text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                No stock records found in any warehouse.
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 space-y-6 flex flex-col h-full">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-black flex items-center gap-3">
                            <History size={24} className="text-primary" /> Transaction History
                        </h3>
                        <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{stockLogs.length} RECORDS</span>
                    </div>

                    <div className="flex-1 space-y-4 overflow-y-auto max-h-[500px] custom-scrollbar pr-2">
                        {stockLogs.map((log) => {
                            // 1. Direct population check
                            let displayWON = log.referenceWorkOrder?.workOrderNumber ||
                                log.purchaseOrder?.project?.workOrder?.workOrderNumber ||
                                log.referenceProject?.workOrder?.workOrderNumber;

                            // 2. Extra robust fallback: Check the 'history' state we already have for this product
                            if (!displayWON && log.purchaseOrder) {
                                const poNum = log.purchaseOrder?.poNumber || (typeof log.purchaseOrder === 'string' ? log.purchaseOrder : log.purchaseOrder._id);
                                const match = history.find(h => h.poNumber === poNum || h._id === poNum);
                                displayWON = match?.project?.workOrder?.workOrderNumber;
                            }

                            return (
                                <div key={log._id} className="p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-primary/20 hover:bg-white hover:shadow-lg transition-all group">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className={clsx(
                                                "w-10 h-10 rounded-xl flex items-center justify-center shadow-sm",
                                                log.action === 'IN' || (log.action === 'ADJUSTMENT' && log.quantity > 0) ? "bg-emerald-50 text-emerald-500" :
                                                    log.action === 'TRANSFER' ? "bg-blue-50 text-blue-500" : "bg-amber-50 text-amber-500"
                                            )}>
                                                {log.action === 'IN' ? <Package size={18} /> :
                                                    log.action === 'TRANSFER' ? <Truck size={18} /> : <History size={18} />}
                                            </div>
                                            <div>
                                                <p className="font-black text-gray-900 text-sm uppercase tracking-tight">
                                                    {log.action}
                                                </p>
                                                <p className="text-[10px] text-gray-400 flex items-center gap-1">
                                                    <Calendar size={10} /> {new Date(log.createdAt).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right flex flex-col items-end gap-1">
                                            <div className="flex items-center gap-2">
                                                {displayWON && (
                                                    <span className="px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                                                        <Tag size={9} />
                                                        WON: {displayWON}
                                                    </span>
                                                )}
                                                <p className={clsx(
                                                    "text-sm font-black",
                                                    log.quantity > 0 ? "text-emerald-600" : "text-amber-600"
                                                )}>
                                                    {log.quantity > 0 ? '+' : ''}{log.quantity} PCS
                                                </p>
                                            </div>
                                            <p className="text-[9px] text-gray-400 font-bold uppercase">Quantity</p>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5 md:pl-12">
                                        <p className="text-[10px] font-bold text-gray-500 flex items-center gap-1">
                                            <Warehouse size={10} className="text-gray-400" />
                                            Warehouse: <span className="text-gray-900 font-black">{log.warehouse?.name || 'Local Store'}</span>
                                        </p>
                                        {log.purchaseOrder && (
                                            <div className="space-y-1 mt-1">
                                                <p className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                                                    <Receipt size={10} className="text-gray-300" />
                                                    Reference PO: <span className="text-gray-700 font-black">{log.purchaseOrder.poNumber || log.purchaseOrder}</span>
                                                </p>
                                            </div>
                                        )}
                                        <p className="text-[10px] font-bold text-gray-500 flex items-center gap-1">
                                            <Clock size={10} className="text-gray-400" />
                                            Reason: <span className="text-gray-600 italic font-medium">{log.reason || 'Manual update'}</span>
                                        </p>
                                        <p className="text-[10px] font-bold text-gray-400 flex items-center gap-1 pt-1 mt-1 border-t border-gray-100">
                                            Performer: <span className="text-gray-600">{log.performedBy?.name || 'Admin User'}</span>
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                        {stockLogs.length === 0 && (
                            <div className="py-12 text-center text-gray-400 italic bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                <History size={32} className="mx-auto mb-2 opacity-20" />
                                No stock transaction records available.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetails;
