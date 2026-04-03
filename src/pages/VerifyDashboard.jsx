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
            // Fetch tasks waiting for verification (now only 'submitted')
            const res = await api.get('/tasks?status=submitted');
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
                                    {task.submissionText && (
                                        <div className="mt-3 bg-primary/10 p-3 rounded-lg border border-primary/20 flex items-start gap-2">
                                            <div className="bg-primary/20 text-primary text-[10px] font-black px-1.5 py-0.5 rounded uppercase flex-shrink-0 mt-0.5">Note</div>
                                            <p className="text-primary/90 text-sm leading-relaxed italic font-medium">"{task.submissionText}"</p>
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-2 w-full lg:w-auto">
                                    <button
                                        onClick={() => { setSelectedTask(task); setIsRejectModalOpen(true); }}
                                        className="flex-1 lg:flex-none justify-center bg-red-50 text-red-600 px-3 py-3 rounded-md font-medium hover:bg-red-100 flex items-center gap-2"
                                    >
                                        <XCircle size={18} /> Reject
                                    </button>
                                    <button
                                        onClick={() => handleApprove(task)}
                                        className="flex-1 lg:flex-none justify-center bg-green-600 text-white px-3 py-3 rounded-md font-medium hover:bg-green-700 flex items-center gap-2"
                                    >
                                        <CheckCircle size={18} /> Approve
                                    </button>
                                </div>
                            </div>

                            {/* Photos Comparison / Proof Gallery */}
                            <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                                <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-4">Proof Gallery / Verification Photos</span>
                                {task.photos && Object.keys(task.photos).length > 0 ? (
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                        {Object.entries(task.photos).map(([type, url]) => (
                                            <div key={type} className="space-y-2">
                                                <span className="block text-[10px] font-bold text-gray-500 uppercase text-center bg-gray-200 py-0.5 rounded">{type}</span>
                                                <div 
                                                    className="relative group cursor-zoom-in overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm aspect-square"
                                                    onClick={() => setPreviewImage(getImageUrl(url))}
                                                >
                                                    <img
                                                        src={getImageUrl(url)}
                                                        alt={type}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                        onError={(e) => {
                                                            e.target.onerror = null;
                                                            e.target.src = 'https://placehold.co/400x400/fecaca/991b1b?text=Broken+Image';
                                                        }}
                                                    />
                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="bg-red-50 border-2 border-dashed border-red-200 rounded-lg p-8 flex flex-col items-center justify-center text-red-500 gap-2">
                                        <XCircle size={32} />
                                        <div className="text-center">
                                            <p className="font-bold text-sm">NO PROOF PHOTOS UPLOADED</p>
                                            <p className="text-[10px] opacity-75">This task was marked complete without any proof photos.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Reject Modal */}
            {isRejectModalOpen && selectedTask && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[100] backdrop-blur-sm">
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
