import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { adminApiService } from '../services/api';

// Initial state
const initialState = {
  user: null,
  loading: true,
  error: null,
};

// Action types
const ActionTypes = {
  SET_LOADING: 'SET_LOADING',
  SET_USER: 'SET_USER',
  SET_ERROR: 'SET_ERROR',
  LOGOUT: 'LOGOUT',
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
      };

    case ActionTypes.SET_USER:
      return {
        ...state,
        user: action.payload,
        loading: false,
        error: null,
      };

    case ActionTypes.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false,
      };

    case ActionTypes.LOGOUT:
      return {
        ...state,
        user: null,
        loading: false,
        error: null,
      };

    default:
      return state;
  }
};

// Create context
const AuthContext = createContext(null);

// AuthProvider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize auth state
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      // You might want to validate the token here
      dispatch({ type: ActionTypes.SET_USER, payload: { token } });
    } else {
      dispatch({ type: ActionTypes.SET_LOADING, payload: false });
    }
  }, []);

  // Login function
  const login = async (username, password) => {
    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      const response = await adminApiService.auth.login({ username, password });
      
      const { access, refresh } = response.data;
      localStorage.setItem('accessToken', access);
      localStorage.setItem('refreshToken', refresh);
      
      dispatch({ type: ActionTypes.SET_USER, payload: { username, token: access } });
    } catch (error) {
      dispatch({ 
        type: ActionTypes.SET_ERROR, 
        payload: error.response?.data?.detail || 'Login failed' 
      });
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    dispatch({ type: ActionTypes.LOGOUT });
  };

  return (
    <AuthContext.Provider 
      value={{
        ...state,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;