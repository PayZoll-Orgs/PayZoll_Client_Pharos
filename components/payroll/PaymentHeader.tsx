"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import TransactionsLog from "./TransactionsLog";
import QuickActions from "./QuickActions";
import { useAuth } from "@/context/authContext";

interface PaymentsHeaderProps {
  onConfigurePayments: () => void;
  onAddEmployee: () => void;
  onBulkUpload: () => void;
}

const PaymentsHeader: React.FC<PaymentsHeaderProps>
  = ({
    onConfigurePayments,
    onAddEmployee,
    onBulkUpload, }) => {
    const [showLogs, setShowLogs] = useState(false);
    const { user, logout } = useAuth();
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    return (
      <div className="mb-8 w-[80%] x-4 md:px-6">

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
          <div className="w-full md:w-auto">
            <h1 className="text-2xl md:text-4xl font-bold text-black dark:text-white " style={{
              textShadow: "0 0 5px rgba(45, 139, 117, 0.4), 0 0 10px rgba(45, 139, 117, 0.2)"
            }}>
              {user?.company}
            </h1>
            <p className="md:text-lg text-sm text-black dark:text-white mt-1 ">Add, Edit, Control and Process Payroll </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4 w-full md:w-auto">
            <QuickActions
              onAddEmployee={onAddEmployee}
              onBulkUpload={onBulkUpload}
            />

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => { setShowLogs(true); }}
              className="relative py-2.5 px-4 rounded-lg backdrop-blur-md bg-gray-200/30 dark:bg-white/10 border border-gray-300/50 dark:border-white/20 shadow-lg transition-all duration-300 hover:bg-gray-300/40 dark:hover:bg-gradient-to-r dark:hover:from-gray-600/30 dark:hover:to-gray-700/30 hover:border-gray-400/60 dark:hover:border-white/30 w-full sm:w-auto flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-black dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span className="md:font-bold font-medium text-sm md:text-lg whitespace-nowrap text-black dark:text-white">Transaction Logs</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onConfigurePayments}
              className="relative py-2.5 px-4 rounded-lg backdrop-blur-md bg-gray-200/30 dark:bg-white/10 border border-gray-300/50 dark:border-white/20 shadow-lg transition-all duration-300 hover:bg-gray-300/40 dark:hover:bg-gradient-to-r dark:hover:from-gray-600/30 dark:hover:to-gray-700/30 hover:border-gray-400/60 dark:hover:border-white/30 w-full sm:w-auto flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-black dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="md:font-bold font-medium text-sm md:text-lg whitespace-nowrap text-black dark:text-white">Configure Payments</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowLogoutModal(true)}
              className="relative text-white py-2.5 px-4 rounded-lg backdrop-blur-md bg-blue-500 border border-blue-400 shadow-lg 
  transition-all duration-300 hover:bg-gradient-to-r hover:from-indigo-400 hover:to-indigo-600 hover:border-indigo-500
  w-full sm:w-auto flex items-center justify-center gap-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              <span className="md:font-bold font-medium text-sm md:text-lg whitespace-nowrap">Logout</span>
            </motion.button>
          </div>
        </div>
        <TransactionsLog
          isOpen={showLogs}
          onClose={() => setShowLogs(false)}
        />
        {showLogoutModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setShowLogoutModal(false)}
            style={{ position: 'fixed', left: 0, top: 0, width: '100vw', height: '100vh' }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0c0f16] border border-[#22304a]/50 rounded-xl p-6 w-[20%] shadow-xl"
            >
              <h3 className="text-[#F2F2F2] text-lg font-semibold mb-2 ">Confirm Logout</h3>
              <p className="text-gray-400 mb-4 ">Are you sure you want to logout from your account?</p>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="flex-1 px-4 py-2 border border-[#22304a]/50 text-gray-400 rounded-lg hover:bg-white/5  transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    logout();
                    setShowLogoutModal(false);
                  }}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  Logout
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    );
  };

export default PaymentsHeader;