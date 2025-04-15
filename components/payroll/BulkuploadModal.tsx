"use client";

import React, { useState, DragEvent, ChangeEvent, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, FileSpreadsheet, AlertCircle, Check, XCircle, Loader, Download } from "lucide-react";
import { employerApi } from "@/api/employerApi";

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
}

const BulkUploadModal: React.FC<BulkUploadModalProps> = ({ isOpen, onClose, onUploadSuccess }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    success: boolean;
    message: string;
    details?: string[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    // Reset previous upload status
    setUploadStatus(null);

    // Check file type
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!fileExtension || !['csv', 'xls', 'xlsx'].includes(fileExtension)) {
      setUploadStatus({
        success: false,
        message: "Invalid file format",
        details: ["Please upload a CSV or Excel file (.csv, .xls, .xlsx)"]
      });
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadStatus({
        success: false,
        message: "File too large",
        details: ["Maximum file size is 5MB"]
      });
      return;
    }

    setSelectedFile(file);
  };

  const downloadTemplate = () => {
    // Create CSV template
    const template = "name,email,designation,salary,wallet\nJohn Doe,john@example.com,Developer,5000,0x1234567890abcdef1234567890abcdef12345678\nJane Smith,jane@example.com,Designer,4500,0xabcdef1234567890abcdef1234567890abcdef12";

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'employee_template.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadStatus({
        success: false,
        message: "No file selected",
        details: ["Please select a file to upload"]
      });
      return;
    }

    try {
      setIsUploading(true);
      setUploadStatus(null);

      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await employerApi.bulkUploadEmployees(formData);

      if (response.status === "success") {
        setUploadStatus({
          success: true,
          message: "Upload successful",
          details: [
            `${response.data?.uploadedCount || 'Multiple'} employees added successfully.`
          ]
        });

        // Call the success callback after a delay for better UX
        setTimeout(() => {
          onUploadSuccess();
          setTimeout(() => onClose(), 1500);
        }, 1500);
      } else {
        setUploadStatus({
          success: false,
          message: "Upload failed",
          details: response.errors || [response.message || "Unknown error occurred"]
        });
      }
    } catch (error: any) {
      console.error("Upload error:", error);

      setUploadStatus({
        success: false,
        message: "Upload failed",
        details: error.response?.data?.errors ||
          [error.response?.data?.message || error.message || "Unknown error occurred"]
      });
    } finally {
      setIsUploading(false);
    }
  };

  const resetFileSelection = () => {
    setSelectedFile(null);
    setUploadStatus(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: "spring", damping: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-gradient-to-br dark:from-gray-900/90 dark:to-black/95 w-full max-w-2xl rounded-2xl border border-gray-200 dark:border-[#a5b4fc]/20 overflow-hidden shadow-2xl shadow-black/60 backdrop-blur-xl"
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-[#a5b4fc]/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-full bg-blue-100 dark:bg-[#3b82f6]/20 shadow-inner shadow-blue-200/50 dark:shadow-[#60a5fa]/10">
                  <Upload className="w-6 h-6 text-blue-600 dark:text-[#93c5fd]" />
                </div>
                <h2 className="text-2xl font-bold text-black dark:text-white tracking-tight">
                  Bulk Upload Employees
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

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Download Template Section */}
            <div className="bg-gray-100 dark:bg-gray-900/40 backdrop-blur-sm rounded-xl p-5 border border-gray-200 dark:border-gray-800/60 flex items-start space-x-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-[#3b82f6]/10 flex items-center justify-center border border-blue-200 dark:border-[#3b82f6]/20">
                <FileSpreadsheet className="w-6 h-6 text-blue-600 dark:text-[#93c5fd]" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-black dark:text-white text-lg mb-1">Download Template</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-3">Use our template to ensure your data is formatted correctly</p>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={downloadTemplate}
                  className="text-blue-600 dark:text-[#93c5fd] hover:text-blue-700 dark:hover:text-[#60a5fa] transition-colors flex items-center"
                >
                  <Download className="w-4 h-4 mr-2" />
                  <span className="font-medium">Download Template</span>
                </motion.button>
              </div>
            </div>

            {/* Upload Section */}
            <div
              className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors backdrop-blur-sm ${dragActive
                ? "border-blue-500 dark:border-[#60a5fa] bg-blue-50 dark:bg-[#3b82f6]/10"
                : selectedFile
                  ? "border-blue-300 dark:border-[#60a5fa]/40 bg-blue-50/50 dark:bg-[#3b82f6]/5"
                  : "border-gray-300 dark:border-gray-700/50 hover:border-gray-400 dark:hover:border-gray-600/70 bg-gray-50/50 dark:bg-gray-900/20"
                }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                aria-label="Upload CSV or Excel file"
                title="Upload employee data file"
                disabled={isUploading}
              />
              <div className="space-y-4">
                <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center border ${selectedFile
                  ? "bg-blue-100 dark:bg-[#3b82f6]/10 border-blue-200 dark:border-[#3b82f6]/30"
                  : "bg-gray-100 dark:bg-gray-900/60 border-gray-300 dark:border-gray-700/50"
                  }`}>
                  {isUploading ? (
                    <Loader className="w-10 h-10 text-blue-600 dark:text-[#93c5fd] animate-spin" />
                  ) : selectedFile ? (
                    <Check className="w-10 h-10 text-blue-600 dark:text-[#93c5fd]" />
                  ) : (
                    <Upload className="w-10 h-10 text-blue-600 dark:text-[#93c5fd]" />
                  )}
                </div>
                <div>
                  <h4 className="font-semibold text-lg text-black dark:text-white mb-2">
                    {selectedFile ? selectedFile.name : "Drop your file here"}
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {selectedFile
                      ? `${(selectedFile.size / 1024).toFixed(1)}KB - ${selectedFile.type}`
                      : "Support for CSV and Excel files"}
                  </p>
                  {selectedFile && !isUploading && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={resetFileSelection}
                      className="text-red-600 dark:text-red-400 text-sm hover:text-red-700 dark:hover:text-red-300 transition-colors mt-3"
                    >
                      Remove file
                    </motion.button>
                  )}
                </div>
              </div>
            </div>

            {/* Upload Status */}
            {uploadStatus && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-xl p-5 border ${uploadStatus.success
                  ? "bg-green-50 dark:bg-[#3b82f6]/5 border-green-300 dark:border-[#3b82f6]/20"
                  : "bg-red-50 dark:bg-red-400/10 border-red-300 dark:border-red-400/20"
                  }`}
              >
                <div className="flex items-start space-x-4">
                  <div className={`p-2 rounded-full ${uploadStatus.success
                    ? "bg-green-100 dark:bg-[#3b82f6]/10"
                    : "bg-red-100 dark:bg-red-400/10"
                    }`}>
                    {uploadStatus.success ? (
                      <Check className="w-5 h-5 text-green-600 dark:text-[#93c5fd]" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className={`font-semibold text-base ${uploadStatus.success ? "text-green-700 dark:text-[#93c5fd]" : "text-red-700 dark:text-red-400"
                      }`}>
                      {uploadStatus.message}
                    </h4>
                    {uploadStatus.details && uploadStatus.details.length > 0 && (
                      <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-300">
                        {uploadStatus.details.map((detail, index) => (
                          <li key={index}>{detail}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Guidelines */}
            <div className="p-5 rounded-lg border border-blue-200 dark:border-[#a5b4fc]/20 bg-blue-50/50 dark:bg-[#a5b4fc]/5 backdrop-blur-sm">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-full bg-blue-100 dark:bg-[#a5b4fc]/10 mt-0.5">
                  <AlertCircle className="w-4 h-4 text-blue-600 dark:text-[#ddd6fe] flex-shrink-0" />
                </div>
                <div className="flex-1">
                  <p className="text-black dark:text-white font-medium mb-2">Important Guidelines</p>
                  <ul className="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400 text-sm">
                    <li>Required fields: name, email, designation, salary, wallet</li>
                    <li>Wallet addresses must be valid Ethereum addresses</li>
                    <li>Maximum 100 employees per upload</li>
                    <li>File size should not exceed 5MB</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="px-6 py-5 border-t border-gray-200 dark:border-gray-800/60 bg-gray-50/50 dark:bg-transparent backdrop-blur-sm">
            <div className="flex justify-end gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                className="px-6 py-3 rounded-xl border border-gray-300 dark:border-gray-700/80 bg-white dark:bg-gray-800/50 text-black dark:text-gray-300
                        hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-black dark:hover:text-white hover:border-gray-400 dark:hover:border-gray-600 transition-all duration-200 backdrop-blur-sm"
                disabled={isUploading}
              >
                Cancel
              </motion.button>

              <motion.button
                whileHover={!isUploading && selectedFile && !uploadStatus?.success ? { scale: 1.02 } : {}}
                whileTap={!isUploading && selectedFile && !uploadStatus?.success ? { scale: 0.98 } : {}}
                onClick={handleUpload}
                disabled={!selectedFile || isUploading || (uploadStatus?.success === true)}
                className={`px-6 py-3 rounded-xl transition-all font-medium
                  ${!selectedFile || isUploading || (uploadStatus?.success === true)
                    ? "bg-gradient-to-r from-blue-400/70 to-blue-500/70 dark:from-[#60a5fa]/40 dark:to-[#3b82f6]/40 text-white/70 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 dark:from-[#60a5fa] dark:to-[#3b82f6] dark:hover:from-[#3b82f6] dark:hover:to-[#2563eb] text-white shadow-lg shadow-blue-500/20 dark:shadow-[#3b82f6]/20 hover:shadow-blue-500/30 dark:hover:shadow-[#3b82f6]/30"
                  }`}
              >
                {isUploading ? (
                  <span className="flex items-center">
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </span>
                ) : uploadStatus?.success ? (
                  <span className="flex items-center">
                    <Check className="w-4 h-4 mr-2" />
                    Uploaded
                  </span>
                ) : (
                  "Upload & Process"
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default BulkUploadModal;