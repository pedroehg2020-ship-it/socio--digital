import { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API } from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("sd_token"));
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async (authToken) => {
    try {
      const res = await axios.get(`${API}/auth/me`, { headers: { Authorization: `Bearer ${authToken}` } });
      setUser(res.data.user);
      setCompany(res.data.company);
    } catch (e) {
      localStorage.removeItem("sd_token");
      setToken(null);
      setUser(null);
      setCompany(null);
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchMe(token).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email, password) => {
    const res = await axios.post(`${API}/auth/login`, { email, password });
    localStorage.setItem("sd_token", res.data.token);
    setToken(res.data.token);
    await fetchMe(res.data.token);
    return res.data;
  };

  const register = async (name, email, password, companyName) => {
    const res = await axios.post(`${API}/auth/register`, { name, email, password, company_name: companyName });
    localStorage.setItem("sd_token", res.data.token);
    setToken(res.data.token);
    await fetchMe(res.data.token);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem("sd_token");
    setToken(null);
    setUser(null);
    setCompany(null);
  };

  const refreshCompany = async () => {
    if (token) await fetchMe(token);
  };

  return (
    <AuthContext.Provider value={{ token, user, company, loading, login, register, logout, refreshCompany }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
