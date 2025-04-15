"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, DollarSign, AlertCircle, Wallet, RefreshCw, CheckCircle } from "lucide-react";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, usePublicClient } from 'wagmi';
import TokenSelector from './TokenSelector';
import { allMainnetChains as chains } from '@/lib/evm-chains-mainnet';
import { tokensPerMainnetChain as tokens, Token } from '@/lib/evm-tokens-mainnet';
import { getExchangeRate } from '@/lib/chainlink-helper';
import { ethers } from 'ethers';

interface ConfigurePayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExchangeRateUpdate?: (rate: number, tokenSymbol: string) => void;
}

const ConfigurePayModal: React.FC<ConfigurePayModalProps> = ({
  isOpen,
  onClose,
  onExchangeRateUpdate
}) => {
  // Wallet connection state
  const { address, isConnected, chainId } = useAccount();
  const publicClient = usePublicClient();

  // UI state
  const [selectedChain, setSelectedChain] = useState<number | undefined>(undefined);
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [exchangeRate, setExchangeRate] = useState(1);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationComplete, setCalculationComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-update exchange rate state
  const [autoUpdateActive, setAutoUpdateActive] = useState(true);
  const autoUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateTimeRef = useRef<number>(Date.now());

  // Initialize or update chain and token when connected or chain changes
  useEffect(() => {
    if (chainId) {
      // Set the chain
      setSelectedChain(chainId);

      // Find a valid token for this chain - if current token isn't valid for this chain
      const availableTokens = tokens[chainId] || [];
      if (availableTokens.length > 0) {
        // Always select the first token when chain changes
        const newToken = availableTokens[0];
        setSelectedToken(newToken);

        // Fetch exchange rate for the new token on this chain
        fetchChainlinkExchangeRate(newToken, chainId);
      } else {
        setSelectedToken(null);
        setError("No tokens available for this chain");
      }
    } else if (!chainId && isConnected) {
      // Default to first chain if connected but no chain ID
      const defaultChain = chains[0];
      setSelectedChain(defaultChain.id);

      const defaultToken = tokens[defaultChain.id]?.[0];
      if (defaultToken) {
        setSelectedToken(defaultToken);
        fetchChainlinkExchangeRate(defaultToken, defaultChain.id);
      }
    } else {
      // Not connected, use defaults
      const defaultChain = chains[0];
      setSelectedChain(defaultChain.id);
      setSelectedToken(tokens[defaultChain.id]?.[0] || null);
    }
  }, [chainId, isConnected]);

  // Setup auto-update interval
  useEffect(() => {
    // Clear any existing interval
    if (autoUpdateIntervalRef.current) {
      clearInterval(autoUpdateIntervalRef.current);
      autoUpdateIntervalRef.current = null;
    }

    // Only set up interval if auto-update is active and we have a valid token and chain
    if (autoUpdateActive && selectedToken && selectedChain && isOpen) {
      autoUpdateIntervalRef.current = setInterval(() => {
        // Only fetch if we're not already calculating and at least 30 seconds have passed
        const now = Date.now();
        if (!isCalculating && now - lastUpdateTimeRef.current >= 30000) {
          console.log("Auto-updating exchange rate...");
          lastUpdateTimeRef.current = now;
          fetchChainlinkExchangeRate(selectedToken, selectedChain, true);
        }
      }, 5000); // Check every 5 seconds, but only update if 30 seconds have passed
    }

    // Cleanup on unmount or when dependencies change
    return () => {
      if (autoUpdateIntervalRef.current) {
        clearInterval(autoUpdateIntervalRef.current);
        autoUpdateIntervalRef.current = null;
      }
    };
  }, [autoUpdateActive, selectedToken, selectedChain, isOpen, isCalculating]);

  // Cancel auto-updates when modal closes
  useEffect(() => {
    if (!isOpen) {
      setAutoUpdateActive(false);
      if (autoUpdateIntervalRef.current) {
        clearInterval(autoUpdateIntervalRef.current);
        autoUpdateIntervalRef.current = null;
      }
    } else {
      // Re-enable auto-updates when modal opens
      setAutoUpdateActive(true);
    }
  }, [isOpen]);

  // Fetch exchange rate from Chainlink oracle
  const fetchChainlinkExchangeRate = async (token: Token, chainForRate: number, isAutoUpdate = false) => {
    if (!token || !chainForRate) return;

    // For auto-updates, use a less intrusive UI update
    if (!isAutoUpdate) {
      setIsCalculating(true);
      setCalculationComplete(false);
      setError(null);
    } else {
      // For auto-updates, just set a simple calculating flag but don't reset other UI states
      setIsCalculating(true);
    }

    try {
      // Create ethers provider from the Wagmi publicClient
      let provider;
      if (publicClient && 'transport' in publicClient && 'url' in publicClient.transport) {
        provider = new ethers.JsonRpcProvider(publicClient.transport.url);
      } else {
        // Fallback to a default provider if we can't get one from publicClient
        const chainConfig = chains.find(c => c.id === chainForRate);
        if (!chainConfig?.rpcUrls?.default?.http?.[0]) {
          throw new Error(`No RPC URL found for chain ${chainForRate}`);
        }

        provider = new ethers.JsonRpcProvider(chainConfig.rpcUrls.default.http[0]);
      }

      // Only show loading delay for manual updates, not auto-updates
      if (!isAutoUpdate) {
        await new Promise(resolve => setTimeout(resolve, 800)); // Reduced from 1500ms for better UX
      }

      // Get the exchange rate - make sure we use the passed chain ID
      // This will automatically use CoinGecko as fallback if Chainlink fails
      const rate = await getExchangeRate(
        provider,
        token.symbol,
        chainForRate
      );

      setExchangeRate(rate);

      if (onExchangeRateUpdate) {
        onExchangeRateUpdate(rate, token.symbol);
      }

      setIsCalculating(false);

      // Only update completion UI for manual updates
      if (!isAutoUpdate) {
        setCalculationComplete(true);
        // Reset completion status after a delay
        setTimeout(() => {
          setCalculationComplete(false);
        }, 3000);
      }
    } catch (err) {
      console.error("Error fetching exchange rate:", err);

      // Only show errors for manual updates
      if (!isAutoUpdate) {
        setError("Failed to fetch current exchange rate. Using estimated rate instead.");
      }

      // Let the getExchangeRate function handle all fallbacks
      try {
        // Even if provider creation failed, we can pass null and let getExchangeRate handle it
        const fallbackRate = await getExchangeRate(
          null as any, // This will trigger the fallback logic in getExchangeRate
          token.symbol,
          chainForRate
        );

        setExchangeRate(fallbackRate);

        if (onExchangeRateUpdate) {
          onExchangeRateUpdate(fallbackRate, token.symbol);
        }
      } catch (fallbackErr) {
        // If even the fallback fails, use a simple default
        const safeRate = token.symbol.includes('USD') ? 1 : 0.01;
        setExchangeRate(safeRate);

        if (onExchangeRateUpdate) {
          onExchangeRateUpdate(safeRate, token.symbol);
        }
      }

      setIsCalculating(false);

      // Only update completion UI for manual updates
      if (!isAutoUpdate) {
        setCalculationComplete(true);
        setTimeout(() => {
          setCalculationComplete(false);
          setError(null);
        }, 3000);
      }
    }
  };

  // Handle token change
  const handleTokenChange = (token: Token) => {
    setSelectedToken(token);

    // Update lastUpdateTimeRef to now since we're doing a manual update
    lastUpdateTimeRef.current = Date.now();

    // Make sure we pass the current chain ID when fetching the exchange rate
    if (selectedChain) {
      fetchChainlinkExchangeRate(token, selectedChain);
    }
  };

  // Handle Apply Settings button
  const handleApplySettings = () => {
    // Stop auto-updating when settings are applied
    setAutoUpdateActive(false);
    if (autoUpdateIntervalRef.current) {
      clearInterval(autoUpdateIntervalRef.current);
      autoUpdateIntervalRef.current = null;
    }
    onClose();
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
          className="bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-black/95 w-full max-w-2xl rounded-2xl border border-gray-200 dark:border-[#a5b4fc]/20 overflow-hidden shadow-2xl shadow-black/60 backdrop-blur-xl"
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-[#a5b4fc]/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-full bg-blue-100 dark:bg-[#3b82f6]/20 shadow-inner shadow-blue-200/50 dark:shadow-[#60a5fa]/10">
                  <DollarSign className="w-6 h-6 text-blue-600 dark:text-[#93c5fd]" />
                </div>
                <h2 className="text-2xl font-bold text-black dark:text-white tracking-tight">
                  Configure Payments
                </h2>
              </div>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-[#93c5fd] transition-colors p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-white/5"
                aria-label="Close modal"
                disabled={isCalculating}
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Wallet Connection Section */}
            <div className={`p-5 rounded-xl border backdrop-blur-sm
                ${isConnected
                ? 'border-blue-300 dark:border-[#60a5fa]/20 bg-blue-50/50 dark:bg-[#3b82f6]/5 shadow-md shadow-blue-500/5 dark:shadow-[#3b82f6]/5'
                : 'border-gray-200 dark:border-gray-800/60 bg-gray-50/50 dark:bg-gray-900/30'}`}>
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <Wallet className={`w-5 h-5 ${isConnected ? 'text-blue-600 dark:text-[#93c5fd]' : 'text-gray-500 dark:text-gray-500'}`} />
                  <span className={`font-semibold ${isConnected ? 'text-black dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                    Wallet Connection
                  </span>
                </div>
                <ConnectButton showBalance={false} accountStatus="avatar" chainStatus="name" />
              </div>

              {!isConnected && (
                <div className="py-3 px-4 mt-3 rounded-lg bg-gray-100 dark:bg-gray-800/30 border border-gray-200 dark:border-gray-800/60">
                  <p className="text-center text-gray-600 dark:text-gray-400 text-sm">
                    Connect your wallet to configure payment settings
                  </p>
                </div>
              )}
            </div>

            {/* Token Settings - Only visible when wallet is connected */}
            {isConnected && selectedToken && selectedChain && (
              <div className="space-y-5">
                {/* Token Selection */}
                <div className="p-5 rounded-xl border border-gray-200 dark:border-gray-800/60 bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-black/95 backdrop-blur-sm">
                  <div className="flex items-center justify-between gap-3 mb-5">
                    <div className="flex items-center gap-3">
                      <DollarSign className="w-5 h-5 text-blue-600 dark:text-[#93c5fd]" />
                      <span className="font-semibold text-black dark:text-white">Payment Token</span>
                    </div>
                    <div className="flex items-center px-3 py-1.5 rounded-full bg-blue-100 dark:bg-[#3b82f6]/10 border border-blue-200 dark:border-[#3b82f6]/20">
                      <RefreshCw className={`w-3.5 h-3.5 mr-2 ${isCalculating ? 'animate-spin text-blue-600 dark:text-[#93c5fd]' : 'text-blue-500 dark:text-[#60a5fa]'}`} />
                      <span className="text-xs text-blue-800 dark:text-[#ddd6fe]">Auto-updates every 30s</span>
                    </div>
                  </div>

                  <TokenSelector
                    tokens={tokens[selectedChain] || []}
                    selectedToken={selectedToken}
                    onTokenChange={handleTokenChange}
                    address={address as `0x${string}`}
                    chainId={selectedChain}
                    isConnected={isConnected}
                    isLoading={isCalculating}
                    exchangeRate={exchangeRate}
                    onExchangeRateChange={() => { }}
                  />
                </div>

                {/* Exchange Rate Status */}
                {isCalculating && !calculationComplete && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-lg border border-gray-200 dark:border-gray-800/60 bg-gray-50 dark:bg-gray-900/30 backdrop-blur-sm flex items-center gap-3"
                  >
                    <div className="p-1.5 rounded-full bg-blue-100 dark:bg-[#3b82f6]/10">
                      <RefreshCw className="w-4 h-4 text-blue-600 dark:text-[#93c5fd] animate-spin" />
                    </div>
                    <span className="text-gray-700 dark:text-gray-300 text-sm">
                      Fetching Chainlink price feed for {selectedToken?.symbol}...
                    </span>
                  </motion.div>
                )}

                {calculationComplete && !error && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-lg border border-green-300 dark:border-[#3b82f6]/20 bg-green-50 dark:bg-[#3b82f6]/5 backdrop-blur-sm flex items-center gap-3"
                  >
                    <div className="p-1.5 rounded-full bg-green-100 dark:bg-[#3b82f6]/10">
                      <CheckCircle className="w-4 h-4 text-green-600 dark:text-[#93c5fd]" />
                    </div>
                    <span className="text-green-800 dark:text-gray-200 text-sm">
                      Exchange rate updated from Chainlink: 1 USD = {exchangeRate.toFixed(6)} {selectedToken?.symbol}
                    </span>
                  </motion.div>
                )}

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-lg border border-amber-400 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-900/10 backdrop-blur-sm flex items-center gap-3"
                  >
                    <div className="p-1.5 rounded-full bg-amber-100 dark:bg-amber-500/10">
                      <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <span className="text-amber-800 dark:text-amber-200 text-sm">
                      {error}
                    </span>
                  </motion.div>
                )}

                {/* Info Block */}
                <div className="p-5 rounded-lg border border-blue-200 dark:border-[#a5b4fc]/20 bg-blue-50/50 dark:bg-[#a5b4fc]/5 backdrop-blur-sm">
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-full bg-blue-100 dark:bg-[#a5b4fc]/10 mt-0.5">
                      <AlertCircle className="w-4 h-4 text-blue-600 dark:text-[#ddd6fe] flex-shrink-0" />
                    </div>
                    <div className="flex-1">
                      <p className="text-black dark:text-white font-medium text-sm mb-2">About Exchange Rates</p>
                      <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                        Exchange rates are fetched from Chainlink price feeds to provide accurate
                        market data. Employee salaries will be converted from USD to the selected
                        token using this exchange rate.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
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
                disabled={isCalculating}
              >
                {isCalculating ? (
                  <span className="flex items-center">
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </span>
                ) : "Cancel"}
              </motion.button>

              {isConnected && !isCalculating && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleApplySettings}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 dark:from-[#60a5fa] dark:to-[#3b82f6]
                          hover:from-blue-600 hover:to-blue-700 dark:hover:from-[#3b82f6] dark:hover:to-[#2563eb] text-white transition-all duration-200
                          shadow-lg shadow-blue-500/20 dark:shadow-[#3b82f6]/20 hover:shadow-blue-500/30 dark:hover:shadow-[#3b82f6]/30 font-medium"
                >
                  Apply Settings
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ConfigurePayModal;