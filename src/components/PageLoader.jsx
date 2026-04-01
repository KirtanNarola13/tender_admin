const PageLoader = ({ text = 'Loading...' }) => (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="relative w-10 h-10">
            <div className="absolute inset-0 rounded-full border-4 border-gray-100" />
            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </div>
        <p className="text-sm text-gray-400 font-medium">{text}</p>
    </div>
);

export default PageLoader;
