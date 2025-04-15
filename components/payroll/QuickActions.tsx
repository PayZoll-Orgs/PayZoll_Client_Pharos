"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardList,
  UserPlus,
  Upload,
  ArrowUpRight,
  ChevronDown,
  X
} from "lucide-react";

interface QuickActionsProps {
  onAddEmployee: () => void;
  onBulkUpload: () => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({ onAddEmployee, onBulkUpload }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Define quick action cards
  const actionCards = [
    {
      title: "Add Employee",
      description: "Add a new team member to your organization",
      icon: UserPlus,
      onClick: () => {
        onAddEmployee();
        setIsOpen(false);
      }
    },
    {
      title: "Bulk Upload",
      description: "Import multiple employees from CSV/Excel",
      icon: Upload,
      onClick: () => {
        onBulkUpload();
        setIsOpen(false);
      }
    },
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Glassmorphic Trigger Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`flex items-center gap-2 backdrop-blur-md 
                  bg-gray-200/30 dark:bg-white/10 border border-gray-300/50 dark:border-white/20 
                  shadow-lg transition-all duration-300 
                  hover:bg-gray-300/40 dark:hover:bg-gradient-to-r dark:hover:from-gray-600/30 dark:hover:to-gray-700/30 
                  hover:border-gray-400/60 dark:hover:border-white/30 
                  rounded-lg px-4 py-2.5 focus:outline-none
                  ${isOpen ? 'bg-gray-300/40 dark:bg-white/15 border-gray-400/60 dark:border-white/30' : ''}`}
      >
        <ClipboardList className="w-4 h-4 text-black dark:text-white" />
        <span className="md:font-bold md:text-lg font-medium text-sm text-black dark:text-white whitespace-nowrap">Quick Actions</span>
        {isOpen ? (
          <X className="w-4 h-4 text-black dark:text-white" />
        ) : (
          <ChevronDown className={`w-4 h-4 text-black dark:text-white transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        )}
      </motion.button>

      {/* Glassmorphic Dropdown Content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-full mt-2 z-50 w-72 sm:w-80 md:w-96"
          >
            <div className="rounded-xl p-5 overflow-hidden 
                           bg-gradient-to-br from-gray-100/80 to-gray-200/90 dark:from-white/8 dark:to-white/3 
                           backdrop-blur-lg border border-gray-300/50 dark:border-white/10 
                           shadow-xl shadow-black/20 dark:shadow-black/40">
              <div className="mb-4">
                <h2 className="text-lg font-bold text-black dark:text-white">Quick Actions</h2>
                <p className="text-gray-600 dark:text-white/70 text-xs mt-1">Manage your workforce efficiently</p>
              </div>

              {/* Glassmorphic Quick Action Cards */}
              <div className="space-y-3">
                {actionCards.map((card, index) => (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={card.onClick}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="w-full group rounded-xl p-3 flex items-start gap-3 transition-all 
                              duration-300 
                              bg-gradient-to-br from-gray-50/50 to-gray-100/70 dark:from-white/5 dark:to-white/2 
                              border border-gray-200/60 dark:border-white/10 shadow-md 
                              hover:bg-gradient-to-br hover:from-gray-100/60 hover:to-gray-200/80 dark:hover:from-white/10 dark:hover:to-white/5"
                  >
                    <div className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center
                                  transform transition-all group-hover:scale-110 
                                  bg-gradient-to-br from-gray-200/50 to-gray-300/40 dark:from-white/10 dark:to-white/5 
                                  border border-gray-300/40 dark:border-white/10">
                      <card.icon className="w-5 h-5 text-black dark:text-white" />
                    </div>

                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-semibold text-black dark:text-white group-hover:text-gray-800 dark:group-hover:text-white/90 transition-colors">
                          {card.title}
                        </h3>
                        <ArrowUpRight className="w-3.5 h-3.5 text-gray-500 dark:text-white/60 group-hover:text-gray-700 dark:group-hover:text-white/80 transition-colors" />
                      </div>
                      <p className="text-xs text-gray-600 dark:text-white/70 group-hover:text-gray-700 dark:group-hover:text-white/80 transition-colors">{card.description}</p>
                    </div>
                  </motion.button>
                ))}
              </div>

              <div className="mt-4 pt-3 border-t border-gray-300/50 dark:border-white/10">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setIsOpen(false)}
                  className="text-xs text-gray-700 dark:text-white/80 hover:text-black dark:hover:text-white transition-colors w-full text-center py-1"
                >
                  Close
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default QuickActions;