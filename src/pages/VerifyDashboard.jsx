import { useState, useEffect } from 'react';
import api, { getImageUrl } from '../services/api';
import { CheckCircle, XCircle, ArrowRight, Loader } from 'lucide-react';
import ImageModal from '../components/ImageModal';

const VerifyDashboard = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTask, setSelectedTask] = useState(null);
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [previewImage, setPreviewImage] = useState(null);

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            // Fetch tasks waiting for verification
            // Assuming API supports filtering by status
            const res = await api.get('/tasks?status=completed');
            setTasks(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (task) => {
        if (!window.confirm(`Approve verification for step: ${task.stepName}?`)) return;

        try {
            await api.put(`/tasks/${task._id}`, { status: 'verified' });
            // Remove from list or refresh
            setTasks(tasks.filter(t => t._id !== task._id));
            alert('Task Verified Successfully! ✅');
        } catch (error) {
            alert('Failed to verify: ' + error.message);
        }
    };

    const handleReject = async () => {
        if (!rejectionReason) return alert('Please provide a reason for rejection.');

        try {
            await api.put(`/tasks/${selectedTask._id}`, {
                status: 'in-progress', // Send back to in-progress
                rejectionReason: rejectionReason
            });
            setTasks(tasks.filter(t => t._id !== selectedTask._id));
            setIsRejectModalOpen(false);
            setRejectionReason('');
            setSelectedTask(null);
            alert('Task Rejected and sent back for rework. ↩️');
        } catch (error) {
            alert('Failed to reject: ' + error.message);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading Verification Queue...</div>;

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">Verification Queue</h1>

            {tasks.length === 0 ? (
                <div className="bg-white p-10 rounded shadow text-center text-gray-500">
                    <CheckCircle className="mx-auto mb-4 text-green-500" size={48} />
                    <p className="text-lg">All caught up! No tasks pending verification.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {tasks.map(task => (
                        <div key={task._id} className="bg-white p-6 rounded shadow border-l-4 border-yellow-500">
                            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-4 gap-4">
                                <div>
                                    <h3 className="font-bold text-lg">{task.stepName}</h3>
                                    <p className="text-gray-500 text-sm">
                                        Project: <span className="font-semibold">{task.project?.name || 'Unknown Project'}</span>
                                    </p>
                                    <p className="text-gray-500 text-sm">
                                        Product: <span className="font-semibold">{task.product?.name}</span>
                                    </p>
                                    <p className="text-gray-500 text-sm">
                                        Leader: <span className="font-semibold">{task.assignedTo?.name}</span>
                                    </p>
                                </div>
                                <div className="flex gap-2 w-full lg:w-auto">
                                    <button
                                        onClick={() => { setSelectedTask(task); setIsRejectModalOpen(true); }}
                                        className="flex-1 lg:flex-none justify-center bg-red-50 text-red-600 px-4 py-2 rounded font-medium hover:bg-red-100 flex items-center gap-2"
                                    >
                                        <XCircle size={18} /> Reject
                                    </button>
                                    <button
                                        onClick={() => handleApprove(task)}
                                        className="flex-1 lg:flex-none justify-center bg-green-600 text-white px-4 py-2 rounded font-medium hover:bg-green-700 flex items-center gap-2"
                                    >
                                        <CheckCircle size={18} /> Approve
                                    </button>
                                </div>
                            </div>

                            {/* Photos Comparison */}
                            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded border">
                                <div>
                                    <span className="block text-xs font-bold text-gray-400 mb-2 uppercase">Reference / Before</span>
                                    {task.photos?.before ? (
                                        <img
                                            src={getImageUrl(task.photos.before)}
                                            alt="Before"
                                            className="h-48 object-cover rounded border bg-white cursor-zoom-in hover:opacity-90 transition"
                                            onClick={() => setPreviewImage(getImageUrl(task.photos.before))}
                                        />
                                    ) : (
                                        <div className="h-48 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs text-center p-4">
                                            No Standard Photo
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <span className="block text-xs font-bold text-gray-400 mb-2 uppercase">Actual / Site Photo</span>
                                    {task.photos?.siteCapture ? (
                                        <img
                                            src={getImageUrl(task.photos.siteCapture)}
                                            alt="Site"
                                            className="h-48 object-cover rounded border bg-white cursor-zoom-in hover:opacity-90 transition"
                                            onClick={() => setPreviewImage(getImageUrl(task.photos.siteCapture))}
                                        />
                                    ) : (
                                        // Fallback if 'siteCapture' key varies, try getting first available 'after' or dynamic
                                        task.photos?.after ? (
                                            <img
                                                src={getImageUrl(task.photos.after)}
                                                alt="After"
                                                className="h-48 object-cover rounded border bg-white cursor-zoom-in hover:opacity-90 transition"
                                                onClick={() => setPreviewImage(getImageUrl(task.photos.after))}
                                            />
                                        ) : (
                                            <div className="h-48 bg-red-50 border border-red-200 rounded flex items-center justify-center text-red-400 text-xs font-bold">
                                                MISSING PHOTO
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Reject Modal */}
            {isRejectModalOpen && selectedTask && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white p-6 rounded-lg w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4 text-red-600">Reject Verification</h2>
                        <p className="mb-4 text-sm text-gray-600">
                            Why are you rejecting <b>{selectedTask.stepName}</b>? This will be sent back to the Team Leader.
                        </p>
                        <textarea
                            className="w-full border p-3 rounded mb-4 focus:ring-2 focus:ring-red-500 outline-none"
                            placeholder="e.g., Photo is blurry, paint isn't dry, wrong angle..."
                            rows="4"
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                        />
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setIsRejectModalOpen(false)} className="px-4 py-2 border rounded">Cancel</button>
                            <button onClick={handleReject} className="px-4 py-2 bg-red-600 text-white rounded font-bold hover:bg-red-700">Confirm Reject</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Image Zoom Modal */}
            <ImageModal
                isOpen={!!previewImage}
                onClose={() => setPreviewImage(null)}
                imageUrl={previewImage}
                altText="Verification Preview"
            />
        </div>
    );
};

export default VerifyDashboard;
