import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { getImageUrl } from '../services/api';
import ImageModal from '../components/ImageModal';

const TaskDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [task, setTask] = useState(null);
    const [loading, setLoading] = useState(true);
    const [previewImage, setPreviewImage] = useState(null);

    useEffect(() => {
        const fetchTask = async () => {
            try {
                // Fetch all tasks and find (MVP) or use ID if backend supports
                const res = await api.get('/tasks');
                const found = res.data.find(t => t._id === id);
                setTask(found);
            } catch (error) {
                console.error('Error fetching task', error);
            } finally {
                setLoading(false);
            }
        };
        fetchTask();
    }, [id]);

    if (loading) return <div>Loading...</div>;
    if (!task) return <div>Task not found</div>;

    return (
        <div>
            <button onClick={() => navigate(-1)} className="mb-4 text-blue-500 hover:underline">&larr; Back</button>

            <div className="bg-white rounded-lg shadow-lg p-8">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h1 className="text-2xl font-bold mb-1">{task.stepName}</h1>
                        <p className="text-gray-500 text-lg">{task.project?.name || 'Unknown Project'} &bull; {task.product?.name || 'Unknown Product'}</p>
                    </div>
                    <span className={`px-4 py-2 rounded-full font-bold capitalize ${task.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                        {task.status}
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <div>
                        <h3 className="font-bold text-gray-700 mb-2">Description / Instructions</h3>
                        <p className="text-gray-600 bg-gray-50 p-4 rounded border">{task.description || 'No description provided.'}</p>
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-700 mb-2">Details</h3>
                        <ul className="space-y-2 text-sm">
                            <li className="flex justify-between border-b pb-2">
                                <span className="text-gray-500">Assigned To:</span>
                                <span className="font-medium">{task.assignedTo?.name || 'Unassigned'}</span>
                            </li>
                            <li className="flex justify-between border-b pb-2">
                                <span className="text-gray-500">Sequence:</span>
                                <span className="font-medium">Step {task.sequence}</span>
                            </li>
                            <li className="flex justify-between border-b pb-2">
                                <span className="text-gray-500">Last Updated:</span>
                                <span className="font-medium">{new Date(task.updatedAt || Date.now()).toLocaleDateString()}</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <h3 className="font-bold text-xl mb-4">Photos</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {['before', 'during', 'after']
                        .filter(type => task.requiredPhotos?.includes(type) || task.photos?.[type])
                        .map((type) => (
                            <div key={type} className="border rounded p-4 text-center bg-gray-50">
                                <p className="text-xs font-bold uppercase text-gray-500 mb-2">{type}</p>
                                {task.photos && task.photos[type] ? (
                                    <div
                                        className="cursor-pointer group"
                                        onClick={() => setPreviewImage(getImageUrl(task.photos[type]))}
                                    >
                                        <img
                                            src={getImageUrl(task.photos[type])}
                                            alt={`${type}`}
                                            className="w-full h-40 object-cover rounded border group-hover:opacity-90 transition"
                                        />
                                        <p className="text-xs text-blue-500 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">Click to Zoom</p>
                                    </div>
                                ) : (
                                    <div className="w-full h-40 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-sm">
                                        No Photo
                                    </div>
                                )}
                            </div>
                        ))}
                </div>
            </div>

            {/* Image Zoom Modal */}
            <ImageModal
                isOpen={!!previewImage}
                onClose={() => setPreviewImage(null)}
                imageUrl={previewImage}
                altText="Task Photo Preview"
            />
        </div>
    );
};

export default TaskDetails;
