import { createContext, useContext, useState, ReactNode } from 'react';

interface AdminSettingsContextType {
  chatEnabled: boolean;
  feedbackEnabled: boolean;
  setChatEnabled: (enabled: boolean) => void;
  setFeedbackEnabled: (enabled: boolean) => void;
}

const AdminSettingsContext = createContext<AdminSettingsContextType | undefined>(undefined);

export function AdminSettingsProvider({ children }: { children: ReactNode }) {
  const [chatEnabled, setChatEnabled] = useState(false);
  const [feedbackEnabled, setFeedbackEnabled] = useState(false);

  return (
    <AdminSettingsContext.Provider
      value={{
        chatEnabled,
        feedbackEnabled,
        setChatEnabled,
        setFeedbackEnabled,
      }}
    >
      {children}
    </AdminSettingsContext.Provider>
  );
}

export function useAdminSettings() {
  const context = useContext(AdminSettingsContext);
  if (context === undefined) {
    throw new Error('useAdminSettings must be used within a AdminSettingsProvider');
  }
  return context;
}
