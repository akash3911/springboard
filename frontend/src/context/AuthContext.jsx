import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const data = res.data;
    const userObj = {
      id: data.id,
      name: data.name,
      email: data.email,
      role: data.role,
      department: data.department
        ? {
            id: data.department.id,
            name: data.department.name,
            institution: data.department.institution
              ? {
                  id: data.department.institution.id,
                  name: data.department.institution.name,
                }
              : null,
          }
        : null,
    };
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(userObj));
    setUser(userObj);
    return userObj;
  };

  const register = async (userData) => {
    const res = await api.post('/auth/register', userData);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
