import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api, { getImageUrl } from '../services/api';
import { Package, CheckCircle, Clock, AlertCircle, FileText, Upload } from 'lucide-react';
import ImageModal from '../components/ImageModal';

const ProjectDetails = () => {
    const { id } = useParams();
    const [project, setProject] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);

    useEffect(() => {
        fetchProjectDetails();
    }, [id]);

    const fetchProjectDetails = async () => {
        try {
            const [projRes, tasksRes] = await Promise.all([
                api.get(`/projects/${id}`),
                api.get(`/tasks?projectId=${id}`) // Filter tasks by project? API needs update or we filter client side
            ]);

            setProject(projRes.data);

            // Backend getTasks might list ALL tasks. 
            // We should filter client side if API doesn't support query param yet (although 'filter' var exist, usually strictly restricted).
            // Let's assume we fetch all and filter or update API.
            // Actually I updated `getTasks` to filter by `assignedTo` or `project` for Leader.
            // For Admin, it returns ALL. So I can filter here.

            const allTasks = tasksRes.data;
            const projectTasks = allTasks.filter(t => t.project?._id === id || t.project === id);
            setTasks(projectTasks);

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('image', file); // API expects 'image' key, but works for PDFs too if configured

        try {
            // 1. Upload File
            const uploadRes = await api.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const fileUrl = uploadRes.data.url;
            console.log('Uploaded File URL:', fileUrl);

            // 2. Update Project
            await api.put(`/projects/${id}`, {
                completionLetter: {
                    url: fileUrl,
                    uploadedAt: new Date()
                }
            });

            // 3. Refresh Data
            fetchProjectDetails();
            alert('Handover Letter uploaded successfully!');

        } catch (error) {
            console.error("Upload failed", error);
            alert('Failed to upload file.');
        } finally {
            setUploading(false);
        }
    };

    if (loading) return <div>Loading Project Details...</div>;
    if (!project) return <div>Project not found</div>;

    // Group tasks by Product (via product ID)
    const tasksByProduct = {};
    if (project.products) {
        project.products.forEach(p => {
            // p.product is populated object
            const prodId = p.product._id;
            tasksByProduct[prodId] = tasks.filter(t => t.product?._id === prodId || t.product === prodId);
        });
    }

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-2">{project.name}</h1>
            <p className="text-gray-600 mb-6">{project.description}</p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white p-4 rounded shadow">
                    <span className="text-gray-500 block text-xs">Client</span>
                    <span className="font-bold">{project.client}</span>
                </div>
                <div className="bg-white p-4 rounded shadow">
                    <span className="text-gray-500 block text-xs">Location</span>
                    <span className="font-bold">{project.location}</span>
                </div>
                <div className="bg-white p-4 rounded shadow">
                    <span className="text-gray-500 block text-xs">Status</span>
                    <span className={`font-bold capitalize ${project.status === 'active' ? 'text-green-600' : 'text-gray-600'}`}>{project.status}</span>
                </div>
                <div className="bg-white p-4 rounded shadow">
                    <span className="text-gray-500 block text-xs">Leader</span>
                    <span className="font-bold">{project.assignedLeader?.name || 'Unassigned'}</span>
                </div>
            </div>

            {/* Handover Letter Section */}
            <div className="bg-white p-6 rounded-lg shadow mb-8 border border-gray-100">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            <FileText className="text-blue-600" size={20} />
                            Handover Letter / Completion Report
                        </h2>
                        <p className="text-sm text-gray-500">Upload the final signed handover document.</p>
                    </div>
                    <div>
                        {project.completionLetter?.url ? (
                            <div className="flex items-center gap-4">
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
                                    className="px-4 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 border border-blue-200 text-sm font-semibold"
                                >
                                    View Document
                                </a>
                                <label className="cursor-pointer px-4 py-2 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 text-sm font-semibold">
                                    {uploading ? 'Updating...' : 'Replace'}
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        onChange={handleFileUpload}
                                        disabled={uploading}
                                    />
                                </label>
                            </div>
                        ) : (
                            <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition shadow text-sm font-semibold">
                                <Upload size={16} />
                                {uploading ? 'Uploading...' : 'Upload Letter'}
                                <input
                                    type="file"
                                    className="hidden"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={handleFileUpload}
                                    disabled={uploading}
                                />
                            </label>
                        )}
                    </div>
                </div>
            </div>

            <h2 className="text-xl font-bold mb-4">Product Progress</h2>
            <div className="space-y-6">
                {project.products?.map((item) => {
                    const prodTasks = tasksByProduct[item.product._id] || [];

                    // Sort tasks by sequence
                    prodTasks.sort((a, b) => a.sequence - b.sequence);

                    // Calculate Progress
                    const completed = prodTasks.filter(t => t.status === 'completed' || t.status === 'verified').length;
                    const total = prodTasks.length;
                    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

                    return (
                        <div key={item._id} className="bg-white rounded-lg shadow border overflow-hidden">
                            <div className="bg-gray-50 p-4 border-b flex justify-between items-center">
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
                                    {/* Visual Progress Bar */}
                                    <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div className="h-full bg-green-500" style={{ width: `${percent}%` }}></div>
                                    </div>
                                </div>
                            </div>

                            {/* Steps / Tasks List */}
                            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {prodTasks.map(task => (
                                    <div key={task._id} className={`p-3 rounded border text-sm ${task.status === 'completed' ? 'bg-green-50 border-green-200' : task.status === 'pending' || task.status === 'in-progress' ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'}`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-bold">Step {task.sequence}: {task.stepName}</span>
                                            {task.status === 'completed' && <CheckCircle size={16} className="text-green-600" />}
                                            {(task.status === 'pending' || task.status === 'in-progress') && <Clock size={16} className="text-blue-600" />}
                                            {task.status === 'locked' && <AlertCircle size={16} className="text-gray-400" />}
                                        </div>
                                        <p className="text-xs text-gray-500 mb-2">{task.description}</p>

                                        {task.photos && Object.keys(task.photos).length > 0 && (
                                            <div className="flex gap-1 mt-2">
                                                {Object.entries(task.photos).map(([type, url]) => (
                                                    <div key={type} onClick={() => setPreviewImage(getImageUrl(url))} className="cursor-pointer block w-8 h-8 bg-gray-200 rounded overflow-hidden border hover:border-blue-500" title={type}>
                                                        {/* Assuming URL is valid image, plain img tag */}
                                                        <img src={getImageUrl(url)} alt={type} className="w-full h-full object-cover" />
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <div className="mt-2 text-xs font-semibold uppercase text-gray-400">
                                            {task.status}
                                        </div>
                                    </div>
                                ))}
                                {prodTasks.length === 0 && <p className="text-gray-500 text-sm italic">No steps defined / generated.</p>}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Image Zoom Modal */}
            <ImageModal
                isOpen={!!previewImage}
                onClose={() => setPreviewImage(null)}
                imageUrl={previewImage}
                altText="Photo Preview"
            />
        </div>
    );
};

export default ProjectDetails;
