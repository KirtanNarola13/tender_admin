import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { getImageUrl } from '../services/api';
import {
    Package, CheckCircle, Clock, AlertCircle,
    FileText, Upload, ArrowLeft, Pencil, Trash2
} from 'lucide-react';
import ImageModal from '../components/ImageModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';

const CATEGORIES = ['Primary', 'Upper Primary', 'Secondary', 'Higher Secondary', 'Residential'];
const STATUSES = ['active', 'completed', 'on-hold'];

const ProjectDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const handleDelete = async () => {
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        try {
            await api.delete(`/projects/${id}`);
            alert('Project deleted successfully.');
            navigate('/projects');
        } catch (error) {
            alert('Failed to delete project: ' + (error.response?.data?.message || error.message));
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
            alert('Handover Letter uploaded successfully!');
        } catch (error) {
            console.error('Upload failed', error);
            alert('Failed to upload file.');
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

    return (
        <div className="p-4 md:p-6 max-w-7xl mx-auto">

            {/* ── Page Header ─────────────────────────────────────── */}
            <div className="flex items-center justify-between mb-6 gap-4">
                <div className="flex items-center gap-3">
                    {/* Back Button */}
                    <button
                        onClick={() => navigate('/projects')}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition text-sm font-medium shadow-sm"
                    >
                        <ArrowLeft size={16} />
                        <span className="hidden sm:inline">Back</span>
                    </button>
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight">{project.name}</h1>
                        {project.category && (
                            <span className="text-xs font-semibold bg-blue-50 text-blue-600 px-2 py-0.5 rounded mt-0.5 inline-block">
                                {project.category}
                            </span>
                        )}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleDelete}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition text-sm font-semibold shadow-sm"
                        title="Delete Project"
                    >
                        <Trash2 size={15} />
                        <span className="hidden sm:inline">Delete Project</span>
                    </button>
                    <button
                        onClick={() => navigate(`/projects/${id}/edit`)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white hover:bg-opacity-90 transition text-sm font-semibold shadow"
                    >
                        <Pencil size={15} />
                        <span>Edit Project</span>
                    </button>
                </div>
            </div>

            {/* Description */}
            {project.description && (
                <p className="text-gray-500 mb-6 text-sm">{project.description}</p>
            )}

            {/* ── Info Cards ──────────────────────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
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
                        project.status === 'completed' ? 'text-blue-600' :
                        'text-orange-500'
                    }`}>
                        {project.status}
                    </span>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                    <span className="text-gray-400 block text-xs font-medium uppercase tracking-wide mb-1">Leader</span>
                    <span className="font-bold text-gray-800">{project.assignedLeader?.name || 'Unassigned'}</span>
                </div>
            </div>

            {/* ── Handover Letter Section ──────────────────────────── */}
            <div className="bg-white p-5 rounded-lg shadow-sm mb-8 border border-gray-100">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-base font-bold flex items-center gap-2">
                            <FileText className="text-blue-600" size={18} />
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
                                    className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 border border-blue-200 text-sm font-semibold transition"
                                >
                                    View Document
                                </a>
                                <label className="cursor-pointer px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 text-sm font-semibold transition">
                                    {uploading ? 'Updating...' : 'Replace'}
                                    <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileUpload} disabled={uploading} />
                                </label>
                            </div>
                        ) : (
                            <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow text-sm font-semibold">
                                <Upload size={15} />
                                {uploading ? 'Uploading...' : 'Upload Letter'}
                                <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileUpload} disabled={uploading} />
                            </label>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Product Progress ─────────────────────────────────── */}
            <h2 className="text-lg font-bold mb-4">Product Progress</h2>
            <div className="space-y-6">
                {project.products?.filter(item => item.product).map((item) => {
                    const prodTasks = tasksByProduct[item.product._id] || [];
                    prodTasks.sort((a, b) => a.sequence - b.sequence);
                    const completed = prodTasks.filter(t => t.status === 'completed' || t.status === 'verified' || t.status === 'submitted').length;
                    const total = prodTasks.length;
                    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

                    return (
                        <div key={item._id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
                            <div className="bg-gray-50 p-4 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                <div className="flex items-center gap-3">
                                    <Package className="text-primary" />
                                    <div>
                                        <h3 className="font-bold">{item.product.name}</h3>
                                        <span className="text-xs text-gray-500">Planned Qty: {item.plannedQuantity}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <span className="block font-bold text-lg">{percent}%</span>
                                        <span className="text-xs text-gray-500">{completed}/{total} Steps</span>
                                    </div>
                                    <div className="w-28 h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-500"
                                            style={{
                                                width: `${percent}%`,
                                                background: percent === 100 ? '#16a34a' : '#3b82f6'
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {prodTasks.map(task => (
                                    <div
                                        key={task._id}
                                        className={`p-3 rounded-lg border text-sm ${
                                            task.status === 'completed' || task.status === 'verified'
                                                ? 'bg-green-50 border-green-200'
                                                : task.status === 'pending' || task.status === 'in-progress'
                                                    ? 'bg-blue-50 border-blue-200'
                                                    : 'bg-gray-50 border-gray-200'
                                        }`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-bold text-[13px] text-gray-800">Step {task.sequence}: {task.stepName}</span>
                                            {task.status === 'verified' && <CheckCircle size={16} className="text-green-600 flex-shrink-0" />}
                                            {(task.status === 'completed' || task.status === 'submitted') && <Clock size={16} className="text-blue-600 flex-shrink-0" />}
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
                                                            className="relative group cursor-pointer aspect-square bg-gray-100 rounded-md border border-gray-200 overflow-hidden hover:border-blue-400 transition-colors"
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
