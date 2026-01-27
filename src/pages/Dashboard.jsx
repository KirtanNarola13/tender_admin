const Dashboard = () => {
    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-gray-500 text-sm font-medium">Total Projects</h3>
                    <p className="text-3xl font-bold text-gray-800 mt-2">12</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-gray-500 text-sm font-medium">Pending Tasks</h3>
                    <p className="text-3xl font-bold text-orange-500 mt-2">45</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-gray-500 text-sm font-medium">Completed Schools</h3>
                    <p className="text-3xl font-bold text-green-500 mt-2">8</p>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
