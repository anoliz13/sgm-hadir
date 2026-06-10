import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "../lib/types";
import { api } from "../lib/api";

interface AuthContextType {
  user: any;
  userData: User | null;
  loading: boolean;
  isSuperAdmin: boolean;
  isSupervisor: boolean;
  isKepalaSalut: boolean;
  isManajerSalut: boolean;
  canApprove: boolean;
  login: (nik: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  isSuperAdmin: false,
  isSupervisor: false,
  isKepalaSalut: false,
  isManajerSalut: false,
  canApprove: false,
  login: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const storedUser = localStorage.getItem("user_data");

    if (token && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setUserData(parsedUser);
      } catch (e) {
        console.error("Failed to parse stored user", e);
      }
    }
    setLoading(false);

    const handleUnauthorized = () => {
      setUser(null);
      setUserData(null);
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = async (nik: string, password: string) => {
    try {
      const res = await api.post('/auth/login', {
        identifier: nik,
        password: password,
      });

      const data = res.data.data;
      
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      localStorage.setItem("user_data", JSON.stringify(data.user));

      setUser(data.user);
      setUserData(data.user);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Login failed");
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error("Logout API failed", error);
    } finally {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user_data");
      setUser(null);
      setUserData(null);
    }
  };

  const isSuperAdmin = userData?.role === "super_admin";
  const isSupervisor = userData?.role === "supervisor";
  const isKepalaSalut = userData?.role === "kepala_salut";
  const isManajerSalut = userData?.role === "manajer_salut";
  const canApprove = isSuperAdmin || isSupervisor || isKepalaSalut || isManajerSalut;

  return (
    <AuthContext.Provider
      value={{
        user,
        userData,
        loading,
        isSuperAdmin,
        isSupervisor,
        isKepalaSalut,
        isManajerSalut,
        canApprove,
        login,
        logout,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
}
