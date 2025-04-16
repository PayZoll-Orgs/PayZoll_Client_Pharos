"use client";

import React, { useState, useEffect } from "react";
import PaymentsHeader from "@/components/payroll/PaymentHeader";
import ConfigurePayModal from "@/components/payroll/ConfigurePayModal";
import PaymentDashboard from "@/components/payroll/PaymentDashboard";
import AddEmployeeModal from "@/components/payroll/AddEmployeeModal";
import BulkUploadModal from "@/components/payroll/BulkuploadModal";
import { Employee, PayrollData } from "@/lib/interfaces";
import { employerApi } from "@/api/employerApi";
import { payrollApi } from "@/api/payrollApi";
import { toast } from "react-hot-toast";
import { parseUnits } from 'ethers';
import { contractMainnetAddresses as transferContract } from '@/lib/evm-tokens-mainnet';
import { allMainnetChains as chains, NATIVE_ADDRESS } from '@/lib/evm-chains-mainnet';
import { tokensPerMainnetChain as tokens } from '@/lib/evm-tokens-mainnet';
import transferAbi from '@/lib/Transfer.json';
import { erc20Abi } from 'viem';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useConfig } from 'wagmi';
import { waitForTransactionReceipt } from "@wagmi/core";
import { useReadContract } from "wagmi";
import useFullPageLoader from "@/hooks/usePageLoader";
import Loader from "@/components/ui/loader";

const PaymentsPage: React.FC = () => {
  // Original state
  const [showConfigurePayModal, setShowConfigurePayModal] = useState(true);
  const [exchangeRate, setExchangeRate] = useState(1);
  const [selectedTokenSymbol, setSelectedTokenSymbol] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [walletToDelete, setWalletToDelete] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string>('');

  // Lifted state from PaymentDashboard
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [txError, setTxError] = useState('');
  const [needsApproval, setNeedsApproval] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [approvalTxHash, setApprovalTxHash] = useState<`0x${string}` | undefined>(undefined);
  const [showPaymentStatus, setShowPaymentStatus] = useState(false);
  const [selectedChain, setSelectedChain] = useState(chains[0]);
  const [selectedToken, setSelectedToken] = useState(tokens[chains[0].id][0]);

  // Wallet and transaction hooks
  const { address, isConnected, chainId } = useAccount();
  const config = useConfig();
  const { writeContractAsync, isPending: isWritePending, data: txHash } = useWriteContract();
  const { isLoading: isTxLoading, isSuccess: isTxSuccess, isError: isTxError } =
    useWaitForTransactionReceipt({ hash: txHash });

  // Derived loading state
  const isLoadingDerived = isApproving || isSending || isWritePending || isTxLoading;

  useEffect(() => {
    fetchEmployees();

    // Fetch company name
    const fetchCompanyInfo = async () => {
      try {
        const userInfo = localStorage.getItem('user');
        if (userInfo) {
          const { company } = JSON.parse(userInfo);
          setCompanyName(company);
        }
      } catch (error) {
        console.error("Failed to fetch company info:", error);
      }
    };

    fetchCompanyInfo();
  }, []);

  // Effect to update chain based on connected wallet
  useEffect(() => {
    if (chainId) {
      const chain = chains.find(c => c.id === chainId);
      if (chain) {
        setSelectedChain(chain);

        if (tokens[chain.id]?.length > 0) {
          const matchedToken = selectedTokenSymbol
            ? tokens[chain.id].find(token => token.symbol === selectedTokenSymbol)
            : undefined;
          setSelectedToken(matchedToken || tokens[chain.id][0]);
        }
      }
    }
  }, [chainId, selectedTokenSymbol]);

  // Handle token symbol changes
  useEffect(() => {
    if (selectedTokenSymbol && selectedChain) {
      const chainTokens = tokens[selectedChain.id] || [];
      const matchedToken = chainTokens.find(token => token.symbol === selectedTokenSymbol);

      if (matchedToken) {
        setSelectedToken(matchedToken);
      }
    }
  }, [selectedTokenSymbol, selectedChain]);

  // Transaction success effect
  useEffect(() => {
    if (isTxSuccess) {
      // Log the transaction to backend first
      logPayrollTransaction();

      // Store the number of employees paid for the success message
      const employeesPaidCount = selectedEmployees.length;

      // First timeout - reset form data (2 seconds after success)
      const formResetTimer = setTimeout(() => {
        // Reset selected employees
        setSelectedEmployees([]);

        // Second timeout - hide payment status (5 seconds after form reset)
        const statusResetTimer = setTimeout(() => {
          setShowPaymentStatus(false);
          setApprovalTxHash(undefined);
          setTxError('');
        }, 5000);

        return () => clearTimeout(statusResetTimer);
      }, 2000);

      return () => clearTimeout(formResetTimer);
    }
  }, [isTxSuccess, txHash]);

  // Effect to clear txError after 6 seconds
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (txError) {
      timer = setTimeout(() => {
        setTxError(''); // Clear the error
      }, 6000); // 6 seconds
    }
    // Cleanup function to clear the timeout if the component unmounts
    // or if txError changes before the timeout finishes
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [txError]); // Re-run this effect whenever txError changes

  const fetchEmployees = async () => {
    try {
      setIsLoading(true);
      const response = await employerApi.getAllEmployees();
      if (response.status == "success") {
        setEmployees(response.employees || []);
      } else {
        // Handle potential API error responses even if status is not "success"
        throw new Error(response.message || "Failed to fetch employees due to API error.");
      }
    } catch (error: any) {
      console.error("Failed to fetch employees:", error);
      const message = error?.response?.data?.message || error?.message || "An unknown error occurred";
      toast.error(`Failed to load employees: ${message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Get transfer contract address for current chain
  const getTransferContract = () => {
    return transferContract[selectedChain.id];
  };

  // Convert USD salary to token amount
  const usdToToken = (usdAmount: string) => {
    return (parseFloat(usdAmount) * exchangeRate).toFixed(6);
  };

  // Calculate total amount needed for selected employees
  const calculateTotalAmount = () => {
    return employees
      .filter(emp => selectedEmployees.includes(emp.wallet))
      .reduce((sum, emp) => sum + parseFloat(emp.salary), 0);
  };

  // Get recipients and amounts for selected employees
  const getRecipientsAndAmounts = () => {
    const selectedEmployeeData = employees.filter(emp => selectedEmployees.includes(emp.wallet));

    return {
      recipients: selectedEmployeeData.map(emp => emp.wallet as `0x${string}`),
      amounts: selectedEmployeeData.map(emp => {
        const tokenAmount = usdToToken(emp.salary);
        return parseUnits(tokenAmount, selectedToken.decimals);
      })
    };
  };

  // Get block explorer URL based on chain
  const getExplorerUrl = (txHash: `0x${string}` | undefined): string => {
    const explorer = selectedChain.blockExplorers?.default?.url;
    if (!explorer) return '#';
    return `${explorer}/tx/${txHash}`;
  };

  // Handle employee selection
  const toggleEmployeeSelection = (employeeId: string) => {
    setSelectedEmployees(prev =>
      prev.includes(employeeId)
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: selectedToken?.address !== NATIVE_ADDRESS
      ? (selectedToken?.address as `0x${string}`)
      : undefined,
    abi: erc20Abi,
    functionName: 'allowance',
    args: [
      address as `0x${string}`,
      getTransferContract() as `0x${string}`
    ],
    chainId: selectedChain?.id,
    query: {
      enabled: isConnected &&
        !!selectedToken &&
        !!address &&
        selectedToken?.address !== NATIVE_ADDRESS &&
        !!getTransferContract()
    }
  });


  useEffect(() => {
    if (
      selectedToken?.address !== NATIVE_ADDRESS &&
      allowance !== undefined &&
      selectedEmployees.length > 0
    ) {
      try {
        const totalAmount = calculateTotalAmount();
        const parsedAmount = parseUnits(usdToToken(totalAmount.toString()), selectedToken.decimals);
        setNeedsApproval(allowance < parsedAmount);
      } catch (e) {
        // Invalid amount format, ignore
      }
    } else {
      setNeedsApproval(false);
    }
  }, [allowance, selectedEmployees, selectedToken]);

  // Force refetch allowance when token changes
  useEffect(() => {
    if (isConnected && selectedToken && address && selectedToken?.address !== NATIVE_ADDRESS) {
      refetchAllowance();
    }
  }, [selectedToken?.address, selectedChain?.id, refetchAllowance, isConnected, address, selectedToken]);

  // Check if all employees are selected
  const allEmployeesSelected = selectedEmployees.length === employees.length;

  // Toggle all employees selection
  const toggleAllEmployees = () => {
    if (allEmployeesSelected) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(employees.map(emp => emp.wallet));
    }
  };

  // Helper function to send transaction after approval
  const sendTransactionAfterApproval = async (
    transferContractAddress: string,
    recipients: `0x${string}`[],
    amounts: bigint[],
    totalAmount: bigint
  ) => {
    setIsSending(true);
    console.log('Sending final transaction...');

    try {
      // For native token transfers
      if (selectedToken.address === NATIVE_ADDRESS) {
        console.log('Sending native token transfer');
        await writeContractAsync({
          address: transferContractAddress as `0x${string}`,
          abi: transferAbi.abi,
          functionName: 'bulkTransfer',
          args: [
            NATIVE_ADDRESS, // Native token
            recipients,
            amounts
          ],
          value: totalAmount,
          chainId: selectedChain.id
        });
      } else {
        // For ERC20 token transfers
        console.log('Sending ERC20 token transfer');
        await writeContractAsync({
          address: transferContractAddress as `0x${string}`,
          abi: transferAbi.abi,
          functionName: 'bulkTransfer',
          args: [
            selectedToken.address as `0x${string}`,
            recipients,
            amounts
          ],
          chainId: selectedChain.id
        });
      }
      console.log('Transaction sent successfully');
    } catch (error) {
      console.error('Error in sendTransactionAfterApproval:', error);
      throw error;
    } finally {
      setIsSending(false);
    }
  };

  // Log payroll transaction to backend
  const logPayrollTransaction = async () => {
    if (!txHash || !companyName) {
      console.error("Missing transaction hash or company name");
      return;
    }

    try {
      const selectedEmployeeData = employees.filter(emp => selectedEmployees.includes(emp.wallet));
      const totalUsdAmount = selectedEmployeeData.reduce(
        (sum, emp) => sum + parseFloat(emp.salary), 0
      ).toFixed(2);

      const employeePayments = selectedEmployeeData.map(emp => ({
        wallet: emp.wallet,
        amount: emp.salary
      }));

      const payrollData: PayrollData = {
        company: companyName,
        employees: employeePayments,
        totalAmount: totalUsdAmount,
        tokenSymbol: selectedToken.symbol,
        transactionHash: txHash,
        chain: selectedChain.name
      };

      const response = await payrollApi.addPayroll(payrollData);

      if (response.status === "success") {
        toast.success("Payroll record saved successfully");
      } else {
        toast.error("Failed to save payroll record");
      }
    } catch (error) {
      console.error("Error logging payroll transaction:", error);
      toast.error("Failed to save payroll record");
    }
  };

  // Main transaction handling function
  const handleTransaction = async () => {
    setTxError(''); // Clear previous errors immediately on new attempt
    setShowPaymentStatus(true);

    if (selectedEmployees.length === 0) {
      setTxError('Please select at least one employee to pay');
      return;
    }

    try {
      const transferContractAddress = getTransferContract();

      if (!transferContractAddress) {
        setTxError('No transfer contract available for this network');
        return;
      }

      const { recipients, amounts } = getRecipientsAndAmounts();
      const totalAmount = amounts.reduce((sum, amount) => sum + amount, BigInt(0));

      // For ERC20 tokens that need approval
      if (selectedToken.address !== NATIVE_ADDRESS && needsApproval) {
        setIsApproving(true);

        try {
          const approvalHash = await writeContractAsync({
            address: selectedToken.address as `0x${string}`,
            abi: erc20Abi,
            functionName: 'approve',
            args: [transferContractAddress as `0x${string}`, totalAmount],
            chainId: selectedChain.id
          });

          setApprovalTxHash(approvalHash);

          const approvalReceipt = await waitForTransactionReceipt(config, {
            chainId: selectedChain.id,
            hash: approvalHash
          });

          if (approvalReceipt.status !== 'success') {
            throw new Error('Approval transaction failed');
          }

          setIsApproving(false);
          await sendTransactionAfterApproval(transferContractAddress, recipients, amounts, totalAmount);
        } catch (error: any) {
          setIsApproving(false);
          setTxError(error.message || 'Approval failed');
          return;
        }
      } else {
        await sendTransactionAfterApproval(transferContractAddress, recipients, amounts, totalAmount);
      }
    } catch (error: any) {
      setIsSending(false);
      setTxError(error.message || 'Transaction failed');
    }
  };

  // Handler functions
  const handleAddEmployeeClick = () => {
    setSelectedEmployee(null);
    setShowAddModal(true);
  };

  const handleBulkUploadClick = () => {
    setShowBulkUploadModal(true);
  };

  const confirmDeleteEmployee = async () => {
    if (!walletToDelete) return;

    try {
      await employerApi.deleteEmployee(walletToDelete);
      setEmployees((prevEmployees) => prevEmployees.filter((employee) => employee.wallet !== walletToDelete));
      toast.success("Employee deleted successfully");
    } catch (error: any) {
      console.error("Failed to delete employee:", error);
      const message = error?.response?.data?.message || error?.message || "An unknown error occurred";
      toast.error(`Failed to delete employee: ${message}`);
    } finally {
      setIsDeleteDialogOpen(false);
      setWalletToDelete(null);
    }
  };

  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowAddModal(true);
  };

  const handleAddEmployee = async (employee: Employee) => {
    try {
      const response = await employerApi.addEmployee(employee);
      if (response.status === "success") {
        const newEmployee = response.message; // Assuming message contains the new employee data on success
        setEmployees((prevEmployees) => [...prevEmployees, newEmployee]);
        setShowAddModal(false);
        fetchEmployees(); // Refetch to ensure consistency, though adding locally might suffice
        toast.success("Employee added successfully");
      } else {
        throw new Error(response.message || "Failed to add employee due to API error.");
      }
    } catch (error: any) {
      console.error("Failed to add employee:", error);
      const message = error?.response?.data?.message || error?.message || "An unknown error occurred";
      toast.error(`Failed to add employee: ${message}`);
      // Optionally keep the modal open on failure
      // setShowAddModal(true);
    }
  };

  const handleUpdateEmployee = async (wallet: string, updatedData: Partial<Employee>) => {
    try {
      const response = await employerApi.updateEmployee(wallet, updatedData);
      if (response.status === "success") {
        const updatedEmployee = response.data; // Assuming data contains the updated employee
        setEmployees((prevEmployees) =>
          prevEmployees.map((emp) =>
            emp.wallet === wallet ? { ...emp, ...updatedEmployee } : emp // Ensure full update locally
          )
        );
        setShowAddModal(false);
        setSelectedEmployee(null);
        toast.success("Employee updated successfully");
        // Consider refetching if local update isn't reliable
        // fetchEmployees();
      } else {
        throw new Error(response.message || "Failed to update employee due to API error.");
      }
    } catch (error: any) {
      console.error("Failed to update employee:", error);
      const message = error?.response?.data?.message || error?.message || "An unknown error occurred";
      toast.error(`Failed to update employee: ${message}`);
      // Optionally keep the modal open on failure
      // setShowAddModal(true);
    }
  };

  // Handle exchange rate updates from the modal
  const handleExchangeRateUpdate = (rate: number, tokenSymbol: string) => {
    setExchangeRate(rate);
    setSelectedTokenSymbol(tokenSymbol);
  };

  const hasTransactionActivity = isLoadingDerived || isTxSuccess || isTxError || !!txError || !!approvalTxHash || !!txHash;

  return (
    <div className="relative h-screen w-screen dark:text-white text-black p-6 z-10">
      <div className="flex flex-col max-w-screen max-h-screen items-center m-10">
        <PaymentsHeader
          onConfigurePayments={() => setShowConfigurePayModal(true)}
          onAddEmployee={handleAddEmployeeClick}
          onBulkUpload={handleBulkUploadClick} />

        <PaymentDashboard
          exchangeRate={exchangeRate}
          selectedTokenSymbol={selectedTokenSymbol}
          employees={employees}
          isConnected={isConnected}
          selectedEmployees={selectedEmployees}
          toggleEmployeeSelection={toggleEmployeeSelection}
          toggleAllEmployees={toggleAllEmployees}
          allEmployeesSelected={allEmployeesSelected}
          handleTransaction={handleTransaction}
          usdToToken={usdToToken}
          isLoadingDerived={isLoadingDerived}
          needsApproval={needsApproval}
          isApproving={isApproving}
          isSending={isSending}
          isWritePending={isWritePending}
          isTxLoading={isTxLoading}
          isTxSuccess={isTxSuccess}
          isTxError={isTxError}
          txHash={txHash}
          txError={txError}
          approvalTxHash={approvalTxHash}
          showPaymentStatus={showPaymentStatus}
          hasTransactionActivity={hasTransactionActivity}
          getExplorerUrl={getExplorerUrl}
          selectedToken={selectedToken}
          handleAddEmployeeClick={handleAddEmployeeClick}
          handleEditEmployee={handleEditEmployee}
          deleteEmployeeById={(wallet: string) => {
            setWalletToDelete(wallet);
            setIsDeleteDialogOpen(true);
          }}
        />

        <ConfigurePayModal
          isOpen={showConfigurePayModal}
          onClose={() => setShowConfigurePayModal(false)}
          onExchangeRateUpdate={handleExchangeRateUpdate}
        />

        <AddEmployeeModal
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            setSelectedEmployee(null);
          }}
          onAddEmployee={handleAddEmployee}
          onUpdateEmployee={handleUpdateEmployee}
          editEmployee={selectedEmployee}
          onUploadSuccess={() => {
            fetchEmployees();
            setShowBulkUploadModal(false);
          }}
        />

        <BulkUploadModal
          isOpen={showBulkUploadModal}
          onClose={() => setShowBulkUploadModal(false)}
          onUploadSuccess={() => {
            fetchEmployees();
            setShowBulkUploadModal(false);
          }}
        />

        {/* Delete Confirmation Dialog */}
        {isDeleteDialogOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto dark:bg-black dark:text-white text-black backdrop-blur-sm flex items-center justify-center">
            <div className="dark:bg-[#1A1F2E] rounded-lg p-6 w-full max-w-md mx-4 shadow-xl border border-gray-700 animate-fade-in">
              <h3 className="text-xl font-medium dark:text-white mb-4">Confirm Deletion</h3>
              <p className="dark:text-gray-300 mb-6">
                Are you sure you want to delete this employee? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setIsDeleteDialogOpen(false);
                    setWalletToDelete(null);
                  }}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-white transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteEmployee}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md text-white transition-colors duration-200"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const PaymentPage = useFullPageLoader(
  PaymentsPage, <Loader />
);

export default PaymentPage;