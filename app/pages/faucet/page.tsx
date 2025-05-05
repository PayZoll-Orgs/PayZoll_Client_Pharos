"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ethers } from 'ethers';
import { Droplet, ArrowRight, CheckCircle, XCircle, RefreshCw, AlertCircle, Wallet, Plus } from 'lucide-react';
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { pharos } from "@/lib/evm-chains-mainnet";
import { tokensPerMainnetChain } from "@/lib/evm-tokens-mainnet";

// Faucet contract ABI
const FAUCET_ABI = [
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_tokenAddress",
                "type": "address"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "newAmount",
                "type": "uint256"
            }
        ],
        "name": "ClaimAmountChanged",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "previousOwner",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "newOwner",
                "type": "address"
            }
        ],
        "name": "OwnershipTransferred",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "to",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "TokensClaimed",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "from",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "TokensDeposited",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "to",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "TokensWithdrawn",
        "type": "event"
    },
    {
        "inputs": [],
        "name": "claimAmount",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_recipient",
                "type": "address"
            }
        ],
        "name": "claimTokens",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_amount",
                "type": "uint256"
            }
        ],
        "name": "depositTokens",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getBalance",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "owner",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "renounceOwnership",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_amount",
                "type": "uint256"
            }
        ],
        "name": "setClaimAmount",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "token",
        "outputs": [
            {
                "internalType": "contract IERC20",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "newOwner",
                "type": "address"
            }
        ],
        "name": "transferOwnership",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_amount",
                "type": "uint256"
            }
        ],
        "name": "withdrawTokens",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
];

// Replace with actual contract address when deployed
const FAUCET_CONTRACT_ADDRESS = "0x4D4b07a985a6D20760639e7F3792305fCa284538";

export default function FaucetPage() {
    // State for ethers connection
    const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
    const [signer, setSigner] = useState<ethers.Signer | null>(null);
    const [contract, setContract] = useState<ethers.Contract | null>(null);
    const [address, setAddress] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [networkName, setNetworkName] = useState("");
    const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);

    // Keep existing UI states
    const [isLoading, setIsLoading] = useState(false);
    const [lastRequest, setLastRequest] = useState<string | null>(null);
    const [cooldownRemaining, setCooldownRemaining] = useState<number | null>(null);
    const [progressValue, setProgressValue] = useState(0);

    // Add contract data states
    const [claimAmount, setClaimAmount] = useState<ethers.BigNumberish | null>(null);
    const [isLoadingClaimAmount, setIsLoadingClaimAmount] = useState(true);
    const [faucetBalance, setFaucetBalance] = useState<ethers.BigNumberish | null>(null);
    const [isLoadingBalance, setIsLoadingBalance] = useState(true);
    const [txPending, setTxPending] = useState(false);
    const [txError, setTxError] = useState<Error | null>(null);
    const [txSuccess, setTxSuccess] = useState(false);

    // Add new state for wallet operations
    const [isAddingChain, setIsAddingChain] = useState(false);
    const [isAddingToken, setIsAddingToken] = useState(false);

    // Format the amounts for display
    const formattedClaimAmount = claimAmount ? parseFloat(ethers.formatUnits(claimAmount, 18)).toFixed(2) : "0";
    const formattedFaucetBalance = faucetBalance ? parseFloat(ethers.formatUnits(faucetBalance, 18)).toFixed(2) : "0";

    // Connect wallet function
    const connectWallet = async () => {
        if (window.ethereum) {
            try {
                setIsLoading(true);

                // Create provider and connect
                const ethersProvider = new ethers.BrowserProvider(window.ethereum);
                const accounts = await window.ethereum.request({
                    method: "eth_requestAccounts"
                });

                // Get signer and network
                const ethersSigner = await ethersProvider.getSigner();
                const network = await ethersProvider.getNetwork();

                // Check if correct network (adjust to your target network)
                const targetChainId = 1; // Mainnet, change as needed
                setIsCorrectNetwork(Number(network.chainId) === targetChainId);
                setNetworkName(network.name);

                // Save connection data
                setProvider(ethersProvider);
                setSigner(ethersSigner);
                setAddress(accounts[0]);
                setIsConnected(true);

                // Create contract instance
                const faucetContract = new ethers.Contract(
                    FAUCET_CONTRACT_ADDRESS,
                    FAUCET_ABI,
                    ethersSigner
                );
                setContract(faucetContract);

                // Initial data fetch
                fetchContractData(faucetContract);

                // Setup event listeners for account/chain changes
                window.ethereum.on('accountsChanged', handleAccountsChanged);
                window.ethereum.on('chainChanged', handleChainChanged);

            } catch (error) {
                console.error("Error connecting wallet:", error);
                toast.error("Failed to connect wallet");
            } finally {
                setIsLoading(false);
            }
        } else {
            toast.error("Please install a browser wallet like MetaMask");
        }
    };

    // Handle account changes
    const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
            // Disconnected
            disconnectWallet();
        } else if (accounts[0] !== address) {
            // Account changed
            setAddress(accounts[0]);
            // Refresh data with new account
            if (contract) fetchContractData(contract);
        }
    };

    // Handle chain changes
    const handleChainChanged = () => {
        // Reload page on chain change as recommended by MetaMask
        window.location.reload();
    };

    // Disconnect wallet
    const disconnectWallet = () => {
        setProvider(null);
        setSigner(null);
        setContract(null);
        setAddress(null);
        setIsConnected(false);
    };

    // Fetch contract data
    const fetchContractData = async (contractInstance: ethers.Contract) => {
        try {
            setIsLoadingClaimAmount(true);
            setIsLoadingBalance(true);

            // Fetch claim amount
            const amount = await contractInstance.claimAmount();
            setClaimAmount(amount);

            // Fetch balance
            const balance = await contractInstance.getBalance();
            setFaucetBalance(balance);

            // Update progress bar based on faucet balance
            const balanceFormatted = parseFloat(ethers.formatUnits(balance, 18));
            const value = balanceFormatted > 1000 ? 100 : (balanceFormatted / 10);
            setProgressValue(0);
            setTimeout(() => {
                setProgressValue(value);
            }, 500);

        } catch (error) {
            console.error("Error fetching contract data:", error);
            toast.error("Failed to load faucet data");
        } finally {
            setIsLoadingClaimAmount(false);
            setIsLoadingBalance(false);
        }
    };

    // Refetch data periodically
    useEffect(() => {
        let intervalId: any;

        if (contract && isConnected) {
            // Initial fetch
            fetchContractData(contract);

            // Set up interval for periodic updates
            intervalId = setInterval(() => {
                fetchContractData(contract);
            }, 30000); // Every 30 seconds
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [contract, isConnected]);

    // Handle token claim
    const handleClaimTokens = async () => {
        if (!contract || !isConnected) return;

        try {
            setIsLoading(true);
            setTxPending(true);

            // Call contract method
            const tx = await contract.claimTokens(address, {
                gasLimit: 100000
            });

            // Wait for transaction
            const receipt = await tx.wait();

            // Handle success
            setLastRequest(tx.hash);
            localStorage.setItem('lastZollpttFaucetRequest', Date.now().toString());
            setTxSuccess(true);

            // Show success toast
            toast.success(`You have received ${formattedClaimAmount} ZOLLPTT tokens!`, {
                icon: <CheckCircle className="h-5 w-5 text-green-500" />
            });

            // Refresh contract data
            fetchContractData(contract);

        } catch (error: any) {
            console.error('Error claiming tokens:', error);
            setTxError(error);
            toast.error("Failed to claim ZOLLPTT tokens", {
                icon: <XCircle className="h-5 w-5 text-red-500" />
            });
        } finally {
            setIsLoading(false);
            setTxPending(false);
        }
    };

    // Check for cooldown remaining - modified to use 1 minute instead of 24 hours
    useEffect(() => {
        const storedLastRequest = localStorage.getItem('lastZollpttFaucetRequest');
        if (storedLastRequest) {
            const lastTime = parseInt(storedLastRequest);
            const cooldownPeriod = 60 * 1000; // 1 minute cooldown
            const currentTime = Date.now();
            const timeSinceLastRequest = currentTime - lastTime;

            if (timeSinceLastRequest < cooldownPeriod) {
                const timeRemaining = cooldownPeriod - timeSinceLastRequest;
                setCooldownRemaining(timeRemaining);

                const interval = setInterval(() => {
                    setCooldownRemaining(prev => {
                        if (prev && prev > 1000) {
                            return prev - 1000;
                        } else {
                            clearInterval(interval);
                            localStorage.removeItem('lastZollpttFaucetRequest');
                            return null;
                        }
                    });
                }, 1000);

                return () => clearInterval(interval);
            } else {
                localStorage.removeItem('lastZollpttFaucetRequest');
            }
        }
    }, [isConnected, txSuccess]);

    // Format cooldown time into minutes and seconds
    const formatCooldown = (ms: number): string => {
        const seconds = Math.floor((ms / 1000) % 60);
        const minutes = Math.floor((ms / (1000 * 60)) % 60);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    // Function to add Pharos chain to wallet
    const addPharosChain = async () => {
        if (!window.ethereum) {
            toast.error("Please install a browser wallet like MetaMask");
            return;
        }

        try {
            setIsAddingChain(true);

            await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                    chainId: '0xC352',
                    chainName: 'Pharos Devnet',
                    nativeCurrency: { name: 'Pharos', symbol: 'ETH', decimals: 18 },
                    rpcUrls: ['https://devnet.dplabs-internal.com'],
                    blockExplorerUrls: ['https://pharosscan.xyz']
                }]
            });

            toast.success("Pharos network added to wallet", {
                icon: <CheckCircle className="h-5 w-5 text-green-500" />
            });
        } catch (error: any) {
            console.error("Error adding Pharos chain:", error);
            toast.error(error.message || "Failed to add Pharos chain", {
                icon: <XCircle className="h-5 w-5 text-red-500" />
            });
        } finally {
            setIsAddingChain(false);
        }
    };

    // Function to add ZOLLPTT token to wallet
    const addZollpttToken = async () => {
        if (!window.ethereum) {
            toast.error("Please install a browser wallet like MetaMask");
            return;
        }

        try {
            setIsAddingToken(true);

            // Get ZOLLPTT token details from our tokens list
            const zollpttToken = tokensPerMainnetChain[pharos.id].find(token => token.symbol === "ZOLLPTT");

            if (!zollpttToken) {
                throw new Error("ZOLLPTT token configuration not found");
            }

            await window.ethereum.request({
                method: 'wallet_watchAsset',
                params: {
                    type: 'ERC20',
                    options: {
                        address: zollpttToken.address,
                        symbol: zollpttToken.symbol,
                        decimals: zollpttToken.decimals,
                        image: 'https://payzoll.com/assets/zollptt-logo.png' // Replace with actual token image if available
                    }
                }
            });

            toast.success("ZOLLPTT token added to wallet", {
                icon: <CheckCircle className="h-5 w-5 text-green-500" />
            });
        } catch (error: any) {
            console.error("Error adding ZOLLPTT token:", error);
            toast.error(error.message || "Failed to add ZOLLPTT token", {
                icon: <XCircle className="h-5 w-5 text-red-500" />
            });
        } finally {
            setIsAddingToken(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-950 py-12">
            <div className="container max-w-3xl px-4 mx-auto">
                {/* Header */}
                <div className="mb-10 text-center">
                    <h1 className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                        ZOLLPTT Token Faucet
                    </h1>
                    <p className="text-gray-400 text-lg">
                        Get test ZOLLPTT tokens for development and testing on our platform.
                    </p>
                </div>

                <motion.div
                    className="relative bg-gray-900/80 backdrop-blur-md border border-gray-800 rounded-xl overflow-hidden shadow-lg"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5 }}>

                    <div className="p-6 md:p-8 relative z-10">
                        {/* Faucet Explanation */}
                        <div className="p-5 bg-blue-900/20 rounded-xl mb-6 border border-blue-900/30">
                            <div className="flex gap-3 items-start">
                                <div className="p-2 rounded-full bg-blue-800/50">
                                    <Droplet className="w-5 h-5 text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="font-medium text-gray-100 mb-1">
                                        ZOLLPTT Token Faucet
                                    </h3>
                                    <p className="text-sm text-gray-300">
                                        Claim {isLoadingClaimAmount ? "..." : formattedClaimAmount} ZOLLPTT tokens once every minute for testing PayZoll features.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Faucet Status */}
                        <div className="p-5 bg-gray-800/50 rounded-xl mb-6 border border-gray-800">
                            <h3 className="text-sm font-medium text-gray-300 mb-4">
                                Faucet Status
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-gray-400">Available Tokens</span>
                                        <span className="font-medium text-gray-200">{isLoadingBalance ? "Loading..." : `${formattedFaucetBalance} ZOLLPTT`}</span>
                                    </div>
                                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${progressValue}%` }}
                                            transition={{ duration: 0.7, ease: "easeOut" }}
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Claim Amount</span>
                                    <span className="font-medium text-gray-200">{isLoadingClaimAmount ? "Loading..." : `${formattedClaimAmount} ZOLLPTT`}</span>
                                </div>
                            </div>
                        </div>

                        {/* Connect Wallet CTA */}
                        {!isConnected && (
                            <div className="flex flex-col items-center py-8 px-4">
                                <div className="mb-6 p-4 rounded-full bg-purple-900/20 border border-purple-800/30">
                                    <Droplet className="h-10 w-10 text-purple-400" />
                                </div>

                                <h2 className="text-xl font-semibold mb-3 text-center text-white">Connect Your Wallet</h2>
                                <p className="text-gray-300 text-center mb-6 max-w-md">
                                    Connect your wallet to request ZOLLPTT tokens from the faucet.
                                </p>
                                <div className="flex justify-center">
                                    <button
                                        onClick={connectWallet}
                                        disabled={isLoading}
                                        className="bg-blue-600 hover:bg-blue-500 transition-colors duration-200 text-white font-medium py-3 px-8 rounded-lg shadow-md"
                                    >
                                        {isLoading ? (
                                            <span className="flex items-center">
                                                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                                Connecting...
                                            </span>
                                        ) : (
                                            "Connect Wallet"
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Faucet Interface */}
                        {isConnected && (
                            <div className="space-y-6">
                                {/* Faucet Controls */}
                                {Number(formattedFaucetBalance) <= 0 ? (
                                    <div className="p-5 rounded-xl bg-amber-900/20 border border-amber-900/30 text-center">
                                        <AlertCircle className="h-6 w-6 text-amber-500 mx-auto mb-2" />
                                        <h3 className="font-medium text-amber-400 mb-1">Faucet Empty</h3>
                                        <p className="text-sm text-amber-300">
                                            The faucet is currently out of tokens. Please check back later.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="p-6 rounded-xl bg-gradient-to-br from-blue-900/30 to-purple-900/30 border border-blue-900/40">
                                        <div className="flex flex-col items-center">
                                            <div className="mb-6 text-center">
                                                <span className="block text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                                                    {isLoadingClaimAmount ? "..." : formattedClaimAmount}
                                                </span>
                                                <span className="text-gray-400">ZOLLPTT</span>
                                            </div>

                                            <div className="w-full">
                                                <button
                                                    onClick={handleClaimTokens}
                                                    disabled={!contract || cooldownRemaining !== null || isLoading || Number(formattedFaucetBalance) <= 0}
                                                    className={cn(
                                                        "w-full py-4 px-6 text-base font-semibold rounded-lg shadow-md transition-all duration-200",
                                                        cooldownRemaining
                                                            ? "bg-gray-700 text-gray-300 cursor-not-allowed"
                                                            : "bg-blue-600 hover:bg-blue-500 text-white"
                                                    )}
                                                >
                                                    {isLoading ? (
                                                        <span className="flex items-center justify-center">
                                                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                                            {txPending ? "Confirm in Wallet" : "Processing..."}
                                                        </span>
                                                    ) : cooldownRemaining ? (
                                                        <span className="flex items-center justify-center">
                                                            <span className="w-3 h-3 rounded-full bg-amber-400 mr-2" />
                                                            Cooldown: {formatCooldown(cooldownRemaining)}
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center justify-center">
                                                            Claim ZOLLPTT Tokens
                                                            <ArrowRight className="ml-2 h-5 w-5" />
                                                        </span>
                                                    )}
                                                </button>
                                            </div>

                                            {cooldownRemaining && (
                                                <p className="mt-3 text-xs text-gray-400">
                                                    You can claim tokens once every minute
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Error Message */}
                                <AnimatePresence>
                                    {txError && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="p-3 rounded-lg bg-red-900/20 border border-red-900/30 text-red-400 text-sm overflow-hidden">
                                            {txError.message.slice(0, 100)}
                                            {txError.message.length > 100 ? '...' : ''}
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Last Transaction */}
                                <AnimatePresence>
                                    {lastRequest && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="p-4 rounded-lg bg-green-900/20 border border-green-900/30">
                                            <h4 className="text-sm font-medium text-green-300 mb-1">
                                                Last Transaction
                                            </h4>
                                            <a
                                                href={`https://pharosscan.xyz/tx/${lastRequest}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs font-mono text-blue-400 hover:text-blue-300 hover:underline break-all transition-colors"
                                            >
                                                {lastRequest}
                                            </a>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                    <div className="p-5 bg-gray-900/80 rounded-xl border border-gray-800">
                        <h3 className="font-semibold text-lg mb-2 text-gray-200">What is ZOLLPTT?</h3>
                        <p className="text-gray-400">
                            ZOLLPTT is the utility token used within the PayZoll ecosystem for testing features,
                            paying for services, and participating in governance.
                        </p>
                    </div>

                    <div className="p-5 bg-gray-900/80 rounded-xl border border-gray-800">
                        <h3 className="font-semibold text-lg mb-2 text-gray-200">Need Help?</h3>
                        <p className="text-gray-400">
                            If you're having trouble with the faucet or have questions about ZOLLPTT tokens,
                            please reach out to our support team or visit our documentation.
                        </p>
                    </div>
                </div>

                {/* Add to Wallet Card */}
                <div className="mt-6 p-6 bg-gray-900/80 rounded-xl border border-gray-800">
                    <div className="flex items-center mb-4">
                        <Wallet className="h-5 w-5 text-purple-400 mr-2" />
                        <h3 className="font-semibold text-lg text-gray-200">Add to Wallet</h3>
                    </div>

                    <p className="text-gray-400 mb-5">
                        Configure your wallet to work with Pharos network and ZOLLPTT tokens for the best experience.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button
                            onClick={addPharosChain}
                            disabled={isAddingChain}
                            className="flex items-center justify-center gap-2 bg-blue-900/40 hover:bg-blue-900/60 text-blue-300 py-3 px-4 rounded-lg border border-blue-900/50 transition-colors duration-200"
                        >
                            {isAddingChain ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                                <Plus className="h-4 w-4" />
                            )}
                            Add Pharos Network
                        </button>

                        <button
                            onClick={addZollpttToken}
                            disabled={isAddingToken}
                            className="flex items-center justify-center gap-2 bg-purple-900/40 hover:bg-purple-900/60 text-purple-300 py-3 px-4 rounded-lg border border-purple-900/50 transition-colors duration-200"
                        >
                            {isAddingToken ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                                <Plus className="h-4 w-4" />
                            )}
                            Add ZOLLPTT Token
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}