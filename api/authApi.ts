import axiosClient from './axiosClient';
import { LoginFormData, RegisterFormData } from '@/interface/interface-utils';

export const authApi = {
    login: async (credentials: LoginFormData) => {
        const response = await axiosClient.post('/auth/login', credentials);

        if (response.data?.token) {
            localStorage.setItem('authToken', response.data.token);
        }
        
        if (response.data?.safeUser) {
            localStorage.setItem("user", JSON.stringify(response.data.safeUser)); // <- fix here
        }

        console.log('Login response:', response.data);

        return response.data;
    },

    register: async (data: RegisterFormData) => {
        const response = await axiosClient.post('/auth/register', data);
        return response.data;
    },
};