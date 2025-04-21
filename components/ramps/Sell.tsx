import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { X, ChevronDown, Check, Wallet, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TokenAndChainSelector } from './TokenAndChainSelector';
import { Token } from '@/lib/evm-tokens-mainnet';
import { allMainnetChains } from '@/lib/evm-chains-mainnet';
import { truncateAddress } from '@/lib/utils';
import { rampApi } from '@/api/rampApi';
import { ConfirmationStep } from './sell/ConfirmationStep';
import { TransactionHashStep } from './sell/TransactionHashStep';
import { SuccessStep } from './sell/SuccessStep';

// Sample conversion rates (in production, these would come from an API)
const SAMPLE_RATES = {
    USDT: {
        INR: 86.75, // Slightly lower for selling (spread)
        USD: 0.99,
        EUR: 0.91,
        GBP: 0.78,
        AUD: 1.48,
    },
    USDC: {
        INR: 86.70,
        USD: 0.99,
        EUR: 0.91,
        GBP: 0.78,
        AUD: 1.48,
    }
};

// Supported fiat currencies
const FIAT_CURRENCIES = [
    { code: 'INR', name: 'Indian Rupee', symbol: '₹', enabled: true },
    { code: 'USD', name: 'US Dollar', symbol: '$', enabled: false },
    { code: 'EUR', name: 'Euro', symbol: '€', enabled: false },
    { code: 'GBP', name: 'British Pound', symbol: '£', enabled: false },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', enabled: false },
];

// Sample company wallet address (would be fetched from backend in production)
const COMPANY_WALLET_ADDRESS = "0xD942759a20fCdf5223fBa6F0dD4D00B0Dd28B276";

// Steps in the selling process
enum SellStep {
    FORM,                    // Initial form
    CONFIRMATION,            // Confirm details
    TRANSACTION_HASH,        // Input transaction hash
    SUCCESS,                 // Success message
}

// Define a constant UPI payment method:
const UPI_PAYMENT_METHOD = { id: 'upi', name: 'UPI', icon: '📱' };

interface SellModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const SellModal: React.FC<SellModalProps> = ({ isOpen, onClose }) => {
    const { isConnected, address } = useAccount();

    // UI States
    const [isCurrencyDropdownOpen, setIsCurrencyDropdownOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState<SellStep>(SellStep.FORM);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderId, setOrderId] = useState('');

    // Form States
    const [selectedChain, setSelectedChain] = useState(allMainnetChains[0]);
    const [selectedToken, setSelectedToken] = useState<Token | null>(null);
    const [selectedCurrency, setSelectedCurrency] = useState(FIAT_CURRENCIES[0]);
    const [cryptoAmount, setCryptoAmount] = useState('');
    const [fiatAmount, setFiatAmount] = useState('');
    const [paymentDetails, setPaymentDetails] = useState('');
    const [transactionHash, setTransactionHash] = useState('');
    const [qrFile, setQrFile] = useState<File | null>(null);

    // Calculate fiat amount when crypto amount changes
    useEffect(() => {
        if (cryptoAmount && selectedToken && selectedCurrency) {
            const baseSymbol = selectedToken.symbol.includes('USDT') ? 'USDT' : 'USDC';
            const rate = SAMPLE_RATES[baseSymbol as keyof typeof SAMPLE_RATES][selectedCurrency.code as keyof (typeof SAMPLE_RATES)['USDT']] || 0;
            const amount = parseFloat(cryptoAmount) * rate;
            setFiatAmount(amount.toFixed(2));
        } else {
            setFiatAmount('');
        }
    }, [cryptoAmount, selectedToken, selectedCurrency]);

    // Calculate crypto amount when fiat amount changes
    const handleFiatAmountChange = (value: string) => {
        setFiatAmount(value);
        if (value && selectedToken && selectedCurrency) {
            const baseSymbol = selectedToken.symbol.includes('USDT') ? 'USDT' : 'USDC';
            const rate = SAMPLE_RATES[baseSymbol as keyof typeof SAMPLE_RATES][selectedCurrency.code as keyof (typeof SAMPLE_RATES)['USDT']] || 0;
            const amount = parseFloat(value) / rate;
            setCryptoAmount(amount.toFixed(6));
        } else {
            setCryptoAmount('');
        }
    };

    // Generate a random order ID
    useEffect(() => {
        if (isOpen && currentStep === SellStep.FORM) {
            // Generate a random order ID
            setOrderId(`S-${Math.random().toString(36).substring(2, 10).toUpperCase()}`);
        }
    }, [isOpen, currentStep]);

    // Handle initial sell action (move to confirmation)
    const handleInitialSell = () => {
        setCurrentStep(SellStep.CONFIRMATION);
    };

    // Handle confirmation of sell details
    const handleConfirmSell = () => {
        setCurrentStep(SellStep.TRANSACTION_HASH);
    };

    // Handle submission of the sell order
    const handleSubmitSell = async () => {
        try {
            setIsSubmitting(true);

            if (!address || !selectedToken || !transactionHash || !paymentDetails || !qrFile) {
                throw new Error("Missing required fields");
            }

            // Prepare sell data
            const sellData = {
                wallet: address,
                tokenSold: selectedToken.symbol,
                chain: selectedChain.id.toString(),
                amountToken: cryptoAmount,
                fiatType: selectedCurrency.code,
                amountFiat: fiatAmount,
                exchangeRate: SAMPLE_RATES[selectedToken.symbol.includes('USDT') ? 'USDT' : 'USDC' as keyof typeof SAMPLE_RATES][selectedCurrency.code as keyof (typeof SAMPLE_RATES)['USDT']].toString(),
                orderId: orderId,
                transactionHash: transactionHash,
                paymentMethod: 'upi', // Always UPI
                paymentDetails: paymentDetails // UPI ID
            };

            // Always send with the QR file
            await rampApi.sell(sellData, qrFile);

            // Move to success step
            setCurrentStep(SellStep.SUCCESS);
        } catch (error) {
            console.error("Error submitting sell order:", error);
            alert("There was an error processing your sell order. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle closing with confirmation if in the middle of a flow
    const handleCloseModal = () => {
        if (currentStep !== SellStep.FORM && currentStep !== SellStep.SUCCESS) {
            if (window.confirm("Are you sure you want to cancel this sale? Your progress will be lost.")) {
                onClose();
            }
        } else {
            onClose();
        }
    };

    if (!isOpen) return null;

    // Get the exchange rate for the selected token and currency
    const getExchangeRate = () => {
        if (!selectedToken) return 0;
        const baseSymbol = selectedToken.symbol.includes('USDT') ? 'USDT' : 'USDC';
        return SAMPLE_RATES[baseSymbol as keyof typeof SAMPLE_RATES][selectedCurrency.code as keyof (typeof SAMPLE_RATES)['USDT']] || 0;
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden max-h-[90vh] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-900 z-10">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            {currentStep === SellStep.FORM && "Sell Cryptocurrency"}
                            {currentStep === SellStep.CONFIRMATION && "Confirm Sale"}
                            {currentStep === SellStep.TRANSACTION_HASH && "Provide Transaction Hash"}
                            {currentStep === SellStep.SUCCESS && "Sale Complete"}
                        </h3>
                        <button
                            onClick={handleCloseModal}
                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Content based on current step */}
                    {currentStep === SellStep.FORM && (
                        <div className="p-4 space-y-4">
                            {/* Token and Chain Selector */}
                            <TokenAndChainSelector
                                selectedChain={selectedChain}
                                selectedToken={selectedToken}
                                onChainChange={setSelectedChain}
                                onTokenChange={setSelectedToken}
                                showBalance={true}
                                tokenBalance="0.00" // In a real app, you'd fetch this from the blockchain
                                isBalanceLoading={false}
                            />

                            {/* Destination Wallet Information */}
                            <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                                <div className="flex items-start">
                                    <Send className="text-purple-500 dark:text-purple-400 h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="text-sm font-medium text-purple-800 dark:text-purple-300">Send tokens to this address</h4>
                                        <p className="text-purple-700 dark:text-purple-200 text-sm mt-1 break-all">
                                            {truncateAddress(COMPANY_WALLET_ADDRESS, 12, 12)}
                                        </p>
                                        <button
                                            className="mt-1 text-xs text-purple-600 dark:text-purple-400 hover:underline flex items-center"
                                            onClick={() => {
                                                navigator.clipboard.writeText(COMPANY_WALLET_ADDRESS);
                                                alert('Address copied to clipboard!');
                                            }}
                                        >
                                            Copy address
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Amount Inputs */}
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Amount to Sell
                                    </label>
                                    <div className="flex rounded-md shadow-sm">
                                        <input
                                            type="number"
                                            value={cryptoAmount}
                                            onChange={(e) => setCryptoAmount(e.target.value)}
                                            placeholder="0.00"
                                            min="0"
                                            step="0.01"
                                            className="flex-1 min-w-0 block w-full px-3 py-2 rounded-l-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                                        />
                                        <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-300 text-sm">
                                            {selectedToken?.symbol || "Token"}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        You'll Receive
                                    </label>
                                    <div className="flex rounded-md shadow-sm">
                                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-300 text-sm">
                                            {selectedCurrency.symbol}
                                        </span>
                                        <input
                                            type="number"
                                            value={fiatAmount}
                                            onChange={(e) => handleFiatAmountChange(e.target.value)}
                                            placeholder="0.00"
                                            min="0"
                                            step="0.01"
                                            className="flex-1 min-w-0 block w-full px-3 py-2 rounded-r-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Currency Selection */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Receive Currency
                                </label>
                                <div className="relative">
                                    <button
                                        onClick={() => setIsCurrencyDropdownOpen(!isCurrencyDropdownOpen)}
                                        className="w-full flex items-center justify-between px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                                    >
                                        <div className="flex items-center space-x-2">
                                            <span className="text-gray-900 dark:text-white">
                                                {selectedCurrency?.code} ({selectedCurrency?.symbol})
                                            </span>
                                        </div>
                                        <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                    </button>

                                    {isCurrencyDropdownOpen && (
                                        <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 shadow-lg rounded-md py-1 border border-gray-200 dark:border-gray-700">
                                            {FIAT_CURRENCIES.map((currency) => (
                                                <button
                                                    key={currency.code}
                                                    disabled={!currency.enabled}
                                                    className={`w-full text-left px-4 py-2 flex items-center justify-between ${currency.enabled
                                                        ? 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                                        : 'opacity-50 cursor-not-allowed'
                                                        }`}
                                                    onClick={() => {
                                                        if (currency.enabled) {
                                                            setSelectedCurrency(currency);
                                                            setIsCurrencyDropdownOpen(false);
                                                        }
                                                    }}
                                                >
                                                    <span className="text-gray-900 dark:text-white flex items-center">
                                                        {currency.code} ({currency.symbol})
                                                        {!currency.enabled && (
                                                            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                                                                Coming soon
                                                            </span>
                                                        )}
                                                    </span>
                                                    {selectedCurrency?.code === currency.code && (
                                                        <Check className="h-4 w-4 text-green-500" />
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Conversion Rate Display */}
                            {selectedToken && selectedCurrency && (
                                <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500 dark:text-gray-400">Conversion Rate:</span>
                                        <span className="text-gray-900 dark:text-white font-medium">
                                            1 {selectedToken.symbol.includes('USDT') ? 'USDT' : 'USDC'} = {selectedCurrency.symbol}
                                            {SAMPLE_RATES[selectedToken.symbol.includes('USDT') ? 'USDT' : 'USDC' as keyof typeof SAMPLE_RATES][selectedCurrency.code as keyof (typeof SAMPLE_RATES)['USDT']].toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Sell Process Information */}
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">How to sell:</h4>
                                <ol className="list-decimal list-inside space-y-1 text-blue-700 dark:text-blue-300 text-sm pl-1">
                                    <li>Enter the amount you want to sell</li>
                                    <li>Click "Continue" to proceed</li>
                                    <li>Send the tokens to our address from your wallet</li>
                                    <li>Provide the transaction hash to verify your transfer</li>
                                    <li>We'll send payment to your account within 24 hours</li>
                                </ol>
                            </div>

                            {/* Actions */}
                            <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                                <button
                                    onClick={handleInitialSell}
                                    disabled={!isConnected || !selectedToken || !cryptoAmount || !fiatAmount || parseFloat(cryptoAmount) <= 0}
                                    className={`w-full py-2 px-4 font-medium rounded-lg shadow-sm ${isConnected && selectedToken && cryptoAmount && fiatAmount && parseFloat(cryptoAmount) > 0
                                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                        : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                                        }`}
                                >
                                    Continue
                                </button>
                            </div>
                        </div>
                    )}

                    {currentStep === SellStep.CONFIRMATION && (
                        <ConfirmationStep
                            orderId={orderId}
                            selectedToken={selectedToken}
                            selectedChain={selectedChain}
                            cryptoAmount={cryptoAmount}
                            fiatAmount={fiatAmount}
                            selectedCurrency={selectedCurrency}
                            exchangeRate={getExchangeRate()}
                            paymentMethod={UPI_PAYMENT_METHOD}
                            paymentDetails={paymentDetails}
                            companyWalletAddress={COMPANY_WALLET_ADDRESS}
                            onBack={() => setCurrentStep(SellStep.FORM)}
                            onConfirm={handleConfirmSell}
                        />
                    )}

                    {currentStep === SellStep.TRANSACTION_HASH && (
                        <TransactionHashStep
                            orderId={orderId}
                            companyWalletAddress={COMPANY_WALLET_ADDRESS}
                            selectedToken={selectedToken}
                            selectedChain={selectedChain}
                            cryptoAmount={cryptoAmount}
                            transactionHash={transactionHash}
                            onTransactionHashChange={setTransactionHash}
                            onBack={() => setCurrentStep(SellStep.CONFIRMATION)}
                            onSubmit={handleSubmitSell}
                            isSubmitting={isSubmitting}
                            paymentDetails={paymentDetails}
                            onPaymentDetailsChange={setPaymentDetails}
                            onSetQrFile={setQrFile}
                        />
                    )}

                    {currentStep === SellStep.SUCCESS && (
                        <SuccessStep
                            orderId={orderId}
                            cryptoAmount={cryptoAmount}
                            tokenSymbol={selectedToken?.symbol || ""}
                            fiatAmount={fiatAmount}
                            currencySymbol={selectedCurrency?.symbol || ""}
                            onClose={onClose}
                        />
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default SellModal;