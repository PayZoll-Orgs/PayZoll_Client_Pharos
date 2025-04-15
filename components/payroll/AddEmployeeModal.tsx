"use client";

import React, { FormEvent, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Briefcase, Wallet, Mail, Upload, Building, DollarSign } from "lucide-react";
import BulkUploadModal from "./BulkuploadModal";
import { Employee } from "@/lib/interfaces";
import { useAuth } from "@/context/authContext";

interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddEmployee: (employee: Employee) => void;
  onUpdateEmployee?: (wallet: string, employee: Employee) => void;
  editEmployee?: Employee | null;
  onUploadSuccess: () => void;
}

const AddEmployeeModal: React.FC<AddEmployeeModalProps> = ({
  isOpen,
  onClose,
  onAddEmployee,
  onUpdateEmployee,
  onUploadSuccess,
  editEmployee
}) => {
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [errors, setErrors] = useState<Partial<Employee>>({});
  const { user } = useAuth();

  const [formData, setFormData] = useState<Employee>({
    name: "",
    designation: "",
    wallet: "",
    salary: "",
    email: "",
    company: user?.company.toString() || "",
  });

  useEffect(() => {
    if (editEmployee) {
      setFormData({
        name: editEmployee.name,
        designation: editEmployee.designation,
        wallet: editEmployee.wallet,
        salary: editEmployee.salary,
        email: editEmployee.email || "",
        company: user?.company.toString() || "",
      });
    } else {
      // Reset form when adding
      setFormData({
        name: "",
        designation: "",
        wallet: "",
        salary: "",
        email: "",
        company: user?.company || "",
      });
    }
  }, [editEmployee, user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      company: user?.company?.toString() || ""
    }));

    // Clear error for this field when user types
    if (errors[name as keyof Employee]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const newErrors: Partial<Employee> = {};
    Object.entries(formData).forEach(([key, value]) => {
      if (!value.toString().trim()) {
        newErrors[key as keyof Employee] = "This field is required";
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    if (editEmployee && onUpdateEmployee) {
      // Update existing employee
      onUpdateEmployee(editEmployee.wallet, formData);
    } else {
      // Add new employee
      onAddEmployee(formData);
      // Reset form data after adding employee
      setFormData({
        name: "",
        designation: "",
        wallet: "",
        salary: "",
        email: "",
        company: user?.company.toString() || "",
      });
    }

    onClose();
  };

  if (!isOpen) return null;

  const isEditing = !!editEmployee;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="add-employee-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 dark:bg-black/75 backdrop-blur-md flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", damping: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-black/95 w-full md:max-w-4xl max-w-2xl rounded-2xl border border-gray-200 dark:border-[#a5b4fc]/20 overflow-hidden shadow-2xl shadow-black/60 backdrop-blur-xl"
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-[#a5b4fc]/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-full bg-blue-100 dark:bg-[#3b82f6]/20 shadow-inner shadow-blue-200/50 dark:shadow-[#60a5fa]/10">
                    <User className="w-6 h-6 text-blue-600 dark:text-[#93c5fd]" />
                  </div>
                  <h2 className="text-2xl font-bold text-black dark:text-white tracking-tight">
                    {isEditing ? "Edit Employee" : "Add New Employee"}
                  </h2>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-[#93c5fd] transition-colors p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-white/5"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>
            </div>

            <form className="p-6 space-y-6" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField
                  label="Name"
                  name="name"
                  icon={User}
                  placeholder="John Doe"
                  error={errors.name}
                  value={formData.name}
                  onChange={handleInputChange}
                />
                <InputField
                  label="Company"
                  name="company"
                  icon={Building}
                  placeholder="ABC Corp"
                  error={errors.company}
                  value={user?.company.toString() || ""}
                  onChange={handleInputChange}
                  disabled={true}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField
                  label="Designation"
                  name="designation"
                  type="string"
                  icon={Briefcase}
                  placeholder="Senior Developer"
                  error={errors.designation}
                  value={formData.designation}
                  onChange={handleInputChange}
                />
                <InputField
                  label="Email"
                  name="email"
                  icon={Mail}
                  type="email"
                  placeholder="john@abc.com"
                  error={errors.email}
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField
                  label="Wallet Address"
                  name="wallet"
                  type="string"
                  icon={Wallet}
                  placeholder="0x..."
                  error={errors.wallet}
                  value={formData.wallet}
                  onChange={handleInputChange}
                />
                <InputField
                  label="Salary (USD)"
                  name="salary"
                  type="string"
                  icon={DollarSign}
                  placeholder="5000"
                  error={errors.salary}
                  value={formData.salary}
                  onChange={handleInputChange}
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-6 mt-6 border-t border-gray-200 dark:border-gray-800 bg-gray-50/50  dark:bg-transparent">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  {!isEditing && (
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setIsBulkUploadOpen(true)}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-black hover:border-gray-400 dark:border-gray-700/80 dark:bg-gray-800/50 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white dark:hover:border-gray-600 transition-all px-4 py-3 backdrop-blur-sm"
                    >
                      <Upload className="w-5 h-5 text-blue-600 dark:text-[#93c5fd]" />
                      <span className="font-medium">Bulk Upload</span>
                    </motion.button>
                  )}
                  {isEditing && <div className="hidden sm:block sm:w-auto"></div>} {/* Spacer */}
                  <div className="flex gap-4 w-full sm:w-auto">
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={onClose}
                      className="flex-1 sm:flex-none px-5 py-3 rounded-xl border border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-black hover:border-gray-400 dark:border-gray-700/80 dark:bg-gray-800/50 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white dark:hover:border-gray-600 transition-all backdrop-blur-sm"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className="flex-1 sm:flex-none px-5 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 dark:from-[#60a5fa] dark:to-[#3b82f6] dark:hover:from-[#3b82f6] dark:hover:to-[#2563eb] text-white transition-all shadow-lg shadow-blue-500/20 dark:shadow-[#3b82f6]/20 hover:shadow-blue-500/30 dark:hover:shadow-[#3b82f6]/30 font-medium"
                    >
                      {isEditing ? "Update Employee" : "Add Employee"}
                    </motion.button>
                  </div>
                </div>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
      <BulkUploadModal
        key="bulk-upload-modal"
        isOpen={isBulkUploadOpen}
        onClose={() => setIsBulkUploadOpen(false)}
        onUploadSuccess={onUploadSuccess}
      />
    </AnimatePresence>
  );
};

interface InputFieldProps {
  label: string;
  name: string;
  icon?: React.ComponentType<{ className: string }>;
  placeholder?: string;
  type?: string;
  error?: string;
  value: string | number;
  disabled?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const InputField: React.FC<InputFieldProps> = ({
  label,
  name,
  icon: Icon,
  placeholder,
  type = "text",
  error,
  value,
  disabled = false,
  onChange
}) => (
  <div className="space-y-1.5">
    <label htmlFor={name} className="flex gap-2 items-center text-sm font-medium text-gray-600 dark:text-gray-400">
      {Icon && <Icon className="w-4 h-4 text-blue-600 dark:text-[#93c5fd]" />}
      {label}
    </label>
    <div className="relative">
      <input
        id={name}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        className={`w-full p-3 bg-gray-100 dark:bg-gray-900/50 backdrop-blur-sm border rounded-xl
                text-black dark:text-white focus:outline-none focus:ring-2 transition-all placeholder-gray-500 dark:placeholder-gray-500 text-base
                ${disabled ? 'opacity-60 cursor-not-allowed bg-gray-200 dark:bg-gray-800/60' : ''}
                ${error
            ? 'border-red-500/70 focus:border-red-500 focus:ring-red-500/30 dark:border-red-400/70 dark:focus:border-red-400 dark:focus:ring-red-400/30'
            : 'border-gray-300 dark:border-gray-800/60 focus:border-blue-500 focus:ring-blue-500/30 dark:focus:border-[#60a5fa] dark:focus:ring-[#60a5fa]/30'
          }`}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : undefined}
      />
    </div>
    {error && <p id={`${name}-error`} className="text-sm text-red-600 dark:text-red-400 mt-1">{error}</p>}
  </div>
);

export default AddEmployeeModal;