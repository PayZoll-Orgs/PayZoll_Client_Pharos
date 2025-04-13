import axiosClient from './axiosClient';
import { PayrollData } from '@/interface/interface-utils';

export const payrollApi = {
    addPayroll: async (payrollData: PayrollData) => {
        const response = await axiosClient.post('/payroll/add', payrollData);
        return response.data;
    },

    getPayrollHistory: async () => {
        const response = await axiosClient.get('/payroll/history');
        return response.data;
    }
};