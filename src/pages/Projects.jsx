import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Plus, Trash2, Home } from 'lucide-react';

const Projects = () => {
    const [projects, setProjects] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newProject, setNewProject] = useState({ name: '', description: '' });

    // School & Assignment
    const [showSchoolModal, setShowSchoolModal] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);
    const [newSchool, setNewSchool] = useState({ name: '', address: '', project: '' });
    const [users, setUsers] = useState([]); // Team Leaders
    const [selectedLeader, setSelectedLeader] = useState('');

    useEffect(() => {
        fetchProjects();
        fetchUsers();
    }, []);

    const fetchProjects = async () => {
        try {
            const res = await api.get('/projects');
            console.log('Projects API Response:', res.data);
            setProjects(res.data);
        } catch (error) {
            console.error('Failed to fetch projects');
        }
    };

    const fetchUsers = async () => {
        try {
            const res = await api.get('/users?role=team_leader');
            setUsers(res.data.filter(u => u.role === 'team_leader'));
        } catch (e) { }
    };

    const handleCreate = async () => {
        try {
            await api.post('/projects', newProject);
            setIsModalOpen(false);
            setNewProject({ name: '', description: '' });
            fetchProjects();
        } catch (error) {
            alert('Failed to create project');
        }
    };

    const [projectSchools, setProjectSchools] = useState([]);

    const openAssignModal = async (project) => {
        setSelectedProject(project);
        try {
            const res = await api.get(`/schools?projectId=${project._id}`);
            setProjectSchools(res.data);
            setShowSchoolModal(true);
        } catch (e) {
            console.error("Failed to fetch schools");
        }
    };

    const handleAssignLeader = async () => {
        // newSchool now effectively selects a project if we are assigning to a project, 
        // but wait, the modal logic was: "Select an existing school in selectedProject".
        // Now "Project" = "Site". So we are just assigning to failure selectedProject?
        // But the modal has "Select School" dropdown.
        // If we removed Schools logic, we should assign to THIS selectedProject.
        // Let's simplify: Assign Leader to THIS project directly.

        if (!selectedLeader) return alert('Select Team Leader');
        try {
            // Update Project with new Leader
            await api.put(`/projects/${selectedProject._id}`, {
                assignedLeader: selectedLeader
            });

            setShowSchoolModal(false);
            setSelectedLeader('');
            alert('Team Leader Assigned Successfully!');
            fetchProjects(); // Refresh to show new status/leader if we showed it
        } catch (e) {
            alert('Failed to assign: ' + (e.response?.data?.message || e.message));
        }
    };

    const [filterCategory, setFilterCategory] = useState('All');

    // Filter Logic
    const filteredProjects = projects.filter(project => {
        if (filterCategory === 'All') return true;
        return project.category === filterCategory;
    });

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h1 className="text-2xl font-bold">Projects</h1>

                <div className="flex items-center gap-4 w-full md:w-auto">
                    {/* Filter Dropdown */}
                    <select
                        className="border p-2 rounded w-full md:w-48"
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                    >
                        <option value="All">All Categories</option>
                        <option value="Primary">Primary</option>
                        <option value="Upper Primary">Upper Primary</option>
                        <option value="Secondary">Secondary</option>
                        <option value="Higher Secondary">Higher Secondary</option>
                        <option value="Residential">Residential</option>
                    </select>

                    <Link to="/projects/new" className="bg-primary text-white px-4 py-2 rounded flex items-center gap-2 whitespace-nowrap">
                        <Plus size={20} /> Create Project
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.isArray(filteredProjects) && filteredProjects.map((project) => (
                    <div key={project._id} className="bg-white p-6 rounded-lg shadow">
                        <div className="flex justify-between items-start mb-2">
                            <Link to={`/projects/${project._id}`} className="hover:underline text-primary">
                                <h3 className="text-xl font-bold">{project.name}</h3>
                            </Link>
                            <span className="text-xs font-semibold bg-gray-100 px-2 py-1 rounded text-gray-600">{project.category || 'N/A'}</span>
                        </div>

                        <p className="text-gray-600 mb-4">{project.description}</p>
                        <div className="flex justify-between items-center text-sm text-gray-500 border-t pt-4">
                            <div className="flex flex-col">
                                <span>Status: <span className={`font-semibold capitalize ${project.status === 'active' ? 'text-green-600' : 'text-gray-500'}`}>{project.status}</span></span>
                                <span className="mt-1">Leader: <span className="font-semibold text-gray-800">{project.assignedLeader?.name || 'Unassigned'}</span></span>
                            </div>
                            <div className="flex gap-2">
                                <Link to={`/projects/${project._id}`} className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                                    View Details
                                </Link>
                                {/* <button className="text-red-500 hover:text-red-700">
                                    <Trash2 size={18} />
                                </button> */}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Create Project Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white p-6 rounded-lg w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Create New Project</h2>
                        <input
                            className="w-full border p-2 rounded mb-4"
                            placeholder="Project Name"
                            value={newProject.name}
                            onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                        />
                        <textarea
                            className="w-full border p-2 rounded mb-4"
                            placeholder="Description"
                            value={newProject.description}
                            onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                        />
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded">Cancel</button>
                            <button onClick={handleCreate} className="px-4 py-2 bg-primary text-white rounded">Create</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add School Modal */}
            {/* Assign Leader Modal */}
            {showSchoolModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white p-6 rounded-lg w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Assign Team Leader</h2>
                        <p className="text-sm text-gray-500 mb-4">Select an existing school in <b>{selectedProject?.name}</b> and assign a leader.</p>

                        <label className="block mb-2 text-sm font-bold">Select School</label>
                        <select
                            className="w-full border p-2 rounded mb-4"
                            value={newSchool.id} // Reusing newSchool state store ID temporarily or add new state
                            onChange={(e) => setNewSchool({ ...newSchool, id: e.target.value })}
                        >
                            <option value="">-- Choose School --</option>
                            {projectSchools.map(s => (
                                <option key={s._id} value={s._id}>{s.name} ({s.address})</option>
                            ))}
                        </select>

                        <label className="block mb-2 text-sm font-bold">Assign Team Leader</label>
                        <select
                            className="w-full border p-2 rounded mb-4"
                            value={selectedLeader}
                            onChange={(e) => setSelectedLeader(e.target.value)}
                        >
                            <option value="">-- Select User --</option>
                            {users.map(u => (
                                <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
                            ))}
                        </select>

                        <div className="flex justify-end gap-2">
                            <button onClick={() => setShowSchoolModal(false)} className="px-4 py-2 border rounded">Cancel</button>
                            <button onClick={handleAssignLeader} className="px-4 py-2 bg-primary text-white rounded">Assign Task</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Projects;
