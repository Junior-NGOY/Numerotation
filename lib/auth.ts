import { loginUser } from '@/actions/users';
import type { User as ApiUser } from '@/types/api';

export interface User {
  id: string
  email: string
  name: string
  role: "ADMIN" | "USER"
}

export interface LoginCredentials {
  email: string
  password: string
}

export const authenticateUser = async (credentials: LoginCredentials): Promise<User | null> => {
  try {
    const response = await loginUser(credentials);
    
    if (response.error || !response.data) {
      return null;
    }

    const { user, token } = response.data;
    
    // Stocker le token JWT
    localStorage.setItem('auth_token', token);
    
    // Convertir le format API vers le format attendu par l'interface
    const mappedUser: User = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
    
    return mappedUser;
  } catch (error) {
    console.error('Erreur lors de l\'authentification:', error);
    return null;
  }
}

export const getCurrentUser = (): User | null => {
  if (typeof window === "undefined") return null

  const userData = localStorage.getItem("user")
  return userData ? JSON.parse(userData) : null
}

export const setCurrentUser = (user: User) => {
  localStorage.setItem("user", JSON.stringify(user))
}

export const logout = () => {
  localStorage.removeItem("user")
  localStorage.removeItem("auth_token")
}
