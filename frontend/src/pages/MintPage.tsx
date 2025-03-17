import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useStableFunds } from '../hooks/useStableFunds';
import { generateMockTransactionSignature, formatTransactionSignature, getTransactionExplorerUrl, isValidTransactionSignature } from '../utils/transaction';

// Interface for the navigation state
interface MintPageLocationState {
  stablecoinId?: string;
}

export default function MintPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as MintPageLocationState;
  
  // Get the stablecoin ID from the navigation state
  const stablecoinId = state?.stablecoinId || '';
  
  console.log('MintPage initialized with stablecoinId:', stablecoinId);
  
  const { 
    userStablecoins, 
    fetchUserStablecoins, 
    mintStablecoin, 
    loading: isLoading 
  } = useStableFunds();

  const [selectedStablecoin, setSelectedStablecoin] = useState<string>(stablecoinId || '');
  const [amount, setAmount] = useState('');
  const [targetRatio, setTargetRatio] = useState(150); // Default recommended ratio
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [txSignature, setTxSignature] = useState<string | null>(null);
  
  // Get selected stablecoin details
  const stablecoinDetails = userStablecoins.find(coin => coin.id === selectedStablecoin);
  
  // Refresh user stablecoins when component mounts
  useEffect(() => {
    console.log('MintPage mounted, fetching stablecoins...');
    fetchUserStablecoins();
  }, [fetchUserStablecoins]);
  
  // Set the selected stablecoin when stablecoinId changes or when userStablecoins are loaded
  useEffect(() => {
    if (stablecoinId && userStablecoins.length > 0) {
      console.log('Setting selected stablecoin from stablecoinId:', stablecoinId);
      console.log('Available stablecoins:', userStablecoins.map(coin => ({ id: coin.id, name: coin.name, symbol: coin.symbol })));
      
      const exists = userStablecoins.some(coin => coin.id === stablecoinId);
      if (exists) {
        setSelectedStablecoin(stablecoinId);
        console.log('Selected stablecoin set successfully');
      } else {
        console.warn(`Stablecoin with ID ${stablecoinId} not found in user stablecoins`);
      }
    }
  }, [stablecoinId, userStablecoins]);
  
  // Log when selected stablecoin changes
  useEffect(() => {
    if (selectedStablecoin) {
      console.log('Selected stablecoin changed to:', selectedStablecoin);
      const details = userStablecoins.find(coin => coin.id === selectedStablecoin);
      console.log('Selected stablecoin details:', details);
    }
  }, [selectedStablecoin, userStablecoins]);
  
  // Calculate required collateral
  const calculateRequiredCollateral = () => {
    if (!amount || !stablecoinDetails) return 0;
    
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount)) return 0;
    
    return (numericAmount * targetRatio) / 100;
  };
  
  // Calculate max mintable based on collateral ratio and balance
  const calculateMaxMintable = (coin) => {
    if (!coin) return 0;
    
    // This is a simplified calculation based on available data
    // In a real app, this would be more complex based on collateral value and ratio
    const collateralAmount = coin.collateralAmount || coin.balance * 1.5; // Fallback calculation
    const collateralRatio = coin.collateralRatio || 150; // Default to 150% if not specified
    
    // Calculate max mintable: collateral amount / (collateral ratio / 100)
    const maxMintable = collateralAmount / (collateralRatio / 100);
    
    // Return a reasonable value, with a minimum of the current balance
    return Math.max(maxMintable, coin.balance);
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedStablecoin || !amount || parseFloat(amount) <= 0) {
      setErrorMessage('Please select a stablecoin and enter a valid amount');
      return;
    }
    
    if (!stablecoinDetails) {
      setErrorMessage('Selected stablecoin not found');
      console.error('Stablecoin details not found for ID:', selectedStablecoin);
      console.log('Available stablecoins:', userStablecoins.map(coin => ({ id: coin.id, name: coin.name })));
      return;
    }
    
    const mintAmount = parseFloat(amount);
    
    setIsSubmitting(true);
    setErrorMessage(null);
    
    try {
      console.log(`Minting ${mintAmount} ${stablecoinDetails.symbol} stablecoins...`);
      console.log('Selected stablecoin ID:', selectedStablecoin);
      console.log('Stablecoin details:', stablecoinDetails);
      
      // Call the mintStablecoin function from the hook
      const result = await mintStablecoin(selectedStablecoin, mintAmount);
      console.log('Mint result:', result);
      
      const signature = result.signature;
      console.log(`Mint successful! Transaction signature: ${signature}`);
      
      // Store the transaction signature for display
      setTxSignature(signature);
      
      // Show success modal
      setShowSuccessModal(true);
      
      // Refresh stablecoins to update balances
      fetchUserStablecoins();
    } catch (error) {
      console.error('Error minting stablecoin:', error);
      
      // Provide more specific error messages based on the error
      let errorMsg = 'Failed to mint stablecoin. Please try again.';
      
      if (error instanceof Error) {
        errorMsg = error.message;
        
        // Check for specific error conditions
        if (error.message.includes('insufficient')) {
          errorMsg = 'Insufficient balance to mint this amount. Please try a smaller amount.';
        } else if (error.message.includes('network') || error.message.includes('timeout')) {
          errorMsg = 'Network error. Please check your connection and try again.';
        } else if (error.message.includes('rejected')) {
          errorMsg = 'Transaction was rejected. Please try again.';
        }
      }
      
      setErrorMessage(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle success modal close
  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    setTxSignature(null);
    
    // Navigate back to the stablecoins page
    navigate('/stablecoins');
  };
  
  // Handle max button click
  const handleMaxClick = () => {
    if (!selectedStablecoin || !stablecoinDetails) return;
    
    const maxAmount = calculateMaxMintable(stablecoinDetails);
    setAmount(maxAmount.toFixed(2));
  };
  
  // Copy transaction signature to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(
      () => {
        // Show a temporary message that the signature was copied
        const messageElement = document.getElementById('copy-message');
        if (messageElement) {
          messageElement.classList.remove('hidden');
          setTimeout(() => {
            messageElement.classList.add('hidden');
          }, 2000);
        }
      },
      (err) => {
        console.error('Could not copy text: ', err);
      }
    );
  };
  
  // Success Modal
  const renderSuccessModal = () => {
    if (!showSuccessModal) return null;
    
    // Determine if this is a mock signature
    // First check if we have a flag in session storage
    const isMockSignatureFromStorage = txSignature ? 
      sessionStorage.getItem(`tx-${txSignature}`) === 'mock' : false;
    
    // If we don't have a flag, check if the signature is a valid Solana signature format
    // This way we can handle both old and new signature formats
    const isMockSignature = isMockSignatureFromStorage || 
      (txSignature && !isValidTransactionSignature(txSignature));
    
    // Generate explorer URL for the transaction if it's a real signature
    const explorerUrl = isMockSignature || !txSignature ? 
      null : getTransactionExplorerUrl(txSignature);
    
    // Function to copy the signature to clipboard
    const copyToClipboard = () => {
      if (txSignature) {
        navigator.clipboard.writeText(txSignature)
          .then(() => {
            // Show a temporary message indicating it was copied
            const el = document.getElementById('copy-message');
            if (el) {
              el.classList.remove('hidden');
              setTimeout(() => {
                el.classList.add('hidden');
              }, 2000);
            }
          })
          .catch(err => {
            console.error('Failed to copy signature: ', err);
          });
      }
    };
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
        <div className="w-full max-w-lg rounded-xl bg-white/95 p-6 shadow-2xl dark:bg-slate-800/95 dark:shadow-blue-900/20 border border-slate-200/20 dark:border-slate-700/30 transform transition-all duration-300 animate-scaleIn">
          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 ring-8 ring-green-50 dark:ring-green-900/10 animate-pulse">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          
          {/* Title and Description */}
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-sky-600 bg-clip-text text-transparent dark:from-green-400 dark:to-sky-400">Mint Successful!</h3>
            <p className="mt-2 text-slate-600 dark:text-slate-300">
              You have successfully minted <span className="font-semibold">{amount} {stablecoinDetails?.symbol}</span>.
            </p>
          </div>
          
          {/* Transaction Signature Card */}
          {txSignature && (
            <div className="mb-6 rounded-lg overflow-hidden bg-slate-50 shadow-inner dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50">
              <div className="bg-slate-100 dark:bg-slate-800 px-4 py-3 border-b border-slate-200 dark:border-slate-700/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-500 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Transaction Signature</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={copyToClipboard}
                      className="rounded p-1.5 bg-slate-200 hover:bg-slate-300 transition-colors dark:bg-slate-700 dark:hover:bg-slate-600"
                      title="Copy to clipboard"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-600 dark:text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                    </button>
                    <span id="copy-message" className="hidden text-xs font-medium bg-green-100 text-green-800 py-0.5 px-2 rounded-full transition-all duration-300 dark:bg-green-800/30 dark:text-green-400">
                      Copied!
                    </span>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <div className="overflow-x-auto rounded bg-slate-100 p-3 font-mono text-xs dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 leading-relaxed tracking-wider break-all">
                  {formatTransactionSignature(txSignature, true, 20)}
                </div>
                {explorerUrl && (
                  <div className="mt-3 text-right">
                    <a 
                      href={explorerUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-xs text-sky-600 hover:text-sky-800 dark:text-sky-400 dark:hover:text-sky-300 transition-colors"
                    >
                      <span>View on Solana Explorer</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Transaction Details Card */}
          <div className="mb-6 rounded-lg bg-slate-50 dark:bg-slate-900/50 overflow-hidden border border-slate-200 dark:border-slate-700/50 shadow-inner">
            <div className="bg-slate-100 dark:bg-slate-800 px-4 py-3 border-b border-slate-200 dark:border-slate-700/50">
              <div className="flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-500 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Transaction Details</p>
              </div>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/50 dark:bg-slate-800/50 p-3 rounded-md border border-slate-200 dark:border-slate-700/30">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Amount Minted</p>
                  <p className="text-sm font-semibold">{parseFloat(amount).toLocaleString()} <span className="font-mono">{stablecoinDetails?.symbol}</span></p>
                </div>
                <div className="bg-white/50 dark:bg-slate-800/50 p-3 rounded-md border border-slate-200 dark:border-slate-700/30">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Stablecoin</p>
                  <p className="text-sm font-semibold">{stablecoinDetails?.name}</p>
                </div>
                <div className="col-span-2 bg-white/50 dark:bg-slate-800/50 p-3 rounded-md border border-slate-200 dark:border-slate-700/30">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Collateralization Ratio</p>
                  <div className="flex items-center">
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 mr-2">
                      <div className="bg-gradient-to-r from-sky-400 to-sky-600 h-2.5 rounded-full dark:from-sky-600 dark:to-sky-400" 
                          style={{ width: `${Math.min(100, targetRatio / 3)}%` }}></div>
                    </div>
                    <span className="text-sm font-semibold">{targetRatio}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => {
                setShowSuccessModal(false);
                navigate('/stablecoins');
              }}
              className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white font-medium shadow-lg shadow-sky-500/20 hover:shadow-sky-600/30 transition-all duration-200 dark:from-sky-600 dark:to-sky-800 dark:shadow-sky-800/30"
            >
              View My Stablecoins
            </button>
            <button
              onClick={() => setShowSuccessModal(false)}
              className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-100 hover:border-slate-400 transition-all duration-200 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:border-slate-500"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  // Calculate max mintable for the selected stablecoin
  const maxMintable = stablecoinDetails ? calculateMaxMintable(stablecoinDetails) : 0;
  
  // Calculate required collateral based on amount and target ratio
  const requiredCollateral = calculateRequiredCollateral();
  
  // Render the component
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold md:text-3xl">Mint Stablecoins</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">
          Mint stablecoins against your deposited collateral
        </p>
      </div>
      
      {/* Error message */}
      {errorMessage && (
        <div className="mb-6 rounded-md bg-red-50 p-4 dark:bg-red-900/20">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error</h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                {errorMessage}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Loading state */}
      {isLoading && !isSubmitting && (
        <div className="flex justify-center py-12">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-sky-500"></div>
        </div>
      )}
      
      {/* No stablecoins state */}
      {!isLoading && userStablecoins.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
          <svg xmlns="http://www.w3.org/2000/svg" className="mb-2 h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="mb-1 text-lg font-medium">No stablecoins found</h3>
          <p className="mb-4 text-slate-500 dark:text-slate-400">
            Create a stablecoin first before minting
          </p>
          <button
            onClick={() => navigate('/stablecoins/create')}
            className="btn btn-primary"
          >
            Create Stablecoin
          </button>
        </div>
      )}
      
      {!isLoading && userStablecoins.length > 0 && (
        <div className="grid gap-8 md:grid-cols-3">
          <div className="md:col-span-2">
            <div className="card">
              <form onSubmit={handleSubmit}>
                {/* Stablecoin Selection */}
                <div className="mb-6">
                  <label className="mb-2 block text-sm font-medium">
                    Select Stablecoin to Mint
                  </label>
                  <div className="space-y-4">
                    {userStablecoins.map((coin) => {
                      // Calculate max mintable for each coin
                      const maxMintable = calculateMaxMintable(coin);
                      
                      return (
                        <div
                          key={coin.id}
                          onClick={() => setSelectedStablecoin(coin.id)}
                          className={`cursor-pointer rounded-lg border p-4 transition-all hover:border-sky-500 dark:hover:border-sky-400 ${
                            selectedStablecoin === coin.id
                              ? 'border-sky-500 bg-sky-50 dark:border-sky-400 dark:bg-sky-900/20'
                              : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800'
                          }`}
                        >
                          <div className="flex items-center">
                            <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-2xl dark:bg-slate-700">
                              {coin.icon}
                            </div>
                            <div className="flex-1">
                              <h3 className="text-lg font-medium">{coin.name}</h3>
                              <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
                                <span>Symbol: {coin.symbol}</span>
                                <span className="mx-2">•</span>
                                <span>Balance: {coin.balance.toLocaleString()}</span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className={`flex h-6 w-6 items-center justify-center rounded-full border ${
                                selectedStablecoin === coin.id
                                  ? 'border-sky-500 bg-sky-500 text-white dark:border-sky-400 dark:bg-sky-400'
                                  : 'border-slate-300 dark:border-slate-600'
                              }`}>
                                {selectedStablecoin === coin.id && (
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="mt-4 flex justify-between rounded-md bg-slate-50 p-3 dark:bg-slate-700/50">
                            <div>
                              <p className="text-xs text-slate-500 dark:text-slate-400">Max Mintable</p>
                              <p className="font-medium">
                                {maxMintable.toLocaleString()} {coin.symbol}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500 dark:text-slate-400">C-Ratio</p>
                              <p className="font-medium">
                                {coin.collateralRatio}%
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {/* Target Collateralization Ratio */}
                <div className="mb-6">
                  <label htmlFor="targetRatio" className="mb-2 block text-sm font-medium">
                    Target Collateralization Ratio
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="range"
                      id="targetRatio"
                      min={130}
                      max="300"
                      step="5"
                      value={targetRatio}
                      onChange={(e) => setTargetRatio(parseInt(e.target.value))}
                      className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 dark:bg-slate-700"
                      disabled={!selectedStablecoin}
                    />
                    <span className="w-16 rounded-md bg-slate-100 px-2 py-1 text-center font-medium dark:bg-slate-800">
                      {targetRatio}%
                    </span>
                  </div>
                  <div className="mt-2 flex justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>Min: 130%</span>
                    <span className="text-sky-600 dark:text-sky-400">Recommended: 150%</span>
                    <span>Max: 300%</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Higher ratios provide more security but allow minting fewer stablecoins
                  </p>
                </div>
                
                {/* Amount Input */}
                <div className="mb-6">
                  <label htmlFor="amount" className="mb-2 block text-sm font-medium">
                    Amount to Mint
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      id="amount"
                      className="input pr-24"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      disabled={!selectedStablecoin}
                      min="0"
                      step="any"
                      required
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center">
                      <button
                        type="button"
                        className="mr-2 rounded-md bg-slate-100 px-2 py-1 text-xs font-medium hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600"
                        onClick={handleMaxClick}
                        disabled={!selectedStablecoin}
                      >
                        MAX
                      </button>
                      <span className="mr-3 text-slate-500 dark:text-slate-400">
                        {stablecoinDetails?.symbol || 'TOKENS'}
                      </span>
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Enter the amount of tokens you want to mint
                  </p>
                </div>
                
                {/* Submit Button */}
                <div>
                  <button
                    type="submit"
                    className="btn btn-primary w-full"
                    disabled={isSubmitting || !selectedStablecoin || !amount || parseFloat(amount) <= 0}
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="mr-2 h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Minting...
                      </>
                    ) : (
                      'Mint Stablecoins'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
          
          <div>
            <div className="card">
              <h3 className="mb-4 text-lg font-medium">Transaction Summary</h3>
              
              <div className="mb-6 space-y-4">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Stablecoin</span>
                  <span className="font-medium">{stablecoinDetails?.name || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Symbol</span>
                  <span className="font-medium">{stablecoinDetails?.symbol || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Current Balance</span>
                  <span className="font-medium">{stablecoinDetails ? stablecoinDetails.balance.toLocaleString() : '-'} {stablecoinDetails?.symbol}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Amount to Mint</span>
                  <span className="font-medium">{amount ? parseFloat(amount).toLocaleString() : '-'} {stablecoinDetails?.symbol}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Target C-Ratio</span>
                  <span className="font-medium">{targetRatio}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Required Collateral</span>
                  <span className="font-medium">${requiredCollateral.toLocaleString()}</span>
                </div>
              </div>
              
              <div className="rounded-lg bg-sky-50 p-4 dark:bg-sky-900/20">
                <h4 className="mb-2 font-medium">After This Transaction</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-300">New Balance</span>
                    <span className="font-bold">
                      {stablecoinDetails && amount
                        ? (stablecoinDetails.balance + parseFloat(amount || '0')).toLocaleString()
                        : '-'} {stablecoinDetails?.symbol}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Success Modal */}
      {renderSuccessModal()}
    </div>
  );
} 