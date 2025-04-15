"use client";
import { useEffect } from 'react';
import { Wallet, AlertTriangle, PlusCircle, ChevronDown, RefreshCw, BarChart3 } from 'lucide-react';
import { useBalance } from 'wagmi';
import { formatUnits } from 'ethers';
import { NATIVE_ADDRESS, Token } from '@/lib/evm-tokens-mainnet';

interface TokenSelectorProps {
    tokens: Token[];
    selectedToken: Token;
    onTokenChange: (token: Token) => void;
    address?: `0x${string}`;
    chainId?: number;
    isConnected: boolean;
    isLoading: boolean;
    exchangeRate: number;
    onExchangeRateChange: (rate: number) => void;
}

const TokenSelector = ({
    tokens,
    selectedToken,
    onTokenChange,
    address,
    chainId,
    isConnected,
    isLoading,
    exchangeRate,
    onExchangeRateChange
}: TokenSelectorProps) => {
    // Balance hook with error handling
    const {
        data: balance,
        isLoading: isBalanceLoading,
        error: balanceError,
        refetch: refetchBalance
    } = useBalance({
        address: address,
        token: selectedToken?.address === NATIVE_ADDRESS
            ? undefined
            : (selectedToken?.address as `0x${string}`),
        chainId: chainId,
        query: {
            enabled: isConnected && !!selectedToken && !!address,
            retry: 3,
            retryDelay: 1000
        }
    });

    // Format balance for display
    const formattedBalance = balance
        ? parseFloat(formatUnits(balance.value, balance.decimals)).toFixed(4)
        : '0';

    // Handle external token addition
    const handleAddToken = async () => {
        if (!window.ethereum) return false;
        if (selectedToken.address === NATIVE_ADDRESS) return true;

        try {
            const wasAdded = await window.ethereum.request({
                method: "wallet_watchAsset",
                params: {
                    type: "ERC20",
                    options: {
                        address: selectedToken.address,
                        symbol: selectedToken.symbol,
                        decimals: selectedToken.decimals || 18,
                    },
                },
            });
            return !!wasAdded;
        } catch (error) {
            console.error("Error adding token to wallet:", error);
            return false;
        }
    };

    // Force balance refetch when token changes
    useEffect(() => {
        if (isConnected && selectedToken && address) {
            refetchBalance();
        }
    }, [selectedToken?.address, refetchBalance, isConnected, address]);

    if (!isConnected) {
        return (
            <div className="flex items-center justify-center py-4 rounded-lg bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-[#a5b4fc]/10 backdrop-blur-sm">
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Connect your wallet to select payment tokens
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Token Selection */}
            <div className="relative">
                <select
                    value={selectedToken.address}
                    onChange={(e) => {
                        const token = tokens.find(t => t.address === e.target.value);
                        if (token) onTokenChange(token);
                    }}
                    className="w-full p-3 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-[#a5b4fc]/20 rounded-xl
                             text-black dark:text-[#F2F2F2] focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-[#60a5fa]/50
                             transition-all text-base appearance-none backdrop-blur-sm"
                    disabled={isLoading}
                >
                    {tokens?.map(token => (
                        <option key={token.address} value={token.address} className="bg-white dark:bg-gray-900 text-black dark:text-white">
                            {token.symbol}
                        </option>
                    ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {selectedToken.address !== NATIVE_ADDRESS && (
                        <button
                            onClick={handleAddToken}
                            className="p-1.5 text-blue-600 dark:text-[#93c5fd] rounded-md hover:bg-blue-100 dark:hover:bg-[#3b82f6] transition-colors"
                            title="Add token to wallet"
                            disabled={isLoading}
                        >
                            <PlusCircle className="w-4 h-4" />
                        </button>
                    )}
                    <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </div>
            </div>

            {/* Token Info Grid */}
            <div className="grid grid-cols-2 gap-3">
                {/* Balance */}
                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-[#a5b4fc]/20 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                            <Wallet className="w-3.5 h-3.5 text-blue-600 dark:text-[#93c5fd]" />
                            <p className="text-gray-600 dark:text-gray-400 text-xs">Balance</p>
                        </div>
                        <button
                            onClick={() => refetchBalance()}
                            className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-[#93c5fd] transition-colors"
                            title="Refresh balance"
                            disabled={isBalanceLoading}
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${isBalanceLoading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                    <div className="flex items-center justify-between">
                        <p className="text-black dark:text-[#F2F2F2] text-sm">
                            {isBalanceLoading ? 'Loading...' : formattedBalance}
                        </p>
                        <span className="text-blue-800 dark:text-[#93c5fd] text-xs px-1.5 py-0.5 bg-blue-100 dark:bg-[#3b82f6]/10 rounded">
                            {selectedToken?.symbol}
                        </span>
                    </div>
                </div>

                {/* Exchange Rate */}
                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-[#a5b4fc]/20 backdrop-blur-sm">
                    <div className="flex items-center gap-1.5 mb-1">
                        <BarChart3 className="w-3.5 h-3.5 text-blue-600 dark:text-[#93c5fd]" />
                        <p className="text-gray-600 dark:text-gray-400 text-xs">Exchange Rate</p>
                    </div>
                    <div className="flex items-baseline justify-between">
                        <div className="text-black dark:text-[#F2F2F2] text-sm flex items-baseline gap-1">
                            <span>1 USD =</span>
                            <span className="text-blue-700 dark:text-[#93c5fd]">
                                {isLoading ? '...' : exchangeRate.toFixed(4)}
                            </span>
                        </div>
                        <span className="text-blue-800 dark:text-[#93c5fd] text-xs px-1.5 py-0.5 bg-blue-100 dark:bg-[#3b82f6]/10 rounded">
                            {selectedToken?.symbol}
                        </span>
                    </div>
                </div>
            </div>

            {/* Error message */}
            {balanceError && (
                <div className="p-2.5 bg-red-100 dark:bg-red-400/10 border border-red-300 dark:border-red-400/30 rounded-lg flex gap-2 items-center backdrop-blur-sm">
                    <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                    <p className="text-red-800 dark:text-gray-200 text-xs">
                        Error fetching balance. Please check your connection.
                    </p>
                </div>
            )}
        </div>
    );
};

export default TokenSelector;