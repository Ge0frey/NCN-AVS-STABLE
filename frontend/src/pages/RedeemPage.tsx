import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStableFunds } from '../hooks/useStableFunds';

export default function RedeemPage() {
  const navigate = useNavigate();
  const { 
    userStablecoins, 
    loading, 
    error, 
    fetchUserStablecoins
  } = useStableFunds();
  
  // Form state
  const [selectedStablecoin, setSelectedStablecoin] = useState('');
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [txSignature, setTxSignature] = useState<string | null>(null);
  
  // Refresh user stablecoins when component mounts
  useEffect(() => {
    fetchUserStablecoins();
  }, [fetchUserStablecoins]);
  
  // Get selected stablecoin details
  const stablecoinDetails = userStablecoins.find(coin => coin.id === selectedStablecoin);
  
  // Calculate average collateral ratio for all stablecoins
  const averageCollateralRatio = userStablecoins.length > 0 
    ? userStablecoins.reduce((sum, coin) => sum + coin.collateralRatio, 0) / userStablecoins.length 
    : 150;
    
  // Calculate new collateral ratio after redemption (simplified calculation)
  const calculateNewCollateralRatio = () => {
    if (!amount || !stablecoinDetails) return averageCollateralRatio;
    
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) return averageCollateralRatio;
    
    return averageCollateralRatio + 5;
  };
  
  // Calculate collateral to receive
  const calculateCollateralToReceive = () => {
    if (!amount || !stablecoinDetails) return 0;
    
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount)) return 0;
    
    // This is a simplified calculation
    return (numericAmount * 100) / stablecoinDetails.collateralRatio;
  };
  
  // Calculate collateral value
  const calculateCollateralValue = () => {
    const collateralAmount = calculateCollateralToReceive();
    if (!stablecoinDetails) return 0;
    
    return collateralAmount * 0.95; // Simplified conversion rate
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedStablecoin || !amount || parseFloat(amount) <= 0) {
      return;
    }
    
    if (!stablecoinDetails) {
      setErrorMessage("Stablecoin details not found. Please try again.");
      return;
    }
    
    setIsSubmitting(true);
    setErrorMessage(null);
    
    try {
      console.log(`Redeeming ${amount} ${stablecoinDetails.symbol} for ${calculateCollateralToReceive().toFixed(4)} ${stablecoinDetails.collateralType}`);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setTxSignature("SimulatedTxSignature" + Date.now().toString());
      
      // Show success modal
      setShowSuccessModal(true);
      
      await fetchUserStablecoins();
    } catch (error) {
      console.error('Error redeeming stablecoin:', error);
      setErrorMessage("Failed to redeem stablecoin. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    navigate('/dashboard');
  };
  
  // Handle max button click
  const handleMaxClick = () => {
    if (!selectedStablecoin || !stablecoinDetails) return;
    
    setAmount(stablecoinDetails.balance.toString());
  };
  
  // Success Modal
  const renderSuccessModal = () => {
    if (!showSuccessModal) return null;
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-slate-800">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="mb-2 text-xl font-bold">Redemption Successful!</h3>
          <p className="mb-4 text-slate-600 dark:text-slate-300">
            You have successfully redeemed {amount} {stablecoinDetails?.symbol} for {calculateCollateralToReceive().toFixed(4)} {stablecoinDetails?.collateralType}.
          </p>
          <div className="flex justify-end">
            <button
              onClick={handleSuccessModalClose}
              className="btn btn-primary"
            >
              View Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold md:text-3xl">Redeem Stablecoins</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">
          Redeem your stablecoins back to collateral
        </p>
      </div>
      
      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2">
          <div className="card">
            <form onSubmit={handleSubmit}>
              {/* Stablecoin Selection */}
              <div className="mb-6">
                <label className="mb-2 block text-sm font-medium">
                  Select Stablecoin to Redeem
                </label>
                <div className="space-y-4">
                  {userStablecoins.map((coin) => (
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
                          <p className="text-xs text-slate-500 dark:text-slate-400">Collateral Type</p>
                          <p className="font-medium">
                            {coin.collateralType === 'JitoSOL' ? '🔷' : 
                             coin.collateralType === 'Stablebond' ? '🔒' : '💰'} {coin.collateralType}
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
                  ))}
                </div>
              </div>
              
              {/* Amount Input */}
              <div className="mb-6">
                <label htmlFor="amount" className="mb-2 block text-sm font-medium">
                  Amount to Redeem
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
                {selectedStablecoin && stablecoinDetails && (
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Available: {stablecoinDetails.balance.toLocaleString()} {stablecoinDetails.symbol}
                  </p>
                )}
              </div>
              
              {/* Show error message if any */}
              {errorMessage && (
                <div className="mb-6 rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-300">
                  <div className="flex">
                    <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>{errorMessage}</span>
                  </div>
                </div>
              )}
              
              {/* Redemption Summary */}
              {selectedStablecoin && amount && parseFloat(amount) > 0 && (
                <div className="mb-6 rounded-lg bg-slate-50 p-4 dark:bg-slate-800">
                  <h3 className="mb-2 font-medium">Redemption Summary</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-300">Amount to Redeem</span>
                      <span className="font-medium">{parseFloat(amount).toLocaleString()} {stablecoinDetails?.symbol}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-300">Collateral to Receive</span>
                      <span className="font-medium">
                        {calculateCollateralToReceive().toFixed(4)} {stablecoinDetails?.collateralType}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-300">Collateral Value</span>
                      <span className="font-medium">${calculateCollateralValue().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-300">Exchange Rate</span>
                      <span className="font-medium">
                        1 {stablecoinDetails?.symbol} = {(100 / stablecoinDetails?.collateralRatio!).toFixed(4)} {stablecoinDetails?.collateralType}
                      </span>
                    </div>
                  </div>
                  
                  {stablecoinDetails && parseFloat(amount) > stablecoinDetails.balance && (
                    <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-300">
                      <div className="flex">
                        <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span>
                          Insufficient balance. You only have {stablecoinDetails.balance.toLocaleString()} {stablecoinDetails.symbol}.
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Submit Button */}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    !selectedStablecoin || 
                    !amount || 
                    parseFloat(amount) <= 0 || 
                    (stablecoinDetails && parseFloat(amount) > stablecoinDetails.balance) ||
                    isSubmitting
                  }
                  className="btn btn-primary"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="mr-2 h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    'Redeem Stablecoins'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
        
        {/* Information Panel */}
        <div className="space-y-6">
          <div className="card">
            <h3 className="mb-4 text-lg font-bold">About Redemption</h3>
            <p className="mb-4 text-slate-600 dark:text-slate-300">
              Redeeming stablecoins allows you to convert your tokens back to the underlying collateral. This process burns the stablecoins and releases the collateral.
            </p>
            <div className="rounded-md bg-sky-50 p-4 dark:bg-sky-900/20">
              <h4 className="mb-2 font-medium text-sky-800 dark:text-sky-300">Important Information</h4>
              <ul className="space-y-2 text-sm text-sky-700 dark:text-sky-300">
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Redemption is irreversible once confirmed</span>
                </li>
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>The amount of collateral you receive depends on the current collateralization ratio</span>
                </li>
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Redeeming stablecoins improves your overall collateralization ratio</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="card">
            <h3 className="mb-4 text-lg font-bold">Collateral Status</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-300">Current C-Ratio</span>
                <span className="font-medium">{averageCollateralRatio.toFixed(2)}%</span>
              </div>
              
              {selectedStablecoin && amount && parseFloat(amount) > 0 && stablecoinDetails && (
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-300">After Redemption</span>
                  <span className="font-medium text-green-500 dark:text-green-400">
                    {calculateNewCollateralRatio().toFixed(2)}%
                  </span>
                </div>
              )}
              
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                <div 
                  className="h-full rounded-full bg-sky-500"
                  style={{ width: `${Math.min(averageCollateralRatio / 3, 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>0%</span>
                <span>100%</span>
                <span>200%</span>
                <span>300%</span>
              </div>
            </div>
          </div>
          
          <div className="card">
            <h3 className="mb-4 text-lg font-bold">Quick Actions</h3>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/mint')}
                className="flex w-full items-center justify-between rounded-md bg-slate-100 p-3 text-left transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700"
              >
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="mr-3 h-5 w-5 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Mint Stablecoins</span>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <button
                onClick={() => navigate('/collateral')}
                className="flex w-full items-center justify-between rounded-md bg-slate-100 p-3 text-left transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700"
              >
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="mr-3 h-5 w-5 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span>View Collateral</span>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Success Modal */}
      {renderSuccessModal()}
    </div>
  );
} 