"use client"
import React, { useState, useEffect } from 'react'
import { RampDock } from '@/components/ramps/RampDock'
import BuyModal from '@/components/ramps/Buy'
import SellModal from '@/components/ramps/Sell'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'
import { Wallet, Receipt, ArrowDownToLine, ArrowUpFromLine, ExternalLink, Eye, X } from 'lucide-react'
import { motion } from 'framer-motion'
import { rampApi } from '@/api/rampApi'
import { backendDomain } from '@/lib/network'
import { allMainnetChains } from '@/lib/evm-chains-mainnet'

// Define interfaces for order types
interface BaseOrder {
  orderId: string;
  amountToken: number;
  amountFiat: number;
  exchangeRate: number;
  fiatType: string;
  chain: string;
  status: string;
  createdAt: string;
  notes?: string;
  transactionHash?: string;
}

interface BuyOrder extends BaseOrder {
  tokenBought: string;
  paymentReceiptPath?: string;
}

interface SellOrder extends BaseOrder {
  tokenSold: string;
  paymentMethod: string;
  paymentQrPath?: string;
  paymentProofPath?: string;
}

// Define props for ImageModal
interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  orderId: string;
  imagePath: string;
}

export default function Page() {
  // Modal states
  const [isBuyVisible, setIsBuyVisible] = useState(true)
  const [isSellVisible, setIsSellVisible] = useState(false)

  // Order states with proper typing
  const [buyOrders, setBuyOrders] = useState<BuyOrder[]>([])
  const [sellOrders, setSellOrders] = useState<SellOrder[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [pageIndex, setPageIndex] = useState(1)

  // Tab state
  const [activeTab, setActiveTab] = useState('buy')

  // Modal states for receipt/QR viewing
  const [receiptModalOpen, setReceiptModalOpen] = useState(false)
  const [qrModalOpen, setQrModalOpen] = useState(false)
  const [proofModalOpen, setProofModalOpen] = useState(false)
  const [modalImagePath, setModalImagePath] = useState('')
  const [modalTitle, setModalTitle] = useState('')
  const [modalOrderId, setModalOrderId] = useState('')

  // Add mounting state to handle hydration safely
  const [isMounted, setIsMounted] = useState(false)

  // Wallet connection state
  const { address, isConnected } = useAccount()

  // Set mounted state after hydration and fetch orders if connected
  useEffect(() => {
    setIsMounted(true)
    if (isConnected && address) {
      fetchUserOrders()
    }
  }, [isConnected, address])

  // Fetch user's orders
  const fetchUserOrders = async () => {
    if (!address) return

    setIsLoading(true)
    try {
      // Fetch buy orders
      const buyResponse = await rampApi.getUserBuyOrders(address, pageIndex)
      setBuyOrders(buyResponse.data || [])

      // Fetch sell orders
      const sellResponse = await rampApi.getUserSellOrders(address, pageIndex)
      setSellOrders(sellResponse.data || [])
    } catch (error) {
      console.error("Error fetching orders:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Modal handlers
  const onShowBuy = () => {
    setIsBuyVisible(true)
    setIsSellVisible(false)
  }

  const onShowSell = () => {
    setIsSellVisible(true)
    setIsBuyVisible(false)
  }

  // Open modal for viewing images with proper typing
  const openImageModal = (imagePath: string, title: string, orderId: string, type: 'receipt' | 'qr' | 'proof') => {
    // If the path doesn't start with http or https, prefix it with backendDomain
    const fullImagePath = imagePath.startsWith('http') ? imagePath : `${backendDomain}${imagePath}`

    setModalImagePath(fullImagePath)
    setModalTitle(title)
    setModalOrderId(orderId)

    if (type === 'receipt') {
      setReceiptModalOpen(true)
    } else if (type === 'qr') {
      setQrModalOpen(true)
    } else if (type === 'proof') {
      setProofModalOpen(true)
    }
  }

  // Format date nicely
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-500 bg-green-50 dark:bg-green-900/20'
      case 'pending': return 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
      case 'processing': return 'text-blue-500 bg-blue-50 dark:bg-blue-900/20'
      case 'failed': return 'text-red-500 bg-red-50 dark:bg-red-900/20'
      default: return 'text-gray-500 bg-gray-50 dark:bg-gray-900/20'
    }
  }

  // Add helper function to get block explorer URL for a transaction
  const getExplorerUrl = (chain: string, hash?: string) => {
    // Find the chain configuration from our list
    const chainConfig = allMainnetChains.find(c =>
      c.name.toLowerCase() === chain.toLowerCase()
    );

    if (chainConfig && chainConfig.blockExplorers?.default) {
      return `${chainConfig.blockExplorers.default.url}/tx/${hash}`;
    }

    // Fallback to Etherscan if chain not found
    return `https://etherscan.io/tx/${hash}`;
  }

  // Render a placeholder during server rendering and initial hydration
  if (!isMounted) {
    return (
      <div className="w-screen h-screen flex items-center justify-center">
        <div className="animate-pulse rounded-full h-16 w-16 bg-gray-200 dark:bg-gray-800"></div>
      </div>
    )
  }

  // Modal component for images with fixed image display
  const ImageModal: React.FC<ImageModalProps> = ({ isOpen, onClose, title, orderId, imagePath }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">{title}</h2>
              <p className="text-sm text-gray-500">Order ID: {orderId}</p>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 overflow-auto p-4">
            <div className="mt-2 overflow-hidden rounded-md border border-gray-200 dark:border-gray-800">
              {/* Fix the image display by directly using the imagePath */}
              <img
                src={imagePath}
                alt={title}
                className="max-w-full h-auto object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Component for Buy Orders List
  const BuyOrdersList = () => (
    <div className="space-y-4">
      {isLoading ? (
        <div className="flex justify-center p-10">
          <div className="animate-pulse rounded-full h-10 w-10 bg-gray-200 dark:bg-gray-800"></div>
        </div>
      ) : buyOrders.length === 0 ? (
        <div className="text-center p-10 text-gray-500">
          No buy orders found
        </div>
      ) : (
        buyOrders.map((order) => (
          <div key={order.orderId} className="overflow-hidden border rounded-lg shadow-sm dark:border-gray-800">
            <div className="p-4 pb-2">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <ArrowDownToLine className="h-5 w-5 text-green-500" />
                  Buy Order: {order.tokenBought}
                </h3>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(order.status)}`}>
                  {order.status.toUpperCase()}
                </span>
              </div>
              <p className="text-sm text-gray-500">Order ID: {order.orderId}</p>
            </div>

            <div className="px-4 text-sm pb-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Amount Token:</p>
                  <p className="font-medium">{order.amountToken} {order.tokenBought}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Amount Fiat:</p>
                  <p className="font-medium">{order.amountFiat} {order.fiatType}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Exchange Rate:</p>
                  <p className="font-medium">1 {order.tokenBought} = {order.exchangeRate} {order.fiatType}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Chain:</p>
                  <p className="font-medium">{order.chain}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Created:</p>
                  <p className="font-medium">{formatDate(order.createdAt)}</p>
                </div>
                {order.notes && (
                  <div className="col-span-2">
                    <p className="text-gray-500 dark:text-gray-400">Notes:</p>
                    <p className="font-medium">{order.notes}</p>
                  </div>
                )}
              </div>

              {/* Transaction Hash (if exists) */}
              {order.transactionHash && (
                <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                  <p className="text-gray-500 dark:text-gray-400">Transaction Hash:</p>
                  <a
                    href={getExplorerUrl(order.chain, order.transactionHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-700 flex items-center gap-1 font-medium overflow-hidden text-ellipsis"
                  >
                    {order.transactionHash ? order.transactionHash.substring(0, 25) + '...' : 'N/A'}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>

            <div className="px-4 py-3">
              {/* Receipt Image Button */}
              {order.paymentReceiptPath && (
                <button
                  onClick={() => openImageModal(order.paymentReceiptPath || '', 'Payment Receipt', order.orderId, 'receipt')}
                  className="w-full py-1.5 px-3 text-sm border border-gray-300 rounded-md hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 flex items-center justify-center"
                >
                  <Receipt className="h-4 w-4 mr-2" />
                  View Receipt
                </button>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );

  // Component for Sell Orders List
  const SellOrdersList = () => (
    <div className="space-y-4">
      {isLoading ? (
        <div className="flex justify-center p-10">
          <div className="animate-pulse rounded-full h-10 w-10 bg-gray-200 dark:bg-gray-800"></div>
        </div>
      ) : sellOrders.length === 0 ? (
        <div className="text-center p-10 text-gray-500">
          No sell orders found
        </div>
      ) : (
        sellOrders.map((order) => (
          <div key={order.orderId} className="overflow-hidden border rounded-lg shadow-sm dark:border-gray-800">
            <div className="p-4 pb-2">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <ArrowUpFromLine className="h-5 w-5 text-blue-500" />
                  Sell Order: {order.tokenSold}
                </h3>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(order.status)}`}>
                  {order.status.toUpperCase()}
                </span>
              </div>
              <p className="text-sm text-gray-500">Order ID: {order.orderId}</p>
            </div>

            <div className="px-4 text-sm pb-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Amount Token:</p>
                  <p className="font-medium">{order.amountToken} {order.tokenSold}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Amount Fiat:</p>
                  <p className="font-medium">{order.amountFiat} {order.fiatType}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Exchange Rate:</p>
                  <p className="font-medium">1 {order.tokenSold} = {order.exchangeRate} {order.fiatType}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Chain:</p>
                  <p className="font-medium">{order.chain}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Payment Method:</p>
                  <p className="font-medium">{order.paymentMethod.toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Created:</p>
                  <p className="font-medium">{formatDate(order.createdAt)}</p>
                </div>
                {order.notes && (
                  <div className="col-span-2">
                    <p className="text-gray-500 dark:text-gray-400">Notes:</p>
                    <p className="font-medium">{order.notes}</p>
                  </div>
                )}
              </div>

              {/* Transaction Hash */}
              <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                <p className="text-gray-500 dark:text-gray-400">Transaction Hash:</p>
                <a
                  href={getExplorerUrl(order.chain, order.transactionHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-700 flex items-center gap-1 font-medium overflow-hidden text-ellipsis"
                >
                  {order.transactionHash ? order.transactionHash.substring(0, 25) + '...' : 'N/A'}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            <div className="px-4 py-3 flex flex-col sm:flex-row gap-2">
              {/* QR Code Image Button */}
              {order.paymentQrPath && (
                <button
                  onClick={() => openImageModal(order.paymentQrPath || '', 'Payment QR Code', order.orderId, 'qr')}
                  className="flex-1 py-1.5 px-3 text-sm border border-gray-300 rounded-md hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 flex items-center justify-center"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View QR Code
                </button>
              )}

              {/* Payment Proof Image Button */}
              {order.paymentProofPath && (
                <button
                  onClick={() => openImageModal(order.paymentProofPath || '', 'Payment Proof', order.orderId, 'proof')}
                  className="flex-1 py-1.5 px-3 text-sm border border-gray-300 rounded-md hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 flex items-center justify-center"
                >
                  <Receipt className="h-4 w-4 mr-2" />
                  View Payment Proof
                </button>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className='w-screen min-h-screen relative'>
      {isConnected ? (
        // Connected state - show orders and RampDock
        <div className="container mx-auto py-8 px-4 md:px-6">
          <h1 className="text-2xl font-bold text-center mb-6">PayZoll Ramp</h1>

          {/* Custom Tabs implementation */}
          <div className="w-full max-w-4xl mx-auto mb-16">
            {/* Tab buttons */}
            <div className="grid grid-cols-2 mb-4 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('buy')}
                className={`py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'buy'
                  ? 'bg-white dark:bg-gray-700 shadow-sm text-black dark:text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
              >
                Buy Orders
              </button>
              <button
                onClick={() => setActiveTab('sell')}
                className={`py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'sell'
                  ? 'bg-white dark:bg-gray-700 shadow-sm text-black dark:text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
              >
                Sell Orders
              </button>
            </div>

            {/* Tab content */}
            <div className="mt-2">
              {activeTab === 'buy' && <BuyOrdersList />}
              {activeTab === 'sell' && <SellOrdersList />}
            </div>
          </div>

          {/* RampDock */}
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30">
            <RampDock
              onShowBuy={onShowBuy}
              onShowSell={onShowSell}
            />
          </div>
        </div>
      ) : (
        // Not connected - show connect wallet UI
        <div className="w-screen h-screen flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col relative items-center text-center space-y-6"
          >
            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/20">
              <Wallet className="w-8 h-8 text-blue-600 dark:text-blue-300" />
            </div>

            <div className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-bold text-black dark:text-white tracking-tight">
                Connect Your Wallet
              </h2>
              <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base max-w-sm mx-auto">
                Connect your wallet to access payment features and manage your tokens.
              </p>
            </div>

            <div className="w-full mx-auto pt-2 items-center flex justify-center">
              <ConnectButton />
            </div>
          </motion.div>
        </div>
      )}

      {/* Image Modals */}
      <ImageModal
        isOpen={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        title="Payment Receipt"
        orderId={modalOrderId}
        imagePath={modalImagePath}
      />

      <ImageModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        title="Payment QR Code"
        orderId={modalOrderId}
        imagePath={modalImagePath}
      />

      <ImageModal
        isOpen={proofModalOpen}
        onClose={() => setProofModalOpen(false)}
        title="Payment Proof"
        orderId={modalOrderId}
        imagePath={modalImagePath}
      />

      {/* Modals - Only render when mounted and conditions are met */}
      {isMounted && (
        <div className='text-black dark:text-white relative'>
          {isBuyVisible && <BuyModal isOpen={isBuyVisible && isConnected} onClose={() => setIsBuyVisible(false)} />}
          {isSellVisible && <SellModal isOpen={isSellVisible && isConnected} onClose={() => setIsSellVisible(false)} />}
        </div>
      )}
    </div>
  )
}
