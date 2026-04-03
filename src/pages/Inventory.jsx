import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api, { getImageUrl } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useBranch } from '../context/BranchContext';
import { Plus, Package, Trash2, X, Upload, Download, CheckCircle, Loader2, Search, Warehouse, ShoppingCart, Pencil, AlertTriangle, Eye } from 'lucide-react';
import PageLoader from '../components/PageLoader';
import FormSelect from '../components/FormSelect';
import CustomSelect from '../components/CustomSelect';

const Inventory = () => {
    const { user: currentUser } = useAuth();
    const { activeBranch } = useBranch();
    const [products, setProducts] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [activeTab, setActiveTab] = useState('products');
    const [logs, setLogs] = useState([]);
    const [pageLoading, setPageLoading] = useState(true);

    // Forms
    const [showProductModal, setShowProductModal] = useState(false);
    const [showWarehouseModal, setShowWarehouseModal] = useState(false);
    const [showWarehouseStockModal, setShowWarehouseStockModal] = useState(false);
    const [selectedWarehouse, setSelectedWarehouse] = useState(null);

    const [newProduct, setNewProduct] = useState({
        name: '',
        sku: '',
        category: '',
        description: '',
        images: [],
        initialStock: { warehouseId: '', quantity: '' }
    });
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [newWarehouse, setNewWarehouse] = useState({ name: '', location: '' });

    useEffect(() => {
        fetchData();
    }, []); // Removed activeBranch dependency to keep inventory global

    const fetchData = async () => {
        try {
            const [prodRes, wareRes, logsRes] = await Promise.all([
                api.get(`/inventory/products?branch=all`),
                api.get(`/inventory/warehouses?branch=all`),
                api.get('/inventory/logs')
            ]);
            setProducts(prodRes.data);
            setWarehouses(wareRes.data);
            setLogs(logsRes.data || []);
        } catch (error) {
            console.error("Error fetching inventory");
        } finally {
            setPageLoading(false);
        }
    };

    const createProduct = async () => {
        try {
            await api.post('/inventory/products', newProduct);
            setShowProductModal(false);
            fetchData();
        } catch (e) { alert('Error creating product'); }
    };

    const [showTransferStockModal, setShowTransferStockModal] = useState(false);

    const [transferData, setTransferData] = useState({ productId: '', fromWarehouseId: '', toWarehouseId: '', quantity: '' });

    const handleImageUpload = async (file, type = 'new') => {
        if (!file) return;
        const formData = new FormData();
        formData.append('image', file);

        setIsUploadingImage(true);
        try {
            const res = await api.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const imageUrl = res.data.url;

            if (type === 'new') {
                setNewProduct(prev => ({ ...prev, images: [...(prev.images || []), imageUrl] }));
            } else {
                setEditProduct(prev => ({ ...prev, images: [...(prev.images || []), imageUrl] }));
            }
        } catch (error) {
            console.error('Image upload failed', error);
            alert('Image upload failed. Please try again.');
        } finally {
            setIsUploadingImage(false);
        }
    };



    const resetTransferForm = () => setTransferData({ productId: '', fromWarehouseId: '', toWarehouseId: '', quantity: '' });

    const handleTransferStock = async () => {
        try {
            await api.post('/inventory/stock/transfer', transferData);
            alert('Stock transferred successfully!');
            fetchData();
            setShowTransferStockModal(false);
            resetTransferForm();
        } catch (error) { alert('Error transferring stock'); }
    };

    const createWarehouse = async () => {
        try {
            await api.post('/inventory/warehouses', {
                ...newWarehouse,
                branch: activeBranch !== 'all' ? activeBranch : undefined
            });
            setShowWarehouseModal(false);
            fetchData();
        } catch (e) { alert('Error creating warehouse'); }
    };

    const [searchTerm, setSearchTerm] = useState('');

    // --- Bulk CSV Upload State ---
    const csvInputRef = useRef(null);
    const [csvUploading, setCsvUploading] = useState(false);
    const [csvProgress, setCsvProgress] = useState({ current: 0, total: 0 });
    const [uploadReport, setUploadReport] = useState(null);

    const downloadTemplate = () => {
        // steps column: semicolon-separated steps in format "Title:Description"
        const headers = 'name,sku,category,description,steps';
        const example1 = 'Steel Pipe,SP-001,Pipes,Standard steel pipe 6 inch,Manufacture:Make the item;Install:Install at site';
        const example2 = 'Concrete Block,CB-002,Blocks,Standard concrete block 400x200x200mm,';
        const csvContent = [headers, example1, example2].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'products_template.csv';
        link.click();
        URL.revokeObjectURL(url);
    };

    // Parse steps from "Title:Description;Title2:Description2" format
    const parseStepsFromCSV = (stepsStr) => {
        if (!stepsStr || !stepsStr.trim()) return [];
        return stepsStr.split(';').map((s, idx) => {
            const [title = '', description = ''] = s.split(':');
            return {
                title: title.trim(),
                description: description.trim(),
                sequence: idx + 1,
                requiredPhotos: ['after'],
            };
        }).filter(s => s.title);
    };

    const handleCSVUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        e.target.value = '';

        const text = await file.text();
        const lines = text.split(/\r?\n/).filter(l => l.trim());
        if (lines.length < 2) {
            alert('CSV is empty or has only headers. Please check the file.');
            return;
        }

        // Simple CSV row splitter (handles quoted fields)
        const splitCSVRow = (line) => {
            const result = [];
            let cur = '';
            let inQuotes = false;
            for (let i = 0; i < line.length; i++) {
                const ch = line[i];
                if (ch === '"') { inQuotes = !inQuotes; }
                else if (ch === ',' && !inQuotes) { result.push(cur.trim()); cur = ''; }
                else { cur += ch; }
            }
            result.push(cur.trim());
            return result;
        };

        const headerCols = splitCSVRow(lines[0]).map(h => h.toLowerCase());
        const getCol = (row, key) => {
            const idx = headerCols.indexOf(key);
            return idx >= 0 ? (row[idx] || '').trim() : '';
        };

        const dataRows = lines.slice(1);
        setCsvUploading(true);
        setCsvProgress({ current: 0, total: dataRows.length });

        const results = [];
        for (let i = 0; i < dataRows.length; i++) {
            const cols = splitCSVRow(dataRows[i]);
            const name = getCol(cols, 'name');
            const sku = getCol(cols, 'sku');
            const category = getCol(cols, 'category');
            const description = getCol(cols, 'description');
            const stepsRaw = getCol(cols, 'steps');
            const steps = parseStepsFromCSV(stepsRaw);

            if (!name) {
                results.push({ row: i + 2, name: '(empty)', status: 'failed', error: 'Name is required' });
                setCsvProgress({ current: i + 1, total: dataRows.length });
                continue;
            }

            try {
                await api.post('/inventory/products', {
                    name,
                    sku: sku || undefined,
                    category: category || undefined,
                    description: description || undefined,
                    steps: steps.length > 0 ? steps : undefined,
                    images: [] // Enforce empty image array for CSV imports
                });
                results.push({ row: i + 2, name, status: 'success' });
            } catch (err) {
                const errMsg = err?.response?.data?.message || err.message || 'Unknown error';
                results.push({ row: i + 2, name, status: 'failed', error: errMsg });
            }
            setCsvProgress({ current: i + 1, total: dataRows.length });
        }

        setCsvUploading(false);
        setUploadReport({ results });
        fetchData();
    };
    // --- End Bulk CSV Upload ---

    // --- Edit Product State ---
    const [showEditModal, setShowEditModal] = useState(false);
    const [editProduct, setEditProduct] = useState(null);

    const openEditModal = (product) => {
        setEditProduct({
            _id: product._id,
            name: product.name || '',
            sku: product.sku || '',
            category: product.category || '',
            description: product.description || '',
            images: product.images || [],
            steps: product.steps ? product.steps.map(s => ({ ...s })) : [],
        });
        setShowEditModal(true);
    };

    const saveEditProduct = async () => {
        try {
            await api.put(`/inventory/products/${editProduct._id}`, editProduct);
            setShowEditModal(false);
            setEditProduct(null);
            fetchData();
        } catch (e) {
            alert('Error updating product: ' + (e?.response?.data?.message || e.message));
        }
    };

    const addEditStep = () => {
        setEditProduct(prev => ({
            ...prev,
            steps: [...prev.steps, {
                title: '',
                description: '',
                sequence: prev.steps.length + 1,
                requiredPhotos: ['after'],
            }],
        }));
    };

    const removeEditStep = (idx) => {
        setEditProduct(prev => ({
            ...prev,
            steps: prev.steps.filter((_, i) => i !== idx).map((s, i) => ({ ...s, sequence: i + 1 })),
        }));
    };

    const updateEditStep = (idx, field, value) => {
        setEditProduct(prev => {
            const steps = [...prev.steps];
            steps[idx] = { ...steps[idx], [field]: value };
            return { ...prev, steps };
        });
    };

    const toggleEditStepPhoto = (idx, photo) => {
        setEditProduct(prev => {
            const steps = [...prev.steps];
            const photos = steps[idx].requiredPhotos || [];
            steps[idx] = {
                ...steps[idx],
                requiredPhotos: photos.includes(photo)
                    ? photos.filter(p => p !== photo)
                    : [...photos, photo],
            };
            return { ...prev, steps };
        });
    };
    // --- End Edit Product ---

    // --- Filters, Sort, Pagination ---
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [stockFilter, setStockFilter] = useState('all'); // 'all' | 'low' | 'in'
    const [sortBy, setSortBy] = useState('name_asc'); // 'name_asc' | 'name_desc' | 'stock_asc' | 'stock_desc'
    const [currentPage, setCurrentPage] = useState(1);
    const PAGE_SIZE = 10;

    const uniqueCategories = [...new Set(products.map(p => p.category).filter(Boolean))];

    const filteredProducts = products
        .filter(p => {
            const q = searchTerm.toLowerCase();
            const matchSearch = p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
            const matchCategory = categoryFilter === 'all' || p.category === categoryFilter;
            const matchStock = stockFilter === 'all'
                ? true
                : stockFilter === 'low' ? p.totalStock < 10 : p.totalStock >= 10;
            return matchSearch && matchCategory && matchStock;
        })
        .sort((a, b) => {
            if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
            if (sortBy === 'name_desc') return b.name.localeCompare(a.name);
            if (sortBy === 'stock_asc') return a.totalStock - b.totalStock;
            if (sortBy === 'stock_desc') return b.totalStock - a.totalStock;
            return 0;
        });

    const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
    const paginatedProducts = filteredProducts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    const resetPage = () => setCurrentPage(1);

    // Delete product
    const [deletingId, setDeletingId] = useState(null);
    const handleDeleteProduct = async (product) => {
        if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
        setDeletingId(product._id);
        try {
            await api.delete(`/inventory/products/${product._id}`);
            fetchData();
        } catch (e) {
            alert('Error deleting product: ' + (e?.response?.data?.message || e.message));
        } finally {
            setDeletingId(null);
        }
    };
    // ---

    if (pageLoading) return <PageLoader text="Loading inventory..." />;

    return (
        <div className="flex flex-col gap-3">
            {/* Sticky header */}
            <div className="sticky top-0 z-10 bg-gray-50 pb-2 space-y-2">
                {/* Title row */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                        <h1 className="text-lg font-bold text-gray-900 leading-tight">Inventory Management</h1>
                        <p className="text-gray-400 text-xs mt-0.5">Manage products, warehouses, and stock levels.</p>
                    </div>

                    {currentUser?.role !== 'admin_viewer' && (
                        <div className="flex flex-wrap gap-1.5">
                            <button
                                onClick={() => { setActiveTab('products'); setShowProductModal(true); }}
                                className="flex items-center gap-1.5 bg-primary text-white px-3 py-3 rounded-md font-bold text-xs shadow-md shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                            >
                                <Plus size={13} /> New Product
                            </button>
                            <Link
                                to="/purchase-orders"
                                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-3 rounded-md font-bold text-xs shadow-md shadow-emerald-200 transition-all"
                            >
                                <ShoppingCart size={13} /> Create PO
                            </Link>
                            <button
                                onClick={() => setShowTransferStockModal(true)}
                                className="flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-3 py-3 rounded-md font-bold text-xs shadow-sm transition-all"
                            >
                                <Package size={13} /> Transfer
                            </button>
                            <button
                                onClick={() => { setActiveTab('warehouses'); setShowWarehouseModal(true); }}
                                className="flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-3 py-3 rounded-md font-bold text-xs shadow-sm transition-all"
                            >
                                <Plus size={13} /> Warehouse
                            </button>
                            <button
                                onClick={downloadTemplate}
                                className="flex items-center gap-1.5 bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 px-3 py-3 rounded-md text-xs shadow-sm transition-all"
                                title="Download CSV Template"
                            >
                                <Download size={13} /> CSV Template
                            </button>
                            <button
                                onClick={() => csvInputRef.current?.click()}
                                disabled={csvUploading}
                                className="flex items-center gap-1.5 bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 px-3 py-3 rounded-md text-xs shadow-sm transition-all disabled:opacity-50"
                                title="Bulk Upload via CSV"
                            >
                                {csvUploading
                                    ? <><Loader2 size={13} className="animate-spin" /> {csvProgress.current}/{csvProgress.total}</>
                                    : <><Upload size={13} /> Bulk Upload</>}
                            </button>
                            <input ref={csvInputRef} type="file" accept=".csv" className="hidden" onChange={handleCSVUpload} />
                        </div>
                    )}
                </div>

                {/* Tabs */}
                <div className="flex border-b overflow-x-auto scrollbar-none">
                    {[
                        { key: 'products', label: `Products (${products.length})` },
                        { key: 'warehouses', label: `Warehouses (${warehouses.length})` },
                        { key: 'logs', label: 'Stock History' },
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`px-4 py-2.5 text-xs font-bold transition-all whitespace-nowrap ${activeTab === tab.key ? 'border-b-2 border-primary text-primary' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Filters — products tab only */}
                {activeTab === 'products' && (
                    <div className="flex gap-2 flex-wrap">
                        <div className="relative flex-1 min-w-[140px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                            <input
                                type="text"
                                placeholder="Search name or SKU..."
                                className="w-full pl-8 pr-3 py-3 border border-gray-200 rounded-md bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-xs shadow-sm"
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); resetPage(); }}
                            />
                        </div>
                        <CustomSelect
                            value={categoryFilter}
                            onChange={(val) => { setCategoryFilter(val); resetPage(); }}
                            options={[
                                { value: 'all', label: 'All Categories' },
                                ...uniqueCategories.map(c => ({ value: c, label: c }))
                            ]}
                        />
                        <CustomSelect
                            value={stockFilter}
                            onChange={(val) => { setStockFilter(val); resetPage(); }}
                            options={[
                                { value: 'all', label: 'All Stock' },
                                { value: 'in', label: 'In Stock' },
                                { value: 'low', label: 'Low Stock' },
                            ]}
                        />
                        <CustomSelect
                            value={sortBy}
                            onChange={(val) => { setSortBy(val); resetPage(); }}
                            options={[
                                { value: 'name_asc', label: 'Name A→Z' },
                                { value: 'name_desc', label: 'Name Z→A' },
                                { value: 'stock_desc', label: 'Stock ↓' },
                                { value: 'stock_asc', label: 'Stock ↑' },
                            ]}
                        />
                        <span className="text-xs text-gray-400 self-center whitespace-nowrap">{filteredProducts.length} results</span>
                    </div>
                )}
            </div>

            {activeTab === 'products' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-auto" style={{ maxHeight: 'calc(100dvh - 280px)' }}>
                        <table className="w-full">
                            <thead>
                                <tr className="text-left bg-gray-50 border-b">
                                    <th className="sticky top-0 bg-gray-50 p-3 text-xs font-bold text-gray-400 uppercase tracking-wider w-8">#</th>
                                    <th className="sticky top-0 bg-gray-50 p-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-center w-10">Img</th>
                                    <th className="sticky top-0 bg-gray-50 p-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
                                    <th className="sticky top-0 bg-gray-50 p-3 text-xs font-bold text-gray-500 uppercase tracking-wider hidden sm:table-cell">SKU</th>
                                    <th className="sticky top-0 bg-gray-50 p-3 text-xs font-bold text-gray-500 uppercase tracking-wider hidden md:table-cell">Category</th>
                                    <th className="sticky top-0 bg-gray-50 p-3 text-xs font-bold text-gray-500 uppercase tracking-wider hidden md:table-cell">Steps</th>
                                    <th className="sticky top-0 bg-gray-50 p-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Stock</th>
                                    <th className="sticky top-0 bg-gray-50 p-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-center hidden sm:table-cell">Status</th>
                                    <th className="sticky top-0 bg-gray-50 p-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {paginatedProducts.length > 0 ? (
                                    paginatedProducts.map((p, idx) => {
                                        const isLowStock = p.totalStock < 10;
                                        const globalIdx = (currentPage - 1) * PAGE_SIZE + idx + 1;
                                        return (
                                            <tr key={p._id} className={`hover:bg-gray-50 transition-colors ${isLowStock ? 'bg-red-50/50 hover:bg-red-50' : ''}`}>
                                                <td className="p-3 text-xs text-gray-400 font-mono">{globalIdx}</td>
                                                <td className="p-3 text-center">
                                                    <div className="w-8 h-8 mx-auto rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden">
                                                        {p.images?.[0] ? (
                                                            <img
                                                                src={getImageUrl(p.images[0])}
                                                                alt={p.name}
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/32x32?text=?'; }}
                                                            />
                                                        ) : (
                                                            <Package size={14} className="text-gray-300" />
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-3">
                                                    <div className="font-semibold text-gray-800 text-sm truncate max-w-[120px] sm:max-w-none">{p.name}</div>
                                                    {p.description && (
                                                        <div className="text-xs text-gray-400 mt-0.5 max-w-[120px] sm:max-w-xs truncate">{p.description}</div>
                                                    )}
                                                </td>
                                                <td className="p-3 text-gray-500 font-mono text-xs hidden sm:table-cell">{p.sku || '—'}</td>
                                                <td className="p-3 hidden md:table-cell">
                                                    {p.category ? (
                                                        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-wider border border-primary/20">
                                                            {p.category}
                                                        </span>
                                                    ) : <span className="text-gray-300 text-xs">—</span>}
                                                </td>
                                                <td className="p-3 hidden md:table-cell">
                                                    {p.steps?.length > 0 ? (
                                                        <span className="inline-flex items-center gap-1 text-[10px] text-primary font-black">
                                                            <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">{p.steps.length}</span>
                                                            steps
                                                        </span>
                                                    ) : <span className="text-gray-300 text-xs">—</span>}
                                                </td>
                                                <td className={`p-3 text-right font-bold text-sm ${isLowStock ? 'text-red-600' : 'text-gray-700'}`}>
                                                    {p.totalStock}
                                                </td>
                                                <td className="p-3 text-center hidden sm:table-cell">
                                                    {isLowStock ? (
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full border border-red-200 whitespace-nowrap">
                                                            <AlertTriangle size={10} /> Low
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-200 whitespace-nowrap">
                                                            <CheckCircle size={10} /> OK
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-3">
                                                    {currentUser?.role !== 'admin_viewer' ? (
                                                        <div className="flex items-center justify-end gap-1">
                                                            <Link
                                                                to={`/inventory/product/${p._id}`}
                                                                className="p-1.5 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-all"
                                                                title="Details"
                                                            >
                                                                <Eye size={14} />
                                                            </Link>
                                                            <button
                                                                onClick={() => openEditModal(p)}
                                                                className="p-1.5 text-primary bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-lg transition-all"
                                                                title="Edit"
                                                            >
                                                                <Pencil size={14} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteProduct(p)}
                                                                disabled={deletingId === p._id}
                                                                className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors disabled:opacity-50"
                                                                title="Delete"
                                                            >
                                                                {deletingId === p._id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="text-right text-gray-400 text-xs italic">View</div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="9" className="p-10 text-center">
                                            <Package size={36} className="text-gray-200 mx-auto mb-2" />
                                            <div className="text-gray-400 font-medium text-sm">No products found</div>
                                            <div className="text-gray-300 text-xs mt-1">Try adjusting your search or filters</div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination footer */}
                    <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
                        <div className="text-sm text-gray-500">
                            Showing <span className="font-semibold text-gray-700">{Math.min((currentPage - 1) * PAGE_SIZE + 1, filteredProducts.length)}</span>–<span className="font-semibold text-gray-700">{Math.min(currentPage * PAGE_SIZE, filteredProducts.length)}</span> of <span className="font-semibold text-gray-700">{filteredProducts.length}</span> products
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setCurrentPage(1)}
                                disabled={currentPage === 1}
                                className="px-2 py-1 text-xs border rounded disabled:opacity-40 hover:bg-gray-100"
                            >«</button>
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1 text-xs border rounded disabled:opacity-40 hover:bg-gray-100"
                            >Prev</button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter(n => n === 1 || n === totalPages || Math.abs(n - currentPage) <= 1)
                                .reduce((acc, n, i, arr) => {
                                    if (i > 0 && n - arr[i - 1] > 1) acc.push('...');
                                    acc.push(n);
                                    return acc;
                                }, [])
                                .map((item, i) => (
                                    item === '...'
                                        ? <span key={`ellipsis-${i}`} className="px-2 text-gray-400 text-xs">...</span>
                                        : <button
                                            key={item}
                                            onClick={() => setCurrentPage(item)}
                                            className={`px-3 py-1 text-xs border rounded transition-all font-bold ${currentPage === item
                                                ? 'bg-primary text-white border-primary shadow-sm shadow-primary/20'
                                                : 'hover:bg-primary/5 text-gray-600 border-gray-200'
                                                }`}
                                        >{item}</button>
                                ))}
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 text-xs border rounded disabled:opacity-40 hover:bg-gray-100"
                            >Next</button>
                            <button
                                onClick={() => setCurrentPage(totalPages)}
                                disabled={currentPage === totalPages}
                                className="px-2 py-1 text-xs border rounded disabled:opacity-40 hover:bg-gray-100"
                            >»</button>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'warehouses' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Array.isArray(warehouses) && warehouses.map(w => (
                        <div key={w._id} className="bg-white p-6 rounded shadow flex flex-col gap-4">
                            <div className="flex items-center gap-4">
                                <div className="p-4 bg-gray-100 rounded-full">
                                    <Package className="text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold">{w.name}</h3>
                                    <p className="text-gray-500">{w.location}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setSelectedWarehouse(w);
                                    setShowWarehouseStockModal(true);
                                }}
                                className="mt-2 w-full py-2.5 bg-primary/10 text-primary font-black uppercase tracking-wider rounded-lg hover:bg-primary/20 border border-primary/30 transition-all text-[10px]"
                            >
                                View Stock
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'logs' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden p-4">
                    <div className="overflow-auto" style={{ maxHeight: 'calc(100dvh - 280px)' }}>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left bg-gray-50">
                                    <th className="sticky top-0 bg-gray-50 p-3">Date</th>
                                    <th className="sticky top-0 bg-gray-50 p-3">Product</th>
                                    <th className="sticky top-0 bg-gray-50 p-3">Action</th>
                                    <th className="sticky top-0 bg-gray-50 p-3">Warehouse</th>
                                    <th className="sticky top-0 bg-gray-50 p-3">Qty</th>
                                    <th className="sticky top-0 bg-gray-50 p-3">Reason</th>
                                    <th className="sticky top-0 bg-gray-50 p-3">User</th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* We typically need to fetch logs here or on tab change. For MVP assume fetched. 
                                    Actually we need to add logs fetch. I'll add useEffect or fetch in handleLogsTab.
                                    For now, I'll render empty or add a fetch call.
                                */}

                                {logs.map((log) => (
                                    <tr key={log._id} className="border-t">
                                        <td className="p-3 text-gray-500">{new Date(log.createdAt).toLocaleDateString()}</td>
                                        <td className="p-3 font-medium">{log.product?.name || 'Unknown'}</td>
                                        <td className={`p-3 font-bold ${log.action === 'IN' ? 'text-green-600' : 'text-red-600'}`}>{log.action}</td>
                                        <td className="p-3 text-gray-500">{log.warehouse?.name || '-'}</td>
                                        <td className="p-3">
                                            {log.quantity}
                                            {log.referenceWorkOrder && (
                                                <div className="text-[10px] text-primary font-bold mt-0.5">
                                                    #{log.referenceWorkOrder.workOrderNumber}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-3 text-gray-600">{log.reason}</td>
                                        <td className="p-3 text-gray-500">{log.performedBy?.name || 'Admin'}</td>
                                    </tr>
                                ))}
                                {logs.length === 0 && (
                                    <tr><td colSpan="7" className="p-4 text-center text-gray-400">No logs found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Product Modal */}
            {showProductModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
                        {/* Fixed Header */}
                        <div className="p-6 border-b shrink-0">
                            <h3 className="text-xl font-bold">Add Product</h3>
                        </div>

                        {/* Scrollable Body */}
                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                            <div className="grid grid-cols-2 gap-4">
                                <input className="border p-2 mb-2 rounded text-sm" placeholder="Name" onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} />
                                <input className="border p-2 mb-2 rounded text-sm" placeholder="SKU" onChange={e => setNewProduct({ ...newProduct, sku: e.target.value })} />
                            </div>
                            <input className="w-full border p-2 mb-2 rounded text-sm" placeholder="Category" onChange={e => setNewProduct({ ...newProduct, category: e.target.value })} />
                            <textarea className="w-full border p-2 mb-2 rounded text-sm" placeholder="Description" onChange={e => setNewProduct({ ...newProduct, description: e.target.value })} />

                            {/* Image Upload / URL Section */}
                            <div className="mt-4 border-t pt-4">
                                <label className="block text-sm font-bold mb-2 uppercase text-gray-500 tracking-wider text-[10px]">Product Gallery</label>

                                <div className="flex flex-col gap-4">
                                    {/* Preview Gallery */}
                                    <div className="w-full min-h-[120px] bg-gray-50 rounded-xl border border-dashed border-gray-200 p-4 flex flex-wrap gap-3 overflow-y-auto max-h-60">
                                        {(newProduct.images || []).map((url, idx) => (
                                            <div key={idx} className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200 bg-white group shadow-sm">
                                                <img
                                                    src={getImageUrl(url)}
                                                    alt={`Preview ${idx}`}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/100x100?text=Error'; }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const images = newProduct.images.filter((_, i) => i !== idx);
                                                        setNewProduct({ ...newProduct, images });
                                                    }}
                                                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        ))}
                                        {(!newProduct.images || newProduct.images.length === 0) && (
                                            <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-400 min-h-[100px]">
                                                {isUploadingImage ? <Loader2 size={24} className="animate-spin text-primary" /> : <Package size={32} />}
                                                <span className="text-[10px] font-bold uppercase tracking-widest">{isUploadingImage ? 'Uploading...' : 'No images added'}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-2">
                                        <div className="flex-1">
                                            <input
                                                type="file"
                                                id="product-image-new"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={(e) => handleImageUpload(e.target.files[0], 'new')}
                                            />
                                            <label
                                                htmlFor="product-image-new"
                                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer border border-gray-200"
                                            >
                                                <Upload size={14} /> Upload File
                                            </label>
                                        </div>
                                        <div className="flex-[2] relative">
                                            <input
                                                className="w-full border border-gray-200 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all pl-8"
                                                placeholder="Paste Image URL and press Enter"
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter' && e.target.value.trim()) {
                                                        e.preventDefault();
                                                        setNewProduct({ ...newProduct, images: [...(newProduct.images || []), e.target.value.trim()] });
                                                        e.target.value = '';
                                                    }
                                                }}
                                            />
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔗</span>
                                        </div>
                                    </div>
                                    <p className="text-[9px] text-gray-400 italic font-medium px-1">* Uploaded files and pasted URLs will be added to the gallery.</p>
                                </div>
                            </div>

                            {/* Initial Stock Section */}
                            <div className="mt-4 border-t pt-4">
                                <label className="block text-sm font-bold mb-2">Initial Stock (Optional)</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormSelect
                                        value={newProduct.initialStock.warehouseId}
                                        onChange={(val) => setNewProduct({
                                            ...newProduct,
                                            initialStock: { ...newProduct.initialStock, warehouseId: val }
                                        })}
                                        options={warehouses.map(w => ({ value: w._id, label: w.name }))}
                                        placeholder="Select Warehouse"
                                    />
                                    <input
                                        type="number"
                                        className="border p-2 rounded text-sm"
                                        placeholder="Initial Quantity"
                                        value={newProduct.initialStock.quantity}
                                        onChange={e => setNewProduct({
                                            ...newProduct,
                                            initialStock: { ...newProduct.initialStock, quantity: e.target.value }
                                        })}
                                    />
                                </div>
                            </div>

                            <div className="mt-4 border-t pt-4">
                                <label className="block text-sm font-bold mb-2">Process Steps (Tasks)</label>
                                <p className="text-xs text-gray-500 mb-2">Define the lifecycle tasks for this product (e.g. Manufacture, Deliver, Install)</p>

                                {(newProduct.steps || []).map((step, idx) => (
                                    <div key={idx} className="bg-gray-50 p-3 rounded mb-2 border">
                                        <div className="flex justify-between mb-2">
                                            <span className="font-bold text-sm">Step {idx + 1}</span>
                                            <button
                                                onClick={() => {
                                                    const steps = newProduct.steps.filter((_, i) => i !== idx);
                                                    setNewProduct({ ...newProduct, steps });
                                                }}
                                                className="text-red-500"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                        <input
                                            className="w-full border p-2 rounded mb-1 text-sm"
                                            placeholder="Task Title (e.g. Install Benches)"
                                            value={step.title}
                                            onChange={e => {
                                                const steps = [...(newProduct.steps || [])];
                                                steps[idx].title = e.target.value;
                                                setNewProduct({ ...newProduct, steps });
                                            }}
                                        />
                                        <input
                                            className="w-full border p-2 rounded mb-1 text-sm"
                                            placeholder="Description / Instructions"
                                            value={step.description}
                                            onChange={e => {
                                                const steps = [...(newProduct.steps || [])];
                                                steps[idx].description = e.target.value;
                                                setNewProduct({ ...newProduct, steps });
                                            }}
                                        />
                                        <div className="flex gap-2 items-center mt-1">
                                            <label className="text-xs font-bold">Req. Photos:</label>
                                            <label className="flex items-center gap-1 text-xs">
                                                <input
                                                    type="checkbox"
                                                    checked={step.requiredPhotos?.includes('before')}
                                                    onChange={e => {
                                                        const steps = [...newProduct.steps];
                                                        let photos = steps[idx].requiredPhotos || [];
                                                        if (e.target.checked) photos = [...photos, 'before'];
                                                        else photos = photos.filter(p => p !== 'before');
                                                        steps[idx].requiredPhotos = photos;
                                                        setNewProduct({ ...newProduct, steps });
                                                    }}
                                                /> Before
                                            </label>
                                            <label className="flex items-center gap-1 text-xs">
                                                <input
                                                    type="checkbox"
                                                    checked={step.requiredPhotos?.includes('after')}
                                                    onChange={e => {
                                                        const steps = [...newProduct.steps];
                                                        let photos = steps[idx].requiredPhotos || [];
                                                        if (e.target.checked) photos = [...photos, 'after'];
                                                        else photos = photos.filter(p => p !== 'after');
                                                        steps[idx].requiredPhotos = photos;
                                                        setNewProduct({ ...newProduct, steps });
                                                    }}
                                                /> After
                                            </label>
                                        </div>
                                    </div>
                                ))}
                                <button
                                    onClick={() => setNewProduct({
                                        ...newProduct,
                                        steps: [...(newProduct.steps || []), {
                                            title: '',
                                            description: '',
                                            sequence: (newProduct.steps?.length || 0) + 1,
                                            requiredPhotos: ['after']
                                        }]
                                    })}
                                    className="text-sm text-primary flex items-center gap-1 mt-2 font-bold"
                                >
                                    <Plus size={16} /> Add Process Step
                                </button>
                            </div>
                        </div>

                        {/* Fixed Footer */}
                        <div className="p-6 border-t shrink-0 flex justify-end gap-2 bg-gray-50/50">
                            <button onClick={() => setShowProductModal(false)} className="px-6 py-2 border rounded font-bold hover:bg-gray-100 transition-colors">Cancel</button>
                            <button onClick={createProduct} className="px-6 py-2 bg-primary text-white rounded font-bold shadow-lg shadow-primary/20 hover:bg-opacity-90 transition-all">Save Product</button>
                        </div>
                    </div>
                </div>
            )}


            {/* Warehouse Modal */}
            {showWarehouseModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
                    <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md">
                        <h3 className="text-xl font-bold mb-4">Add Warehouse</h3>
                        <input className="w-full border p-2 mb-2 rounded" placeholder="Name" onChange={e => setNewWarehouse({ ...newWarehouse, name: e.target.value })} />
                        <input className="w-full border p-2 mb-2 rounded" placeholder="Location" onChange={e => setNewWarehouse({ ...newWarehouse, location: e.target.value })} />
                        <div className="flex justify-end gap-2 mt-4">
                            <button onClick={() => setShowWarehouseModal(false)} className="px-4 py-2 border rounded">Cancel</button>
                            <button onClick={createWarehouse} className="px-4 py-2 bg-primary text-white rounded">Save</button>
                        </div>
                    </div>
                </div>
            )}


            {showTransferStockModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[100] overflow-y-auto">
                    <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md animate-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                                <Package size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Transfer Stock</h3>
                                <p className="text-xs text-gray-400">Move inventory between warehouses.</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <FormSelect
                                label="Select Product"
                                placeholder="Choose product to transfer"
                                icon={Package}
                                value={transferData.productId}
                                onChange={(val) => setTransferData({ ...transferData, productId: val })}
                                options={products.map(p => ({
                                    value: p._id,
                                    label: p.name,
                                    sublabel: `SKU: ${p.sku || '—'} | Global: ${p.totalStock}`
                                }))}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <FormSelect
                                    label="From Warehouse"
                                    placeholder="Source"
                                    icon={Warehouse}
                                    value={transferData.fromWarehouseId}
                                    onChange={(val) => setTransferData({ ...transferData, fromWarehouseId: val })}
                                    options={warehouses.map(w => {
                                        const productInWh = products.find(p => p._id === transferData.productId);
                                        const qty = productInWh?.stock?.find(s => (s.warehouse?._id || s.warehouse) === w._id)?.quantity || 0;
                                        return {
                                            value: w._id,
                                            label: w.name,
                                            sublabel: `Current Stock: ${qty} | ${w.location}`
                                        };
                                    })}
                                />
                                <FormSelect
                                    label="To Warehouse"
                                    placeholder="Destination"
                                    icon={Warehouse}
                                    value={transferData.toWarehouseId}
                                    onChange={(val) => setTransferData({ ...transferData, toWarehouseId: val })}
                                    options={warehouses.map(w => {
                                        const productInWh = products.find(p => p._id === transferData.productId);
                                        const qty = productInWh?.stock?.find(s => (s.warehouse?._id || s.warehouse) === w._id)?.quantity || 0;
                                        return {
                                            value: w._id,
                                            label: w.name,
                                            sublabel: `Current Stock: ${qty} | ${w.location}`,
                                            disabled: w._id === transferData.fromWarehouseId
                                        };
                                    })}
                                />
                            </div>

                            {/* Stock Availability Info */}
                            {transferData.productId && transferData.fromWarehouseId && (() => {
                                const sourceStock = products.find(p => p._id === transferData.productId)?.stock?.find(s => (s.warehouse?._id || s.warehouse) === transferData.fromWarehouseId)?.quantity || 0;
                                const isOverLimit = Number(transferData.quantity) > sourceStock;

                                return (
                                    <>
                                        <div className={`border rounded-xl p-3 flex items-center justify-between transition-colors ${sourceStock === 0 ? 'bg-red-50 border-red-100' : 'bg-primary/5 border-primary/10'}`}>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${sourceStock === 0 ? 'bg-red-500' : 'bg-primary animate-pulse'}`} />
                                                <span className={`text-xs font-bold uppercase tracking-wider ${sourceStock === 0 ? 'text-red-500' : 'text-primary'}`}>
                                                    Available in Source
                                                </span>
                                            </div>
                                            <span className={`text-lg font-black ${sourceStock === 0 ? 'text-red-600' : 'text-primary'}`}>
                                                {sourceStock}
                                            </span>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide ml-1 mb-1.5">
                                                Transfer Quantity
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    className={`w-full border p-3 pl-10 rounded-xl text-sm outline-none transition-all ${isOverLimit ? 'border-red-300 ring-2 ring-red-100' : 'border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary'}`}
                                                    placeholder="Enter amount to move"
                                                    value={transferData.quantity}
                                                    onChange={e => setTransferData({ ...transferData, quantity: e.target.value })}
                                                />
                                                <Plus className={`absolute left-3 top-1/2 -translate-y-1/2 ${isOverLimit ? 'text-red-400' : 'text-gray-400'}`} size={18} />
                                            </div>
                                            {isOverLimit && (
                                                <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider mt-1.5 ml-1 animate-pulse">
                                                    ⚠️ Insufficient stock for this transfer
                                                </p>
                                            )}
                                        </div>
                                    </>
                                );
                            })()}
                        </div>

                        <div className="flex justify-end gap-3 mt-8">
                            <button
                                onClick={() => { setShowTransferStockModal(false); resetTransferForm(); }}
                                className="flex-1 py-3 text-sm font-bold text-gray-500 hover:bg-gray-50 rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleTransferStock}
                                disabled={(() => {
                                    const sourceStock = products.find(p => p._id === transferData.productId)?.stock?.find(s => (s.warehouse?._id || s.warehouse) === transferData.fromWarehouseId)?.quantity || 0;
                                    return !transferData.productId || !transferData.fromWarehouseId || !transferData.toWarehouseId || !transferData.quantity || Number(transferData.quantity) > sourceStock || Number(transferData.quantity) <= 0;
                                })()}
                                className="flex-[2] py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale disabled:scale-100"
                            >
                                Confirm Transfer
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Warehouse Stock Modal */}
            {showWarehouseStockModal && selectedWarehouse && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
                    <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-3xl h-[80vh] flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h3 className="text-xl font-bold">Stock in {selectedWarehouse.name}</h3>
                                <p className="text-gray-500 text-sm">{selectedWarehouse.location}</p>
                            </div>
                            <button onClick={() => setShowWarehouseStockModal(false)} className="text-gray-500 hover:text-gray-700">
                                <Trash2 size={24} className="rotate-45" /> {/* Close Icon hack */}
                            </button>
                        </div>

                        <div className="flex-1 overflow-auto">
                            <div className="overflow-x-auto h-full">
                                <table className="w-full">
                                    <thead className="sticky top-0 bg-white shadow-sm z-10">
                                        <tr className="text-left bg-gray-50 border-b">
                                            <th className="p-3">Product Name</th>
                                            <th className="p-3">Category</th>
                                            <th className="p-3 text-right">Quantity Available</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {products.filter(p => p.stock.some(s => (s.warehouse?._id || s.warehouse) === selectedWarehouse._id && s.quantity > 0))
                                            .map(p => {
                                                const stockEntry = p.stock.find(s => (s.warehouse?._id || s.warehouse) === selectedWarehouse._id);
                                                return (
                                                    <tr key={p._id} className="border-b hover:bg-gray-50">
                                                        <td className="p-3 font-medium">{p.name}</td>
                                                        <td className="p-3 text-gray-500 text-sm">{p.category}</td>
                                                        <td className="p-3 text-right font-black text-primary">{stockEntry?.quantity || 0}</td>
                                                    </tr>
                                                );
                                            })}
                                        {products.filter(p => p.stock.some(s => s.warehouse === selectedWarehouse._id && s.quantity > 0)).length === 0 && (
                                            <tr>
                                                <td colSpan="3" className="p-8 text-center text-gray-400">
                                                    No stock currently in this warehouse.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="flex justify-end mt-4 pt-4 border-t">
                            <button onClick={() => setShowWarehouseStockModal(false)} className="px-6 py-2 bg-gray-200 rounded hover:bg-gray-300 font-bold">Close</button>
                        </div>
                    </div>
                </div>
            )}
            {/* Upload Report Modal */}
            {uploadReport && (() => {
                const succeeded = uploadReport.results.filter(r => r.status === 'success').length;
                const failed = uploadReport.results.filter(r => r.status === 'failed').length;
                return (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
                        <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
                            <h3 className="text-xl font-bold mb-1">📊 Upload Report</h3>
                            <p className="text-sm text-gray-500 mb-4">
                                {uploadReport.results.length} rows processed
                            </p>

                            {/* Summary badges */}
                            <div className="flex gap-3 mb-4">
                                <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 font-bold rounded-full text-sm">
                                    <CheckCircle size={15} /> {succeeded} Succeeded
                                </span>
                                <span className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 font-bold rounded-full text-sm">
                                    <XCircle size={15} /> {failed} Failed
                                </span>
                            </div>

                            {/* Results Table */}
                            <div className="flex-1 overflow-auto border rounded">
                                <table className="w-full text-sm">
                                    <thead className="sticky top-0 bg-gray-50">
                                        <tr className="text-left border-b">
                                            <th className="p-3 text-xs font-bold text-gray-500 uppercase">Row</th>
                                            <th className="p-3 text-xs font-bold text-gray-500 uppercase">Product Name</th>
                                            <th className="p-3 text-xs font-bold text-gray-500 uppercase">Status</th>
                                            <th className="p-3 text-xs font-bold text-gray-500 uppercase">Error</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {uploadReport.results.map((r, i) => (
                                            <tr key={i} className={r.status === 'failed' ? 'bg-red-50' : ''}>
                                                <td className="p-3 text-gray-400 font-mono">{r.row}</td>
                                                <td className="p-3 font-medium text-gray-800">{r.name}</td>
                                                <td className="p-3">
                                                    {r.status === 'success'
                                                        ? <span className="flex items-center gap-1 text-green-600 font-bold"><CheckCircle size={14} /> Success</span>
                                                        : <span className="flex items-center gap-1 text-red-600 font-bold"><XCircle size={14} /> Failed</span>}
                                                </td>
                                                <td className="p-3 text-red-500 text-xs">{r.error || '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="flex justify-end mt-4 pt-4 border-t">
                                <button
                                    onClick={() => setUploadReport(null)}
                                    className="px-6 py-2 bg-primary hover:bg-opacity-90 text-white font-bold rounded shadow-lg shadow-primary/20 transition-all"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}
            {/* Edit Product Modal */}
            {showEditModal && editProduct && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
                        {/* Fixed Header */}
                        <div className="p-6 border-b shrink-0">
                            <h3 className="text-xl font-bold">✏️ Edit Product</h3>
                        </div>

                        {/* Scrollable Body */}
                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                            {/* Basic Details */}
                            <div className="grid grid-cols-2 gap-3 mb-3">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">Name *</label>
                                    <input
                                        className="w-full border p-2 mt-1 rounded text-sm"
                                        value={editProduct.name}
                                        onChange={e => setEditProduct({ ...editProduct, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">SKU</label>
                                    <input
                                        className="w-full border p-2 mt-1 rounded text-sm"
                                        value={editProduct.sku}
                                        onChange={e => setEditProduct({ ...editProduct, sku: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="mb-3">
                                <label className="text-xs font-bold text-gray-500 uppercase">Category</label>
                                <input
                                    className="w-full border p-2 mt-1 rounded text-sm"
                                    value={editProduct.category}
                                    onChange={e => setEditProduct({ ...editProduct, category: e.target.value })}
                                />
                            </div>
                            <div className="mb-4">
                                <label className="text-xs font-bold text-gray-500 uppercase">Description</label>
                                <textarea
                                    className="w-full border p-2 mt-1 rounded text-sm"
                                    rows={2}
                                    value={editProduct.description}
                                    onChange={e => setEditProduct({ ...editProduct, description: e.target.value })}
                                />
                            </div>

                            {/* Image Upload / URL Section (Edit) */}
                            <div className="mb-6 border-t pt-4">
                                <label className="block text-sm font-bold mb-2 uppercase text-gray-500 tracking-wider text-[10px]">Product Gallery</label>

                                <div className="flex flex-col gap-4">
                                    {/* Preview Gallery */}
                                    <div className="w-full min-h-[120px] bg-gray-50 rounded-xl border border-dashed border-gray-200 p-4 flex flex-wrap gap-3 overflow-y-auto max-h-60">
                                        {(editProduct.images || []).map((url, idx) => (
                                            <div key={idx} className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200 bg-white group shadow-sm">
                                                <img
                                                    src={getImageUrl(url)}
                                                    alt={`Preview ${idx}`}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/100x100?text=Error'; }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const images = editProduct.images.filter((_, i) => i !== idx);
                                                        setEditProduct({ ...editProduct, images });
                                                    }}
                                                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        ))}
                                        {(!editProduct.images || editProduct.images.length === 0) && (
                                            <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-400 min-h-[100px]">
                                                {isUploadingImage ? <Loader2 size={24} className="animate-spin text-primary" /> : <Package size={32} />}
                                                <span className="text-[10px] font-bold uppercase tracking-widest">{isUploadingImage ? 'Uploading...' : 'No images added'}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-2">
                                        <div className="flex-1">
                                            <input
                                                type="file"
                                                id="product-image-edit"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={(e) => handleImageUpload(e.target.files[0], 'edit')}
                                            />
                                            <label
                                                htmlFor="product-image-edit"
                                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer border border-gray-200"
                                            >
                                                <Upload size={14} /> Upload File
                                            </label>
                                        </div>
                                        <div className="flex-[2] relative">
                                            <input
                                                className="w-full border border-gray-200 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all pl-8"
                                                placeholder="Paste Image URL and press Enter"
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter' && e.target.value.trim()) {
                                                        e.preventDefault();
                                                        setEditProduct({ ...editProduct, images: [...(editProduct.images || []), e.target.value.trim()] });
                                                        e.target.value = '';
                                                    }
                                                }}
                                            />
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔗</span>
                                        </div>
                                    </div>
                                    <p className="text-[9px] text-gray-400 italic font-medium px-1">* Uploaded files and pasted URLs will be added to the gallery.</p>
                                </div>
                            </div>

                            {/* Steps */}
                            <div className="border-t pt-4">
                                <div className="flex justify-between items-center mb-3">
                                    <div>
                                        <label className="block text-sm font-bold">Process Steps (Tasks)</label>
                                        <p className="text-xs text-gray-500">Define lifecycle tasks for this product</p>
                                    </div>
                                    <button
                                        onClick={addEditStep}
                                        className="flex items-center gap-1 text-sm text-primary font-black uppercase tracking-wider hover:text-primary/70 transition-colors"
                                    >
                                        <Plus size={15} /> Add Step
                                    </button>
                                </div>

                                <div className="space-y-3 pr-1">
                                    {editProduct.steps.length === 0 && (
                                        <p className="text-sm text-gray-400 text-center py-4">No steps yet. Click "Add Step" to add one.</p>
                                    )}
                                    {editProduct.steps.map((step, idx) => (
                                        <div key={idx} className="bg-gray-50 p-3 rounded border">
                                            <div className="flex justify-between mb-2">
                                                <span className="text-xs font-bold text-gray-600">Step {idx + 1}</span>
                                                <button onClick={() => removeEditStep(idx)} className="text-red-400 hover:text-red-600">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                            <input
                                                className="w-full border p-2 rounded mb-1 text-sm"
                                                placeholder="Task Title (e.g. Install Benches)"
                                                value={step.title}
                                                onChange={e => updateEditStep(idx, 'title', e.target.value)}
                                            />
                                            <input
                                                className="w-full border p-2 rounded mb-2 text-sm"
                                                placeholder="Description / Instructions"
                                                value={step.description}
                                                onChange={e => updateEditStep(idx, 'description', e.target.value)}
                                            />
                                            <div className="flex gap-3 items-center">
                                                <label className="text-xs font-bold text-gray-500">Req. Photos:</label>
                                                {['before', 'after'].map(photo => (
                                                    <label key={photo} className="flex items-center gap-1 text-xs capitalize cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={(step.requiredPhotos || []).includes(photo)}
                                                            onChange={() => toggleEditStepPhoto(idx, photo)}
                                                        />
                                                        {photo}
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Quick Stock Adjustment Section */}
                            <div className="mt-6 pt-4 border-t">
                                <label className="block text-xs font-black text-primary uppercase tracking-widest mb-3">⚡ Quick Stock Adjustment</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <FormSelect
                                        value={editProduct.stockUpdate?.warehouseId || ''}
                                        onChange={(val) => setEditProduct({
                                            ...editProduct,
                                            stockUpdate: { ...(editProduct.stockUpdate || {}), warehouseId: val }
                                        })}
                                        options={warehouses.map(w => ({ value: w._id, label: w.name }))}
                                        placeholder="Select Warehouse"
                                    />
                                    <input
                                        type="number"
                                        className="w-full border border-gray-200 p-2 rounded text-sm focus:ring-2 focus:ring-primary/10 outline-none"
                                        placeholder="Qty to add (e.g. 500)"
                                        value={editProduct.stockUpdate?.quantity || ''}
                                        onChange={e => setEditProduct({ 
                                            ...editProduct, 
                                            stockUpdate: { ...(editProduct.stockUpdate || {}), quantity: e.target.value } 
                                        })}
                                    />
                                </div>
                                <input
                                    className="w-full border border-gray-200 p-2 mt-2 rounded text-xs focus:ring-2 focus:ring-primary/10 outline-none"
                                    placeholder="Reason for adjustment (e.g. Audit correction)"
                                    value={editProduct.stockUpdate?.reason || ''}
                                    onChange={e => setEditProduct({ 
                                        ...editProduct, 
                                        stockUpdate: { ...(editProduct.stockUpdate || {}), reason: e.target.value } 
                                    })}
                                />
                                <p className="text-[9px] text-gray-400 mt-2 font-medium">
                                    * Use negative numbers to reduce stock (e.g. -50). Adjustments are logged instantly upon saving.
                                </p>
                            </div>
                        </div>

                        {/* Fixed Footer */}
                        <div className="p-6 border-t shrink-0 flex justify-end gap-2 bg-gray-50/50">
                            <button
                                onClick={() => { setShowEditModal(false); setEditProduct(null); }}
                                className="px-6 py-2 border rounded font-bold hover:bg-gray-100 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveEditProduct}
                                className="px-6 py-2 bg-primary text-white rounded font-bold shadow-lg shadow-primary/20 hover:bg-opacity-90 transition-all"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Inventory;
