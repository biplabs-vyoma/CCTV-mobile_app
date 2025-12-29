import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { CustomAlert, AlertType } from '../components/CustomAlert';

interface AlertOptions {
    title: string;
    message: string;
    type?: AlertType;
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
}

interface AlertContextType {
    showAlert: (options: AlertOptions) => void;
    hideAlert: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const AlertProvider = ({ children }: { children: ReactNode }) => {
    const [visible, setVisible] = useState(false);
    const [config, setConfig] = useState<AlertOptions>({
        title: '',
        message: '',
        type: 'info',
    });

    const showAlert = useCallback((options: AlertOptions) => {
        console.log("AlertContext: showAlert called", options);
        setConfig(options);
        setVisible(true);
        console.log("AlertContext: setVisible(true) called");
    }, []);

    const hideAlert = useCallback(() => {
        setVisible(false);
    }, []);

    return (
        <AlertContext.Provider value={{ showAlert, hideAlert }}>
            {children}
            <CustomAlert
                visible={visible}
                title={config.title}
                message={config.message}
                type={config.type}
                confirmText={config.confirmText}
                cancelText={config.cancelText}
                onClose={hideAlert}
                onConfirm={config.onConfirm ? async () => {
                    console.log("AlertContext: executing onConfirm");
                    await config.onConfirm?.();
                    console.log("AlertContext: onConfirm executed, hiding alert");
                    hideAlert();
                } : undefined}
            />
        </AlertContext.Provider>
    );
};

export const useAlert = () => {
    const context = useContext(AlertContext);
    if (!context) {
        throw new Error('useAlert must be used within an AlertProvider');
    }
    return context;
};
