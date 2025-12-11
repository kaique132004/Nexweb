import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

export type Permission = {
  permission_name: string;
  description: string;
  is_active: boolean;
};

export interface SiteSettingExtra {
  [key: string]: string;
}

export interface SiteSetting {
  visible: boolean;
  page_size: number;
  sort_field: string;
  sort_direction: string;
  extra: SiteSettingExtra;
}

export type UserSession = {
  email: string;
  id: number;
  name: string;
  role: string;
  username: string;
};

interface UserContextType {
  user: UserSession | null;
  setUser: (user: UserSession | null) => void;
  clearUser: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Exportando o provider como default resolve o aviso do Vite
export default function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<UserSession | null>(() => {
    const savedUser = sessionStorage.getItem("user-session");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const setUser = (user: UserSession | null) => {
    setUserState(user);
    if (user) {
      sessionStorage.setItem("user-session", JSON.stringify(user));
    } else {
      sessionStorage.removeItem("user-session");
    }
  };

  const clearUser = () => setUser(null);

  return (
    <UserContext.Provider value={{ user, setUser, clearUser }}>
      {children}
    </UserContext.Provider>
  );
}

// Named hook export (não é default)
export function useUser() {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used within a UserProvider");
  return context;
}
