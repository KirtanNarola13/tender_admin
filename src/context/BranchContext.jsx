import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const BranchContext = createContext();

export const BranchProvider = ({ children }) => {
    const [activeBranch, setActiveBranch] = useState(localStorage.getItem('activeBranch') || 'all');
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchBranches = async () => {
        try {
            const res = await api.get(`/branches?status=active&_t=${Date.now()}`);
            const branchNames = res.data.map(b => b.name).sort();
            setBranches(branchNames);
        } catch (error) {
            console.error('Failed to fetch global branches:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBranches();
    }, []);

    const updateBranch = (newBranch) => {
        setActiveBranch(newBranch);
        localStorage.setItem('activeBranch', newBranch);
    };

    return (
        <BranchContext.Provider value={{ activeBranch, branches, updateBranch, loading, refreshBranches: fetchBranches }}>
            {children}
        </BranchContext.Provider>
    );
};

export const useBranch = () => {
    const context = useContext(BranchContext);
    if (!context) {
        throw new Error('useBranch must be used within a BranchProvider');
    }
    return context;
};
