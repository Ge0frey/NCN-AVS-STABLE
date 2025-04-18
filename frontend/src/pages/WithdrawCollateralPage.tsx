import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWalletContext } from '../context/WalletContext';
import { useStableFunds } from '../hooks/useStableFunds';
import Confetti from 'react-confetti';

export default function WithdrawCollateralPage() {
  const navigate = useNavigate();
  const { balance, publicKey } = useWalletContext();
  const { 
    userStablecoins, 
    loading, 
    error, 
    fetchUserStablecoins
  } = useStableFunds();
  
  // For this page, we would need additional data about collateral assets
  // which would come from a dedicated API call in a real implementation
  // For now, we'll simulate some derived data
  const [collateralAssets, setCollateralAssets] = useState([
    {
      id: 'jitosol',
      name: 'JitoSOL',
      icon: '🔷',
      balance: 8.32,
      value: 7500,
      conversionRate: 0.95,
      maxWithdrawable: 5.1,
    },
    {
      id: 'stablebond',
      name: 'Stablebond',
      icon: '🔒',
      balance: 5000,
      value: 5000,
      conversionRate: 1,
      maxWithdrawable: 3000,
    },
  ]);
  
  // Derived data
  const totalCollateralValue = collateralAssets.reduce((sum, asset) => sum + asset.value, 0);
  const averageCollateralRatio = userStablecoins.length > 0 
    ? userStablecoins.reduce((sum, coin) => sum + coin.collateralRatio, 0) / userStablecoins.length 
    : 150;
  
  // Refresh user stablecoins when component mounts
  useEffect(() => {
    fetchUserStablecoins();
  }, [fetchUserStablecoins]);
  
  // Form state
  const [selectedAsset, setSelectedAsset] = useState('');
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [newCollateralRatio, setNewCollateralRatio] = useState(averageCollateralRatio);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [confettiPieces, setConfettiPieces] = useState(200);

  // Get selected asset details
  const assetDetails = collateralAssets.find(asset => asset.id === selectedAsset);

  // Calculate USD value
  const calculateUsdValue = () => {
    if (!amount || !assetDetails) return 0;
    
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount)) return 0;
    
    return numericAmount * assetDetails.conversionRate;
  };

  // Calculate new collateral ratio after withdrawal
  useEffect(() => {
    if (!selectedAsset || !amount) {
      setNewCollateralRatio(averageCollateralRatio);
      return;
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setNewCollateralRatio(averageCollateralRatio);
      return;
    }

    const withdrawValue = calculateUsdValue();
    const newTotalCollateral = totalCollateralValue - withdrawValue;
    
    // Assuming stablecoin value is totalCollateralValue / collateralRatio
    const stablecoinValue = totalCollateralValue / averageCollateralRatio * 100;
    
    if (stablecoinValue === 0) {
      setNewCollateralRatio(0);
      return;
    }
    
    const newRatio = (newTotalCollateral / stablecoinValue) * 100;
    setNewCollateralRatio(Math.max(0, newRatio));
  }, [selectedAsset, amount, totalCollateralValue, averageCollateralRatio]);

  // Handle window resize for confetti
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Reduce confetti gradually
  useEffect(() => {
    if (showSuccessModal && confettiPieces > 0) {
      const timer = setTimeout(() => {
        setConfettiPieces(prevPieces => Math.max(0, prevPieces - 10));
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [confettiPieces, showSuccessModal]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedAsset || !amount || parseFloat(amount) <= 0) {
      return;
    }
    
    // Check if withdrawal would bring collateral ratio below minimum
    if (newCollateralRatio < 130) {
      setShowWarningModal(true);
      return;
    }
    
    await processWithdrawal();
  };

  // Process the withdrawal
  const processWithdrawal = async () => {
    setIsSubmitting(true);
    
    try {
      // In a real app, you would send the transaction to your API/blockchain here
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error withdrawing collateral:', error);
      // Handle error (show error message)
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle success modal close
  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    navigate('/collateral');
  };

  // Handle warning modal actions
  const handleWarningCancel = () => {
    setShowWarningModal(false);
  };

  const handleWarningConfirm = () => {
    setShowWarningModal(false);
    processWithdrawal();
  };

  // Handle max button click
  const handleMaxClick = () => {
    if (!selectedAsset || !assetDetails) return;
    setAmount(assetDetails.maxWithdrawable.toString());
  };

  // Get health status color based on ratio
  const getHealthStatusColor = (ratio: number) => {
    if (ratio >= 175) return 'text-green-500 dark:text-green-400';
    if (ratio >= 150) return 'text-sky-500 dark:text-sky-400';
    if (ratio >= 130) return 'text-amber-500 dark:text-amber-400';
    return 'text-red-500 dark:text-red-400';
  };

  // Success Modal
  const renderSuccessModal = () => {
    if (!showSuccessModal) return null;
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn">
        {/* Confetti effect */}
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          numberOfPieces={confettiPieces}
          recycle={false}
          colors={['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f97316']}
        />
        
        <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-slate-800 transform transition-all animate-scaleIn">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="mb-2 text-xl font-bold">Withdrawal Successful!</h3>
          <p className="mb-4 text-slate-600 dark:text-slate-300">
            You have successfully withdrawn {amount} {assetDetails?.name} from your collateral.
          </p>
          <div className="flex justify-end">
            <button
              onClick={handleSuccessModalClose}
              className="btn btn-primary"
            >
              View Collateral
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Warning Modal
  const renderWarningModal = () => {
    if (!showWarningModal) return null;
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-slate-800">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="mb-2 text-xl font-bold">Warning: Low Collateral Ratio</h3>
          <p className="mb-4 text-slate-600 dark:text-slate-300">
            This withdrawal will reduce your collateralization ratio to <span className="font-bold text-red-500">{newCollateralRatio.toFixed(2)}%</span>, which is below the minimum required ratio of 130%.
          </p>
          <p className="mb-4 text-slate-600 dark:text-slate-300">
            This puts your position at risk of liquidation. Are you sure you want to proceed?
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={handleWarningCancel}
              className="btn btn-outline"
            >
              Cancel
            </button>
            <button
              onClick={handleWarningConfirm}
              className="btn bg-red-500 text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700"
            >
              Proceed Anyway
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold md:text-3xl">Withdraw Collateral</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">
          Withdraw your deposited collateral assets
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2">
          <div className="card">
            <form onSubmit={handleSubmit}>
              {/* Collateral Type Selection */}
              <div className="mb-6">
                <label className="mb-2 block text-sm font-medium">
                  Select Collateral to Withdraw
                </label>
                <div className="space-y-4">
                  {collateralAssets.map((asset) => (
                    <div
                      key={asset.id}
                      onClick={() => setSelectedAsset(asset.id)}
                      className={`cursor-pointer rounded-lg border p-4 transition-all hover:border-sky-500 dark:hover:border-sky-400 ${
                        selectedAsset === asset.id
                          ? 'border-sky-500 bg-sky-50 dark:border-sky-400 dark:bg-sky-900/20'
                          : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-2xl dark:bg-slate-700">
                          {asset.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-medium">{asset.name}</h3>
                          <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
                            <span>Balance: {asset.balance} {asset.id === 'jitosol' ? 'JitoSOL' : 'BOND'}</span>
                            <span className="mx-2">•</span>
                            <span>Value: ${asset.value.toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className={`flex h-6 w-6 items-center justify-center rounded-full border ${
                            selectedAsset === asset.id
                              ? 'border-sky-500 bg-sky-500 text-white dark:border-sky-400 dark:bg-sky-400'
                              : 'border-slate-300 dark:border-slate-600'
                          }`}>
                            {selectedAsset === asset.id && (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex justify-between rounded-md bg-slate-50 p-3 dark:bg-slate-700/50">
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Max Withdrawable</p>
                          <p className="font-medium">
                            {asset.maxWithdrawable} {asset.id === 'jitosol' ? 'JitoSOL' : 'BOND'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Value</p>
                          <p className="font-medium">
                            ${(asset.maxWithdrawable * asset.conversionRate).toFixed(2)}
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
                  Amount to Withdraw
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="amount"
                    className="input pr-24"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    disabled={!selectedAsset}
                    min="0"
                    step="any"
                    required
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center">
                    <button
                      type="button"
                      className="mr-2 rounded-md bg-slate-100 px-2 py-1 text-xs font-medium hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600"
                      onClick={handleMaxClick}
                      disabled={!selectedAsset}
                    >
                      MAX
                    </button>
                    <span className="mr-3 text-slate-500 dark:text-slate-400">
                      {selectedAsset === 'jitosol' ? 'JitoSOL' : selectedAsset === 'stablebond' ? 'BOND' : ''}
                    </span>
                  </div>
                </div>
                {selectedAsset && assetDetails && (
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Available: {assetDetails.balance} {assetDetails.id === 'jitosol' ? 'JitoSOL' : 'BOND'} 
                    (Max withdrawable: {assetDetails.maxWithdrawable} {assetDetails.id === 'jitosol' ? 'JitoSOL' : 'BOND'})
                  </p>
                )}
              </div>

              {/* Collateralization Impact */}
              {selectedAsset && amount && parseFloat(amount) > 0 && (
                <div className="mb-6 rounded-lg bg-slate-50 p-4 dark:bg-slate-800">
                  <h3 className="mb-2 font-medium">Withdrawal Impact</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-300">Amount</span>
                      <span className="font-medium">{amount} {assetDetails?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-300">Value</span>
                      <span className="font-medium">${calculateUsdValue().toFixed(2)}</span>
                    </div>
                    <div className="border-t border-slate-200 pt-4 dark:border-slate-700">
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-300">Current C-Ratio</span>
                        <span className={`font-medium ${getHealthStatusColor(averageCollateralRatio)}`}>
                          {averageCollateralRatio.toFixed(2)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-300">New C-Ratio</span>
                        <span className={`font-medium ${getHealthStatusColor(newCollateralRatio)}`}>
                          {newCollateralRatio.toFixed(2)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-300">Minimum Required</span>
                        <span className="font-medium">130%</span>
                      </div>
                    </div>
                    
                    {newCollateralRatio < 130 && (
                      <div className="rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-300">
                        <div className="flex">
                          <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <span>
                            Warning: This withdrawal will put your position at risk of liquidation. Consider withdrawing a smaller amount.
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => navigate('/collateral')}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    !selectedAsset || 
                    !amount || 
                    parseFloat(amount) <= 0 || 
                    (assetDetails && parseFloat(amount) > assetDetails.balance) ||
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
                    'Withdraw Collateral'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Information Panel */}
        <div className="space-y-6">
          <div className="card">
            <h3 className="mb-4 text-lg font-bold">About Withdrawals</h3>
            <p className="mb-4 text-slate-600 dark:text-slate-300">
              You can withdraw your collateral at any time, as long as you maintain the minimum collateralization ratio for your stablecoins.
            </p>
            <div className="rounded-md bg-sky-50 p-4 dark:bg-sky-900/20">
              <h4 className="mb-2 font-medium text-sky-800 dark:text-sky-300">Important Information</h4>
              <ul className="space-y-2 text-sm text-sky-700 dark:text-sky-300">
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>The minimum collateralization ratio is 130%</span>
                </li>
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>If your ratio falls below this threshold, your position may be subject to liquidation</span>
                </li>
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>To withdraw more collateral, you can first burn some of your stablecoins</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="card">
            <h3 className="mb-4 text-lg font-bold">Collateralization Status</h3>
            <div className="space-y-4">
              <div>
                <div className="mb-1 flex justify-between">
                  <span className="text-sm text-slate-500 dark:text-slate-400">Current Ratio</span>
                  <span className={`font-medium ${getHealthStatusColor(averageCollateralRatio)}`}>
                    {averageCollateralRatio.toFixed(2)}%
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                  <div 
                    className={`h-full rounded-full ${
                      averageCollateralRatio >= 175 ? 'bg-green-500' :
                      averageCollateralRatio >= 150 ? 'bg-sky-500' :
                      averageCollateralRatio >= 130 ? 'bg-amber-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(averageCollateralRatio / 2, 100)}%` }}
                  ></div>
                </div>
              </div>
              
              {selectedAsset && amount && parseFloat(amount) > 0 && (
                <div>
                  <div className="mb-1 flex justify-between">
                    <span className="text-sm text-slate-500 dark:text-slate-400">After Withdrawal</span>
                    <span className={`font-medium ${getHealthStatusColor(newCollateralRatio)}`}>
                      {newCollateralRatio.toFixed(2)}%
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                    <div 
                      className={`h-full rounded-full ${
                        newCollateralRatio >= 175 ? 'bg-green-500' :
                        newCollateralRatio >= 150 ? 'bg-sky-500' :
                        newCollateralRatio >= 130 ? 'bg-amber-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(newCollateralRatio / 2, 100)}%` }}
                    ></div>
                  </div>
                </div>
              )}
              
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>0%</span>
                <span>100%</span>
                <span>130%</span>
                <span>150%</span>
                <span>175%+</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {renderSuccessModal()}
      
      {/* Warning Modal */}
      {renderWarningModal()}
    </div>
  );
} 