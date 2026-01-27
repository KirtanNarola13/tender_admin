import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { Package, CheckCircle, Clock, AlertCircle } from 'lucide-react';

const ProjectDetails = () => {
    const { id } = useParams();
    const [project, setProject] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

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

                                        {/* Photos Preview */}
                                        {task.photos && Object.keys(task.photos).length > 0 && (
                                            <div className="flex gap-1 mt-2">
                                                {Object.entries(task.photos).map(([type, url]) => (
                                                    <a key={type} href={url} target="_blank" rel="noopener noreferrer" className="block w-8 h-8 bg-gray-200 rounded overflow-hidden border hover:border-blue-500" title={type}>
                                                        {/* Assuming URL is valid image, plain img tag */}
                                                        <img src={url} alt={type} className="w-full h-full object-cover" />
                                                    </a>
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
        </div>
    );
};

export default ProjectDetails;
