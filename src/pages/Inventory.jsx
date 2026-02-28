import { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Package, Trash2, Upload, Download, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useRef } from 'react';

const Inventory = () => {
    const [products, setProducts] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [activeTab, setActiveTab] = useState('products'); // 'products' or 'warehouses' or 'logs'
    const [logs, setLogs] = useState([]);

    // Forms
    const [showProductModal, setShowProductModal] = useState(false);
    const [showWarehouseModal, setShowWarehouseModal] = useState(false);
    const [showWarehouseStockModal, setShowWarehouseStockModal] = useState(false);
    const [selectedWarehouse, setSelectedWarehouse] = useState(null);

    const [newProduct, setNewProduct] = useState({ name: '', sku: '', category: '', description: '' });
    const [newWarehouse, setNewWarehouse] = useState({ name: '', location: '' });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [prodRes, wareRes, logsRes] = await Promise.all([
                api.get('/inventory/products'),
                api.get('/inventory/warehouses'),
                api.get('/inventory/logs')
            ]);
            console.log('Products:', prodRes.data);
            console.log('Warehouses:', wareRes.data);
            setProducts(prodRes.data);
            setWarehouses(wareRes.data);
            setLogs(logsRes.data || []);
        } catch (error) {
            console.error("Error fetching inventory");
        }
    };

    const createProduct = async () => {
        try {
            await api.post('/inventory/products', newProduct);
            setShowProductModal(false);
            fetchData();
        } catch (e) { alert('Error creating product'); }
    };

    const [showAddStockModal, setShowAddStockModal] = useState(false);
    const [showTransferStockModal, setShowTransferStockModal] = useState(false);

    const [stockData, setStockData] = useState({ productId: '', warehouseId: '', quantity: '' });
    const [transferData, setTransferData] = useState({ productId: '', fromWarehouseId: '', toWarehouseId: '', quantity: '' });

    const handleAddStock = async () => {
        try {
            await api.post('/inventory/stock/add', stockData);
            setShowAddStockModal(false);
            fetchData();
            alert('Stock added successfully');
        } catch (e) { alert('Error adding stock'); }
    };

    const handleTransferStock = async () => {
        try {
            await api.post('/inventory/stock/transfer', transferData);
            setShowTransferStockModal(false);
            fetchData();
            alert('Stock transferred successfully');
        } catch (e) { alert('Error transferring stock'); }
    };

    const createWarehouse = async () => {
        try {
            await api.post('/inventory/warehouses', newWarehouse);
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

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Inventory Management</h1>
                    <p className="text-gray-500 text-sm">Manage products, warehouses, and stock levels.</p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <button onClick={() => setShowAddStockModal(true)} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center gap-2 transition-colors">
                        <Plus size={18} /> Add Stock
                    </button>
                    <button onClick={() => setShowTransferStockModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2 transition-colors">
                        <Package size={18} /> Transfer
                    </button>
                    {/* CSV Buttons */}
                    <button
                        onClick={downloadTemplate}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded flex items-center gap-2 transition-colors"
                        title="Download CSV Template"
                    >
                        <Download size={18} /> CSV Template
                    </button>
                    <button
                        onClick={() => csvInputRef.current?.click()}
                        disabled={csvUploading}
                        className="bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white px-4 py-2 rounded flex items-center gap-2 transition-colors"
                        title="Bulk Upload Products via CSV"
                    >
                        {csvUploading
                            ? <><Loader2 size={18} className="animate-spin" /> Uploading {csvProgress.current}/{csvProgress.total}...</>
                            : <><Upload size={18} /> Bulk Upload</>}
                    </button>
                    <input
                        ref={csvInputRef}
                        type="file"
                        accept=".csv"
                        className="hidden"
                        onChange={handleCSVUpload}
                    />
                    <button
                        onClick={() => { setActiveTab('products'); setShowProductModal(true); }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded flex items-center gap-2 transition-colors"
                    >
                        <Plus size={18} /> New Product
                    </button>
                    <button
                        onClick={() => { setActiveTab('warehouses'); setShowWarehouseModal(true); }}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded flex items-center gap-2 transition-colors"
                    >
                        <Plus size={18} /> New Warehouse
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b mb-6 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('products')}
                    className={`px-6 py-3 font-medium transition-colors whitespace-nowrap ${activeTab === 'products' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Products ({products.length})
                </button>
                <button
                    onClick={() => setActiveTab('warehouses')}
                    className={`px-6 py-3 font-medium transition-colors whitespace-nowrap ${activeTab === 'warehouses' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Warehouses ({warehouses.length})
                </button>
                <button
                    onClick={() => setActiveTab('logs')}
                    className={`px-6 py-3 font-medium transition-colors whitespace-nowrap ${activeTab === 'logs' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Stock History
                </button>
            </div>

            {/* Filters row for Products */}
            {activeTab === 'products' && (
                <div className="mb-5 flex flex-wrap gap-3 items-center">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[200px]">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
                        <input
                            type="text"
                            placeholder="Search by Name or SKU..."
                            className="w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); resetPage(); }}
                        />
                    </div>
                    {/* Category filter */}
                    <select
                        className="border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                        value={categoryFilter}
                        onChange={e => { setCategoryFilter(e.target.value); resetPage(); }}
                    >
                        <option value="all">All Categories</option>
                        {uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    {/* Stock filter */}
                    <select
                        className="border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                        value={stockFilter}
                        onChange={e => { setStockFilter(e.target.value); resetPage(); }}
                    >
                        <option value="all">All Stock</option>
                        <option value="in">In Stock</option>
                        <option value="low">Low Stock</option>
                    </select>
                    {/* Sort */}
                    <select
                        className="border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                        value={sortBy}
                        onChange={e => { setSortBy(e.target.value); resetPage(); }}
                    >
                        <option value="name_asc">Name A → Z</option>
                        <option value="name_desc">Name Z → A</option>
                        <option value="stock_desc">Stock: High → Low</option>
                        <option value="stock_asc">Stock: Low → High</option>
                    </select>
                    {/* Results count */}
                    <span className="text-sm text-gray-400 whitespace-nowrap">
                        {filteredProducts.length} result{filteredProducts.length !== 1 ? 's' : ''}
                    </span>
                </div>
            )}

            {activeTab === 'products' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left bg-gray-50 border-b">
                                    <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider w-12">#</th>
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">SKU</th>
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Category</th>
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Steps</th>
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Stock</th>
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Status</th>
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {paginatedProducts.length > 0 ? (
                                    paginatedProducts.map((p, idx) => {
                                        const isLowStock = p.totalStock < 10;
                                        const globalIdx = (currentPage - 1) * PAGE_SIZE + idx + 1;
                                        return (
                                            <tr key={p._id} className={`hover:bg-gray-50 transition-colors ${isLowStock ? 'bg-red-50 hover:bg-red-100' : ''}`}>
                                                {/* SR */}
                                                <td className="p-4 text-xs text-gray-400 font-mono">{globalIdx}</td>
                                                {/* Name */}
                                                <td className="p-4">
                                                    <div className="font-semibold text-gray-800 text-sm">{p.name}</div>
                                                    {p.description && (
                                                        <div className="text-xs text-gray-400 mt-0.5 max-w-xs truncate">{p.description}</div>
                                                    )}
                                                </td>
                                                {/* SKU */}
                                                <td className="p-4 text-gray-500 font-mono text-xs">{p.sku || '—'}</td>
                                                {/* Category */}
                                                <td className="p-4">
                                                    {p.category ? (
                                                        <span className="px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-100">
                                                            {p.category}
                                                        </span>
                                                    ) : <span className="text-gray-300 text-xs">—</span>}
                                                </td>
                                                {/* Steps count */}
                                                <td className="p-4">
                                                    {p.steps && p.steps.length > 0 ? (
                                                        <span className="flex items-center gap-1 text-xs text-blue-600 font-semibold">
                                                            <span className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold">{p.steps.length}</span>
                                                            steps
                                                        </span>
                                                    ) : <span className="text-gray-300 text-xs">—</span>}
                                                </td>
                                                {/* Stock */}
                                                <td className={`p-4 text-right font-bold text-sm ${isLowStock ? 'text-red-600' : 'text-gray-700'}`}>
                                                    {p.totalStock}
                                                </td>
                                                {/* Status badge */}
                                                <td className="p-4 text-center">
                                                    {isLowStock ? (
                                                        <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded-full border border-red-200">
                                                            ⚠ Low
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-200">
                                                            ✓ In Stock
                                                        </span>
                                                    )}
                                                </td>
                                                {/* Actions */}
                                                <td className="p-4">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => openEditModal(p)}
                                                            className="px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors"
                                                        >
                                                            ✏️ Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteProduct(p)}
                                                            disabled={deletingId === p._id}
                                                            className="px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors disabled:opacity-50"
                                                        >
                                                            {deletingId === p._id ? '...' : '🗑 Delete'}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="8" className="p-12 text-center">
                                            <div className="text-gray-300 text-4xl mb-3">📦</div>
                                            <div className="text-gray-400 font-medium">No products found</div>
                                            <div className="text-gray-300 text-sm mt-1">Try adjusting your search or filters</div>
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
                                            className={`px-3 py-1 text-xs border rounded transition-colors ${currentPage === item
                                                ? 'bg-indigo-600 text-white border-indigo-600'
                                                : 'hover:bg-gray-100'
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
                                className="mt-2 w-full py-2 bg-blue-50 text-blue-600 font-bold rounded hover:bg-blue-100"
                            >
                                View Stock
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'logs' && (
                <div className="bg-white rounded shadow p-4">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left bg-gray-50">
                                    <th className="p-3">Date</th>
                                    <th className="p-3">Product</th>
                                    <th className="p-3">Action</th>
                                    <th className="p-3">Warehouse</th>
                                    <th className="p-3">Qty</th>
                                    <th className="p-3">Reason</th>
                                    <th className="p-3">User</th>
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
                                        <td className="p-3">{log.quantity}</td>
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
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white p-6 rounded-lg w-full max-w-lg my-8">
                        <h3 className="text-xl font-bold mb-4">Add Product</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <input className="border p-2 mb-2 rounded" placeholder="Name" onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} />
                            <input className="border p-2 mb-2 rounded" placeholder="SKU" onChange={e => setNewProduct({ ...newProduct, sku: e.target.value })} />
                        </div>
                        <input className="w-full border p-2 mb-2 rounded" placeholder="Category" onChange={e => setNewProduct({ ...newProduct, category: e.target.value })} />
                        <textarea className="w-full border p-2 mb-2 rounded" placeholder="Description" onChange={e => setNewProduct({ ...newProduct, description: e.target.value })} />

                        {/* Image URL Input (MVP) */}
                        <input
                            className="w-full border p-2 mb-4 rounded"
                            placeholder="Image URL (http://...)"
                            onChange={e => setNewProduct({ ...newProduct, images: [e.target.value] })}
                        />

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
                                className="text-sm text-primary flex items-center gap-1 mt-2"
                            >
                                <Plus size={16} /> Add Process Step
                            </button>
                        </div>

                        <div className="flex justify-end gap-2 mt-6">
                            <button onClick={() => setShowProductModal(false)} className="px-4 py-2 border rounded">Cancel</button>
                            <button onClick={createProduct} className="px-4 py-2 bg-primary text-white rounded">Save Product</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Warehouse Modal */}
            {showWarehouseModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white p-6 rounded-lg w-full max-w-md">
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

            {/* Stock Operations Modals */}
            {showAddStockModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white p-6 rounded-lg w-full max-w-md">
                        <h3 className="text-xl font-bold mb-4">Add Stock</h3>
                        <select className="w-full border p-2 mb-2 rounded" onChange={e => setStockData({ ...stockData, productId: e.target.value })}>
                            <option value="">Select Product</option>
                            {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                        </select>
                        <select className="w-full border p-2 mb-2 rounded" onChange={e => setStockData({ ...stockData, warehouseId: e.target.value })}>
                            <option value="">Select Warehouse</option>
                            {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
                        </select>
                        <input type="number" className="w-full border p-2 mb-2 rounded" placeholder="Quantity" onChange={e => setStockData({ ...stockData, quantity: e.target.value })} />
                        <div className="flex justify-end gap-2 mt-4">
                            <button onClick={() => setShowAddStockModal(false)} className="px-4 py-2 border rounded">Cancel</button>
                            <button onClick={handleAddStock} className="px-4 py-2 bg-green-600 text-white rounded">Add Stock</button>
                        </div>
                    </div>
                </div>
            )}

            {showTransferStockModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white p-6 rounded-lg w-full max-w-md">
                        <h3 className="text-xl font-bold mb-4">Transfer Stock</h3>
                        <select className="w-full border p-2 mb-2 rounded" onChange={e => setTransferData({ ...transferData, productId: e.target.value })}>
                            <option value="">Select Product</option>
                            {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                        </select>
                        <select className="w-full border p-2 mb-2 rounded" onChange={e => setTransferData({ ...transferData, fromWarehouseId: e.target.value })}>
                            <option value="">From Warehouse</option>
                            {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
                        </select>
                        <select className="w-full border p-2 mb-2 rounded" onChange={e => setTransferData({ ...transferData, toWarehouseId: e.target.value })}>
                            <option value="">To Warehouse</option>
                            {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
                        </select>
                        <input type="number" className="w-full border p-2 mb-2 rounded" placeholder="Quantity" onChange={e => setTransferData({ ...transferData, quantity: e.target.value })} />
                        <div className="flex justify-end gap-2 mt-4">
                            <button onClick={() => setShowTransferStockModal(false)} className="px-4 py-2 border rounded">Cancel</button>
                            <button onClick={handleTransferStock} className="px-4 py-2 bg-blue-600 text-white rounded">Transfer</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Warehouse Stock Modal */}
            {showWarehouseStockModal && selectedWarehouse && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white p-6 rounded-lg w-full max-w-3xl h-[80vh] flex flex-col">
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
                                        {products.filter(p => p.stock.some(s => s.warehouse === selectedWarehouse._id && s.quantity > 0))
                                            .map(p => {
                                                const stockEntry = p.stock.find(s => s.warehouse === selectedWarehouse._id);
                                                return (
                                                    <tr key={p._id} className="border-b hover:bg-gray-50">
                                                        <td className="p-3 font-medium">{p.name}</td>
                                                        <td className="p-3 text-gray-500 text-sm">{p.category}</td>
                                                        <td className="p-3 text-right font-bold text-blue-600">{stockEntry?.quantity || 0}</td>
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
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white p-6 rounded-lg w-full max-w-2xl max-h-[85vh] flex flex-col">
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
                                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded"
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
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
                    <div className="bg-white p-6 rounded-lg w-full max-w-2xl my-8">
                        <h3 className="text-xl font-bold mb-4">✏️ Edit Product</h3>

                        {/* Basic Details */}
                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Name *</label>
                                <input
                                    className="w-full border p-2 mt-1 rounded"
                                    value={editProduct.name}
                                    onChange={e => setEditProduct({ ...editProduct, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">SKU</label>
                                <input
                                    className="w-full border p-2 mt-1 rounded"
                                    value={editProduct.sku}
                                    onChange={e => setEditProduct({ ...editProduct, sku: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="mb-3">
                            <label className="text-xs font-bold text-gray-500 uppercase">Category</label>
                            <input
                                className="w-full border p-2 mt-1 rounded"
                                value={editProduct.category}
                                onChange={e => setEditProduct({ ...editProduct, category: e.target.value })}
                            />
                        </div>
                        <div className="mb-4">
                            <label className="text-xs font-bold text-gray-500 uppercase">Description</label>
                            <textarea
                                className="w-full border p-2 mt-1 rounded"
                                rows={2}
                                value={editProduct.description}
                                onChange={e => setEditProduct({ ...editProduct, description: e.target.value })}
                            />
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
                                    className="flex items-center gap-1 text-sm text-indigo-600 font-bold hover:text-indigo-800"
                                >
                                    <Plus size={15} /> Add Step
                                </button>
                            </div>

                            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
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

                        <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
                            <button
                                onClick={() => { setShowEditModal(false); setEditProduct(null); }}
                                className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveEditProduct}
                                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded"
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
