import { createContext, useContext, useState } from 'react';
import AlertModal from '../components/AlertModal';

const AlertContext = createContext();

export const useAlert = () => {
    const context = useContext(AlertContext);
    if (!context) {
        throw new Error('useAlert must be used within an AlertProvider');
    }
    return context;
};

export const AlertProvider = ({ children }) => {
    const [alert, setAlert] = useState({
        isOpen: false,
        type: 'info',
        title: '',
        message: ''
    });

    const showAlert = (message, type = 'info', title = '') => {
        setAlert({
            isOpen: true,
            type,
            title,
            message
        });
    };

    const hideAlert = () => {
        setAlert(prev => ({ ...prev, isOpen: false }));
    };

    return (
        <AlertContext.Provider value={{ showAlert }}>
            {children}
            <AlertModal
                isOpen={alert.isOpen}
                onClose={hideAlert}
                type={alert.type}
                title={alert.title}
                message={alert.message}
            />
        </AlertContext.Provider>
    );
};
