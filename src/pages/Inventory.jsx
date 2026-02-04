import { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Package, Trash2 } from 'lucide-react';

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

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );

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

            {/* Search Bar for Products */}
            {activeTab === 'products' && (
                <div className="mb-6">
                    <input
                        type="text"
                        placeholder="Search products by Name or SKU..."
                        className="w-full md:w-1/3 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            )}

            {activeTab === 'products' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left bg-gray-50 border-b">
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">SKU</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Category</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Total Stock</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredProducts.length > 0 ? (
                                filteredProducts.map(p => {
                                    const isLowStock = p.totalStock < 10;
                                    return (
                                        <tr key={p._id} className={`hover:bg-gray-50 transition-colors ${isLowStock ? 'bg-red-50' : ''}`}>
                                            <td className="p-4 font-semibold text-gray-800">{p.name}</td>
                                            <td className="p-4 text-gray-500 font-mono text-sm">{p.sku}</td>
                                            <td className="p-4">
                                                <span className="px-2 py-1 rounded bg-gray-100 text-gray-600 text-xs font-medium border border-gray-200">
                                                    {p.category}
                                                </span>
                                            </td>
                                            <td className={`p-4 text-right font-bold ${isLowStock ? 'text-red-600' : 'text-gray-700'}`}>
                                                {p.totalStock}
                                            </td>
                                            <td className="p-4 text-right">
                                                {isLowStock ? (
                                                    <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded">
                                                        Low Stock
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded">
                                                        In Stock
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-gray-400">
                                        No products found matching "{searchTerm}"
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
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
                            <table className="w-full">
                                <thead className="sticky top-0 bg-white">
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

                        <div className="flex justify-end mt-4 pt-4 border-t">
                            <button onClick={() => setShowWarehouseStockModal(false)} className="px-6 py-2 bg-gray-200 rounded hover:bg-gray-300 font-bold">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Inventory;
