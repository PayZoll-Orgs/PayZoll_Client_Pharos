"use client";

import React, { useState, useEffect } from 'react';
import useFullPageLoader from '@/hooks/usePageLoader';
import Loader from '@/components/ui/loader';
import RecipientsTable from '@/components/payroll/RecipientsTable';

import PaymentsHeader from "@/components/payments/PaymentHeader";
import ConfigurePayModal from "@/components/payments/ConfigurePayModal";
import PaymentDashboard from "@/components/payments/PaymentDashboard";
import AddEmployeeModal from "@/components/employerDashboard/AddEmployeeModal";
import BulkUploadModal from "@/components/employerDashboard/BulkuploadModal";
import { Employee, PayrollData } from "@/lib/interfaces";
import { employerApi } from "@/api/employerApi";
import { payrollApi } from "@/api/payrollApi";
import { toast } from "react-hot-toast";
import { parseUnits } from 'ethers';
import { contractMainnetAddresses as transferContract } from '@/lib/evm-tokens-mainnet';
import { allMainnetChains as chains, NATIVE_ADDRESS } from '@/lib/evm-chains-mainnet';
import { tokensPerMainnetChain as tokens } from '@/lib/evm-tokens-mainnet';
import transferAbi from '@/utils/Transfer.json';
import { erc20Abi } from 'viem';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useConfig } from 'wagmi';
import { waitForTransactionReceipt } from "@wagmi/core";
import { useReadContract } from "wagmi";


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

  const fetchEmployees = async () => {
    try {
      setIsLoading(true);
      const response = await employerApi.getAllEmployees();
      if (response.status == "success") {
        setEmployees(response.employees || []);
      }
    } catch (error) {
      console.error("Failed to fetch employees:", error);
      toast.error("Failed to load employees");
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
    setTxError('');
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
    } catch (error) {
      console.error("Failed to delete employee:", error);
      toast.error("Failed to delete employee");
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
      const newEmployee = response.message;
      setEmployees((prevEmployees) => [...prevEmployees, newEmployee]);
      setShowAddModal(false);
      fetchEmployees();
      toast.success("Employee added successfully");
    } catch (error) {
      console.error("Failed to add employee:", error);
      toast.error("Failed to add employee");
    }
  };

  const handleUpdateEmployee = async (wallet: string, updatedData: Partial<Employee>) => {
    try {
      const response = await employerApi.updateEmployee(wallet, updatedData);
      const updatedEmployee = response.data;
      setEmployees((prevEmployees) =>
        prevEmployees.map((emp) =>
          emp.wallet === wallet ? updatedEmployee : emp
        )
      );
      setShowAddModal(false);
      setSelectedEmployee(null);
      toast.success("Employee updated successfully");
      fetchEmployees();
    } catch (error) {
      console.error("Failed to update employee:", error);
      toast.error("Failed to update employee");
    }
  };

  // Handle exchange rate updates from the modal
  const handleExchangeRateUpdate = (rate: number, tokenSymbol: string) => {
    setExchangeRate(rate);
    setSelectedTokenSymbol(tokenSymbol);
  };

  const hasTransactionActivity = isLoadingDerived || isTxSuccess || isTxError || !!txError || !!approvalTxHash || !!txHash;
  return (
    <div className='w-screen min-h-screen flex flex-col items-center justify-center'>

      <div className='w-full max-w-[60vw]'>
        <RecipientsTable
          employees={employees}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>


    </div>
  );
}

const PayrollPage = useFullPageLoader(PayrollPageContent, <Loader />);
export default PayrollPage;