import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWalletContext } from '../context/WalletContext';

// Mock data for demonstration
const mockData = {
  collateralRatio: 185,
  minCollateralRatio: 130,
  recommendedRatio: 150,
  availableCollateral: 12500,
  stablecoins: [
    {
      id: '1',
      name: 'USDF',
      symbol: 'USDF',
      icon: '💵',
      balance: 1250.75,
      maxMintable: 8000,
      collateralRatio: 175,
    },
    {
      id: '2',
      name: 'EURF',
      symbol: 'EURF',
      icon: '💶',
      balance: 850.25,
      maxMintable: 7500,
      collateralRatio: 165,
    },
  ],
};

export default function MintPage() {
  const navigate = useNavigate();
  const { balance } = useWalletContext();
  
  // Form state
  const [selectedStablecoin, setSelectedStablecoin] = useState('');
  const [amount, setAmount] = useState('');
  const [targetRatio, setTargetRatio] = useState(mockData.recommendedRatio);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  // Get selected stablecoin details
  const stablecoinDetails = mockData.stablecoins.find(coin => coin.id === selectedStablecoin);
  
  // Calculate required collateral
  const calculateRequiredCollateral = () => {
    if (!amount || !stablecoinDetails) return 0;
    
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount)) return 0;
    
    return (numericAmount * targetRatio) / 100;
  };
  
  // Calculate max mintable based on target ratio
  const calculateMaxMintable = () => {
    if (!stablecoinDetails) return 0;
    
    // This is a simplified calculation
    // In a real app, this would be based on available collateral and target ratio
    return (mockData.availableCollateral * 100) / targetRatio;
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedStablecoin || !amount || parseFloat(amount) <= 0) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // In a real app, you would send the transaction to your API/blockchain here
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error minting stablecoin:', error);
      // Handle error (show error message)
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle success modal close
  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    navigate('/dashboard');
  };
  
  // Handle max button click
  const handleMaxClick = () => {
    if (!selectedStablecoin) return;
    
    const maxAmount = calculateMaxMintable();
    setAmount(maxAmount.toFixed(2));
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
          <h3 className="mb-2 text-xl font-bold">Mint Successful!</h3>
          <p className="mb-4 text-slate-600 dark:text-slate-300">
            You have successfully minted {amount} {stablecoinDetails?.symbol}.
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
        <h1 className="text-2xl font-bold md:text-3xl">Mint Stablecoins</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">
          Mint stablecoins against your deposited collateral
        </p>
      </div>
      
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
                  {mockData.stablecoins.map((coin) => (
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
                            {coin.maxMintable.toLocaleString()} {coin.symbol}
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
              
              {/* Target Collateralization Ratio */}
              <div className="mb-6">
                <label htmlFor="targetRatio" className="mb-2 block text-sm font-medium">
                  Target Collateralization Ratio
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="range"
                    id="targetRatio"
                    min={mockData.minCollateralRatio}
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
                  <span>Min: {mockData.minCollateralRatio}%</span>
                  <span className="text-sky-600 dark:text-sky-400">Recommended: {mockData.recommendedRatio}%</span>
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
                {selectedStablecoin && stablecoinDetails && (
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Max mintable: {calculateMaxMintable().toFixed(2)} {stablecoinDetails.symbol} at {targetRatio}% ratio
                  </p>
                )}
              </div>
              
              {/* Mint Summary */}
              {selectedStablecoin && amount && parseFloat(amount) > 0 && (
                <div className="mb-6 rounded-lg bg-slate-50 p-4 dark:bg-slate-800">
                  <h3 className="mb-2 font-medium">Mint Summary</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-300">Amount to Mint</span>
                      <span className="font-medium">{parseFloat(amount).toLocaleString()} {stablecoinDetails?.symbol}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-300">Target C-Ratio</span>
                      <span className="font-medium">{targetRatio}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-300">Required Collateral</span>
                      <span className="font-medium">${calculateRequiredCollateral().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-300">Available Collateral</span>
                      <span className="font-medium">${mockData.availableCollateral.toLocaleString()}</span>
                    </div>
                  </div>
                  
                  {calculateRequiredCollateral() > mockData.availableCollateral && (
                    <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-300">
                      <div className="flex">
                        <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span>
                          Insufficient collateral. Please deposit more collateral or reduce the amount to mint.
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
                    calculateRequiredCollateral() > mockData.availableCollateral ||
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
                    'Mint Stablecoins'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
        
        {/* Information Panel */}
        <div className="space-y-6">
          <div className="card">
            <h3 className="mb-4 text-lg font-bold">About Minting</h3>
            <p className="mb-4 text-slate-600 dark:text-slate-300">
              Minting stablecoins allows you to create new tokens backed by your deposited collateral. The amount you can mint depends on your collateralization ratio.
            </p>
            <div className="rounded-md bg-sky-50 p-4 dark:bg-sky-900/20">
              <h4 className="mb-2 font-medium text-sky-800 dark:text-sky-300">Important Information</h4>
              <ul className="space-y-2 text-sm text-sky-700 dark:text-sky-300">
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>The minimum collateralization ratio is {mockData.minCollateralRatio}%</span>
                </li>
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>We recommend maintaining at least {mockData.recommendedRatio}% for safety</span>
                </li>
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>You can mint more by depositing additional collateral</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="card">
            <h3 className="mb-4 text-lg font-bold">Collateral Status</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-300">Available Collateral</span>
                <span className="font-medium">${mockData.availableCollateral.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-300">Current C-Ratio</span>
                <span className="font-medium">{mockData.collateralRatio}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-300">Target C-Ratio</span>
                <span className="font-medium">{targetRatio}%</span>
              </div>
              
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                <div 
                  className="h-full rounded-full bg-sky-500"
                  style={{ width: `${Math.min(mockData.collateralRatio / 3, 100)}%` }}
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
                onClick={() => navigate('/collateral/deposit')}
                className="flex w-full items-center justify-between rounded-md bg-slate-100 p-3 text-left transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700"
              >
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="mr-3 h-5 w-5 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Deposit Collateral</span>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <button
                onClick={() => navigate('/redeem')}
                className="flex w-full items-center justify-between rounded-md bg-slate-100 p-3 text-left transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700"
              >
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="mr-3 h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
                  </svg>
                  <span>Redeem Stablecoins</span>
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