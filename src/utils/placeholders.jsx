const Page = ({ title }) => (
    <div>
        <h1 className="text-2xl font-bold mb-6">{title}</h1>
        <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
            {title} Module Coming Soon
        </div>
    </div>
);

export const Users = () => <Page title="User Management" />;
export const Inventory = () => <Page title="Inventory Management" />;
export const Projects = () => <Page title="Projects" />;
