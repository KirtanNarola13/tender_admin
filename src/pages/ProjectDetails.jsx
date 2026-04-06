import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { getImageUrl } from '../services/api';
import {
    Package, CheckCircle, Clock, AlertCircle,
    FileText, Upload, ArrowLeft, Pencil, Trash2, ChevronDown
} from 'lucide-react';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import ImageModal from '../components/ImageModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import { useAlert } from '../context/AlertContext';

const CATEGORIES = ['Primary', 'Upper Primary', 'Secondary', 'Higher Secondary', 'Residential'];
const STATUSES = ['active', 'completed', 'on-hold'];

const ProjectDetails = () => {
    const { user: currentUser } = useAuth();
    const { id } = useParams();
    const navigate = useNavigate();
    const { showAlert } = useAlert();
    const [project, setProject] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [expandedProducts, setExpandedProducts] = useState({});

    const toggleProduct = (productId) => {
        setExpandedProducts(prev => ({
            ...prev,
            [productId]: !prev[productId]
        }));
    };

    const handleDelete = async () => {
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        try {
            await api.delete(`/projects/${id}`);
            showAlert('Project deleted successfully.', 'success');
            navigate('/projects');
        } catch (error) {
            showAlert('Failed to delete project: ' + (error.response?.data?.message || error.message), 'error');
        }
    };

    useEffect(() => {
        fetchProjectDetails();
    }, [id]);

    const fetchProjectDetails = async () => {
        try {
            const [projRes, tasksRes] = await Promise.all([
                api.get(`/projects/${id}`),
                api.get(`/tasks?projectId=${id}`)
            ]);

            setProject(projRes.data);

            const allTasks = tasksRes.data;
            const projectTasks = allTasks.filter(t => t.project?._id === id || t.project === id);
            setTasks(projectTasks);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // ── File upload ─────────────────────────────────────────────────
    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('image', file);

        try {
            const uploadRes = await api.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const fileUrl = uploadRes.data.url;

            await api.put(`/projects/${id}`, {
                completionLetter: {
                    url: fileUrl,
                    uploadedAt: new Date()
                }
            });

            fetchProjectDetails();
            showAlert('Handover Letter uploaded successfully!', 'success');
        } catch (error) {
            console.error('Upload failed', error);
            showAlert('Failed to upload file.', 'error');
        } finally {
            setUploading(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-64 text-gray-500">
            Loading Project Details...
        </div>
    );
    if (!project) return (
        <div className="flex items-center justify-center min-h-64 text-gray-500">
            Project not found.
        </div>
    );

    // Group tasks by product
    const tasksByProduct = {};
    if (project.products) {
        project.products.forEach(p => {
            if (!p.product) return; // guard dangling refs
            const prodId = p.product._id;
            tasksByProduct[prodId] = tasks.filter(t => t.product?._id === prodId || t.product === prodId);
        });
    }

    const totalTasksCount = tasks.length;
    const completedTasksCount = tasks.filter(t => ['completed', 'verified', 'submitted'].includes(t.status)).length;
    const pendingTasksCount = totalTasksCount - completedTasksCount;
    const projectProgressPercent = project.status === 'completed' ? 100 : (totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0);

    const chartData = [
        { name: 'Completed', value: completedTasksCount, color: '#10B981' },
        { name: 'Pending', value: pendingTasksCount, color: '#EF4444' }
    ].filter(d => d.value > 0);

    return (
        <div className="w-full max-w-7xl mx-auto space-y-4 sm:space-y-6 pb-8">

            {/* ── Page Header ─────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    {/* Back Button */}
                    <button
                        onClick={() => navigate(-1)}
                        className="flex shrink-0 w-9 h-9 sm:w-auto sm:h-auto items-center justify-center sm:px-3 sm:py-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition text-sm font-medium shadow-sm"
                    >
                        <ArrowLeft size={16} />
                        <span className="hidden sm:inline ml-1.5">Back</span>
                    </button>
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight">{project.name}</h1>
                        <div className="flex flex-wrap gap-2 mt-1">
                            {project.workOrder && (
                                <span className="text-[10px] font-black bg-blue-100 text-blue-700 px-2.5 py-1 rounded-md uppercase tracking-wider border border-blue-200">
                                    WON: {project.workOrder.workOrderNumber}
                                </span>
                            )}
                            {project.workOrderCategory && (
                                <span className="text-[10px] font-black bg-purple-100 text-purple-700 px-2.5 py-1 rounded-md uppercase tracking-wider border border-purple-200">
                                    Category: {project.workOrderCategory}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                {currentUser?.role !== 'admin_viewer' && (
                    <div className="flex items-center justify-end gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                        <button
                            onClick={handleDelete}
                            className="flex flex-1 sm:flex-none justify-center items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-2 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition text-sm font-semibold shadow-sm"
                            title="Delete Project"
                        >
                            <Trash2 size={15} />
                            <span className="inline">Delete</span>
                        </button>
                        <button
                            onClick={() => navigate(`/projects/${id}/edit`)}
                            className="flex flex-1 sm:flex-none justify-center items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-2 rounded-lg bg-primary text-white hover:bg-opacity-90 transition text-sm font-semibold shadow"
                        >
                            <Pencil size={15} />
                            <span>Edit</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Description */}
            {project.description && (
                <p className="text-gray-500 text-sm leading-relaxed">{project.description}</p>
            )}

            {/* ── Info Cards ──────────────────────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                    <span className="text-gray-400 block text-xs font-medium uppercase tracking-wide mb-1">Client</span>
                    <span className="font-bold text-gray-800">{project.client || '—'}</span>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                    <span className="text-gray-400 block text-xs font-medium uppercase tracking-wide mb-1">Location</span>
                    <span className="font-bold text-gray-800">{project.location || '—'}</span>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                    <span className="text-gray-400 block text-xs font-medium uppercase tracking-wide mb-1">Status</span>
                    <span className={`font-bold capitalize ${
                        project.status === 'active' ? 'text-green-600' :
                        project.status === 'completed' ? 'text-green-600' :
                        'text-red-500'
                    }`}>
                        {project.status}
                    </span>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                    <span className="text-gray-400 block text-xs font-medium uppercase tracking-wide mb-1">Leader</span>
                    <span className="font-bold text-gray-800">{project.assignedLeader?.name || 'Unassigned'}</span>
                </div>
            </div>

            {/* ── Overall Progress & Task Chart ────────────────────────── */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-7 space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20 shadow-sm">
                            <CheckCircle className="text-primary" size={24} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Project Vitality</h2>
                            <p className="text-sm text-gray-400">At-a-glance task distribution and completion status.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Total Tasks</span>
                            <span className="text-xl font-bold text-gray-800">{totalTasksCount}</span>
                        </div>
                        <div className="bg-green-50/50 p-3 rounded-xl border border-green-100">
                            <span className="text-[10px] font-bold text-green-500 uppercase tracking-wider block mb-1">Completed</span>
                            <span className="text-xl font-bold text-green-600">{completedTasksCount}</span>
                        </div>
                        <div className="bg-red-50/50 p-3 rounded-xl border border-red-100">
                            <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider block mb-1">Pending</span>
                            <span className="text-xl font-bold text-red-600">{pendingTasksCount}</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-end">
                            <span className="text-sm font-bold text-gray-700">Completion Velocity</span>
                            <span className="text-sm font-black text-primary">{projectProgressPercent}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden shadow-inner">
                            <div 
                                className={`h-full rounded-full transition-all duration-1000 ease-out shadow-sm ${projectProgressPercent === 100 ? 'bg-green-500' : 'bg-primary'}`} 
                                style={{ width: `${projectProgressPercent}%` }}
                            />
                        </div>
                    </div>
                </div>

                <div className="md:col-span-5 h-48 md:h-56 relative group">
                    {totalTasksCount > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    innerRadius="65%"
                                    outerRadius="90%"
                                    paddingAngle={5}
                                    dataKey="value"
                                    animationBegin={200}
                                    animationDuration={1200}
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ 
                                        borderRadius: '12px', 
                                        border: 'none', 
                                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                        fontSize: '12px',
                                        fontWeight: 'bold'
                                    }} 
                                    itemStyle={{ padding: '2px 0' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-300 gap-2">
                            <Clock size={32} strokeWidth={1} />
                            <span className="text-xs font-medium">No tasks generated yet</span>
                        </div>
                    )}
                    {totalTasksCount > 0 && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-2xl font-black text-gray-800">{projectProgressPercent}%</span>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Progress</span>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Handover Letter Section ──────────────────────────── */}
            <div className="bg-white p-4 sm:p-5 rounded-lg shadow-sm border border-gray-100">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">
                    <div>
                        <h2 className="text-base font-bold flex items-center gap-2 text-gray-900">
                            <FileText className="text-primary" size={18} />
                            Handover Letter / Completion Report
                        </h2>
                        <p className="text-sm text-gray-400 mt-0.5">Upload the final signed handover document.</p>
                    </div>
                    <div className="flex-shrink-0">
                        {project.completionLetter?.url ? (
                            <div className="flex items-center gap-3 flex-wrap">
                                <div className="text-right">
                                    <span className="block text-sm font-semibold text-green-600">Uploaded</span>
                                    <span className="text-xs text-gray-400">
                                        {new Date(project.completionLetter.uploadedAt).toLocaleDateString()}
                                    </span>
                                </div>
                                <a
                                    href={project.completionLetter.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 border border-primary/30 text-sm font-semibold transition shadow-sm"
                                >
                                    View Document
                                </a>
                                {currentUser?.role !== 'admin_viewer' && (
                                    <label className="cursor-pointer px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 text-sm font-semibold transition">
                                        {uploading ? 'Updating...' : 'Replace'}
                                        <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileUpload} disabled={uploading} />
                                    </label>
                                )}
                            </div>
                        ) : (
                            currentUser?.role !== 'admin_viewer' ? (
                                <label className="cursor-pointer flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-primary/20 text-sm font-bold">
                                    <Upload size={16} />
                                    {uploading ? 'Uploading...' : 'Upload Letter'}
                                    <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileUpload} disabled={uploading} />
                                </label>
                            ) : (
                                <span className="text-sm font-medium text-gray-400">Not Uploaded</span>
                            )
                        )}
                    </div>
                </div>
            </div>

            {/* ── Product Progress ─────────────────────────────────── */}
            <h2 className="text-lg font-bold mb-2">Product Progress</h2>
            <div className="space-y-4">
                {project.products?.filter(item => item.product).map((item) => {
                    const prodTasks = tasksByProduct[item.product._id] || [];
                    prodTasks.sort((a, b) => a.sequence - b.sequence);
                    const completed = prodTasks.filter(t => t.status === 'completed' || t.status === 'verified' || t.status === 'submitted').length;
                    const total = prodTasks.length;
                    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

                    const isExpanded = !!expandedProducts[item._id];

                    return (
                        <div key={item._id} className="bg-white rounded-lg shadow-sm border overflow-hidden transition-all duration-300">
                            <button 
                                onClick={() => toggleProduct(item._id)}
                                className="w-full text-left bg-gray-50 hover:bg-gray-100 p-4 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 transition-colors focus:outline-none"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                                        <Package className="text-primary" size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900">{item.product.name}</h3>
                                        <span className="text-xs text-gray-500 font-medium tracking-wide uppercase">Planned Qty: {item.plannedQuantity}</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between w-full lg:w-auto gap-5">
                                    <div className="flex items-center gap-3 shrink-0">
                                        <div className="text-right hidden sm:block">
                                            <span className="block font-bold text-lg leading-none">{percent}%</span>
                                        </div>
                                        <div className="w-32 lg:w-40 h-2.5 bg-gray-200 rounded-full overflow-hidden shrink-0">
                                            <div
                                                className="h-full rounded-full transition-all duration-500"
                                                style={{
                                                    width: `${percent}%`,
                                                    background: percent === 100 ? '#16a34a' : '#B8860B'
                                                }}
                                            />
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xs font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded border border-gray-200">{completed}/{total} Steps</span>
                                        </div>
                                    </div>
                                    <ChevronDown 
                                        size={20} 
                                        className={`text-gray-400 transition-transform duration-300 shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
                                    />
                                </div>
                            </button>

                            <div className={`${isExpanded ? 'grid' : 'hidden'} p-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 border-t border-gray-100 bg-white`}>
                                {prodTasks.map(task => (
                                    <div
                                        key={task._id}
                                        className={`p-3 rounded-lg border text-sm ${
                                            task.status === 'completed' || task.status === 'verified'
                                                ? 'bg-green-50 border-green-200'
                                                : task.status === 'in-progress' || task.status === 'submitted'
                                                    ? 'bg-yellow-50 border-yellow-200'
                                                    : 'bg-red-50 border-red-200'
                                        }`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-bold text-[13px] text-gray-800">Step {task.sequence}: {task.stepName}</span>
                                            {task.status === 'verified' && <CheckCircle size={16} className="text-green-600 flex-shrink-0" />}
                                            {(task.status === 'completed' || task.status === 'submitted') && <Clock size={16} className="text-primary flex-shrink-0" />}
                                            {task.status === 'in-progress' && <Clock size={16} className="text-yellow-600 flex-shrink-0" />}
                                            {task.status === 'locked' && <AlertCircle size={16} className="text-gray-400 flex-shrink-0" />}
                                        </div>
                                        <p className="text-xs text-gray-500 mb-2">{task.description}</p>

                                        {task.photos && Object.keys(task.photos).length > 0 && (
                                            <div className="mt-3">
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mb-1.5">Proof Photos:</p>
                                                <div className="grid grid-cols-3 gap-1.5">
                                                    {Object.entries(task.photos).map(([type, url]) => (
                                                        <div
                                                            key={type}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setPreviewImage(getImageUrl(url));
                                                            }}
                                                            className="relative group cursor-pointer aspect-square bg-gray-100 rounded-md border border-gray-200 overflow-hidden hover:border-primary transition-all"
                                                            title={type}
                                                        >
                                                            <img
                                                                src={getImageUrl(url)}
                                                                alt={type}
                                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                            />
                                                            <div className="absolute inset-x-0 bottom-0 bg-black/40 text-white text-[8px] py-0.5 text-center font-bold uppercase">
                                                                {type}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="mt-2 text-xs font-semibold uppercase text-gray-400">
                                            {task.status}
                                        </div>
                                    </div>
                                ))}
                                {prodTasks.length === 0 && (
                                    <p className="text-gray-400 text-sm italic col-span-4">No steps defined / generated.</p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ── Image Preview Modal ──────────────────────────────── */}
            <ImageModal
                isOpen={!!previewImage}
                onClose={() => setPreviewImage(null)}
                imageUrl={previewImage}
                altText="Photo Preview"
            />

            <DeleteConfirmModal 
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={confirmDelete}
                itemName={project?.name}
                title="Delete Project?"
            />

        </div>
    );
};

export default ProjectDetails;
