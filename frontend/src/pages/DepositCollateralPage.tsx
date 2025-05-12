import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWalletContext } from '../context/WalletContext';
import { PublicKey } from '@solana/web3.js';
import { createCompressedCollateralService } from '../services/compressed-collateral';

// Define collateral options
const COLLATERAL_OPTIONS = [
  {
    id: 'jitosol',
    name: 'JitoSOL',
    description: 'Liquid staked SOL with Jito, earning staking rewards',
    icon: '🔷',
    conversionRate: 0.95, // 1 JitoSOL = 0.95 SOL
    apy: 5.2,
  },
  {
    id: 'stablebond',
    name: 'Stablebond',
    description: 'Secure bonds backed by the protocol treasury',
    icon: '🔒',
    conversionRate: 1, // 1 Stablebond = $1
    apy: 3.8,
  },
];

export default function DepositCollateralPage() {
  const navigate = useNavigate();
  const { balance, publicKey, isCompressionEnabled, compressionClient } = useWalletContext();
  
  // Form state
  const [selectedCollateral, setSelectedCollateral] = useState('');
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [walletBalances, setWalletBalances] = useState({
    jitosol: 10.5,
    stablebond: 2500,
  });
  const [useCompression, setUseCompression] = useState(false);
  const [compressedCollateralService, setCompressedCollateralService] = useState<any>(null);

  // Initialize compressed collateral service
  useEffect(() => {
    if (isCompressionEnabled && compressionClient && publicKey) {
      const service = createCompressedCollateralService({
        connected: true,
        publicKey,
        signTransaction: (window as any).solana?.signTransaction,
        signAllTransactions: (window as any).solana?.signAllTransactions,
      }, compressionClient);
      
      setCompressedCollateralService(service);
    }
  }, [isCompressionEnabled, compressionClient, publicKey]);

  // Get selected collateral details
  const collateralDetails = COLLATERAL_OPTIONS.find(option => option.id === selectedCollateral);

  // Calculate USD value
  const calculateUsdValue = () => {
    if (!amount || !collateralDetails) return 0;
    
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount)) return 0;
    
    return numericAmount * collateralDetails.conversionRate;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCollateral || !amount || parseFloat(amount) <= 0) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const amountValue = parseFloat(amount);
      
      // Check if using compression
      if (useCompression && isCompressionEnabled && compressedCollateralService) {
        console.log('Using compressed collateral');
        
        // For hackathon, we simulate with a mock stablecoin config
        // In a real implementation, this would be the actual stablecoin config address
        const stablecoinConfig = new PublicKey('So11111111111111111111111111111111111111112');
        
        const signature = await compressedCollateralService.depositCollateral(
          stablecoinConfig,
          amountValue
        );
        
        console.log('Deposited compressed collateral with signature:', signature);
      } else {
        // Regular deposit (simulated for hackathon)
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error depositing collateral:', error);
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

  // Handle max button click
  const handleMaxClick = () => {
    if (!selectedCollateral) return;
    
    if (selectedCollateral === 'jitosol') {
      setAmount(walletBalances.jitosol.toString());
    } else if (selectedCollateral === 'stablebond') {
      setAmount(walletBalances.stablebond.toString());
    }
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
          <h3 className="mb-2 text-xl font-bold">Deposit Successful!</h3>
          <p className="mb-4 text-slate-600 dark:text-slate-300">
            You have successfully deposited {amount} {collateralDetails?.name} as collateral.
            {useCompression && isCompressionEnabled && (
              <span className="block mt-2 text-green-600 font-medium">
                ✓ Using ZK Compression for 99.4% lower storage costs!
              </span>
            )}
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

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold md:text-3xl">Deposit Collateral</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">
          Deposit assets as collateral to back your stablecoins
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2">
          <div className="card">
            <form onSubmit={handleSubmit}>
              {/* Collateral Type Selection */}
              <div className="mb-6">
                <label className="mb-2 block text-sm font-medium">
                  Select Collateral Type
                </label>
                <div className="space-y-4">
                  {COLLATERAL_OPTIONS.map((option) => (
                    <div
                      key={option.id}
                      onClick={() => setSelectedCollateral(option.id)}
                      className={`cursor-pointer rounded-lg border p-4 transition-all hover:border-sky-500 dark:hover:border-sky-400 ${
                        selectedCollateral === option.id
                          ? 'border-sky-500 bg-sky-50 dark:border-sky-400 dark:bg-sky-900/20'
                          : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-2xl dark:bg-slate-700">
                          {option.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-medium">{option.name}</h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400">{option.description}</p>
                        </div>
                        <div className="ml-4">
                          <div className={`flex h-6 w-6 items-center justify-center rounded-full border ${
                            selectedCollateral === option.id
                              ? 'border-sky-500 bg-sky-500 text-white dark:border-sky-400 dark:bg-sky-400'
                              : 'border-slate-300 dark:border-slate-600'
                          }`}>
                            {selectedCollateral === option.id && (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex justify-between rounded-md bg-slate-50 p-3 dark:bg-slate-700/50">
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">APY</p>
                          <p className="font-medium text-green-600 dark:text-green-400">{option.apy}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Your Balance</p>
                          <p className="font-medium">
                            {option.id === 'jitosol' 
                              ? `${walletBalances.jitosol} JitoSOL` 
                              : `${walletBalances.stablebond} BOND`}
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
                  Amount to Deposit
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="amount"
                    className="input pr-24"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    disabled={!selectedCollateral}
                    min="0"
                    step="any"
                    required
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center">
                    <button
                      type="button"
                      className="mr-2 rounded-md bg-slate-100 px-2 py-1 text-xs font-medium hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600"
                      onClick={handleMaxClick}
                      disabled={!selectedCollateral}
                    >
                      MAX
                    </button>
                    <span className="mr-3 text-slate-500 dark:text-slate-400">
                      {selectedCollateral === 'jitosol' ? 'JitoSOL' : selectedCollateral === 'stablebond' ? 'BOND' : ''}
                    </span>
                  </div>
                </div>
                {selectedCollateral && (
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Available: {selectedCollateral === 'jitosol' 
                      ? `${walletBalances.jitosol} JitoSOL` 
                      : `${walletBalances.stablebond} BOND`}
                  </p>
                )}
              </div>

              {/* Summary */}
              {selectedCollateral && amount && parseFloat(amount) > 0 && (
                <div className="mb-6 rounded-lg bg-slate-50 p-4 dark:bg-slate-800">
                  <h3 className="mb-2 font-medium">Deposit Summary</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-300">Amount</span>
                      <span className="font-medium">{amount} {collateralDetails?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-300">Value</span>
                      <span className="font-medium">${calculateUsdValue().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-300">APY</span>
                      <span className="font-medium text-green-600 dark:text-green-400">{collateralDetails?.apy}%</span>
                    </div>
                  </div>
                </div>
              )}

              {/* ZK Compression toggle */}
              {isCompressionEnabled && (
                <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="flex items-center cursor-pointer">
                        <div className="mr-2">
                          <input
                            type="checkbox"
                            checked={useCompression}
                            onChange={(e) => setUseCompression(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="relative w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
                        </div>
                        <span className="font-medium">Use ZK Compression</span>
                      </label>
                    </div>
                    <div className="text-green-600 text-sm font-medium">
                      160x cheaper storage!
                    </div>
                  </div>
                  <p className="text-xs text-green-700 dark:text-green-400 mt-2">
                    ZK Compression reduces collateral account storage costs by 99.4% while maintaining the same security and functionality.
                  </p>
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
                  disabled={!selectedCollateral || !amount || parseFloat(amount) <= 0 || isSubmitting}
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
                    'Deposit Collateral'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Information Panel */}
        <div className="space-y-6">
          <div className="card">
            <h3 className="mb-4 text-lg font-bold">About Collateral</h3>
            <p className="mb-4 text-slate-600 dark:text-slate-300">
              Collateral is used to back your stablecoins and ensure their value. The more collateral you deposit, the more stablecoins you can mint.
            </p>
            <div className="space-y-4">
              <div>
                <h4 className="mb-1 font-medium">JitoSOL</h4>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Liquid staked SOL that earns staking rewards while being used as collateral. Higher yield but with price volatility.
                </p>
              </div>
              <div>
                <h4 className="mb-1 font-medium">Stablebond</h4>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Stable-value bonds backed by the protocol treasury. Lower yield but with price stability.
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="mb-4 text-lg font-bold">Benefits</h3>
            <ul className="space-y-2 text-slate-600 dark:text-slate-300">
              <li className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-5 w-5 flex-shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Earn APY while your assets are used as collateral</span>
              </li>
              <li className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-5 w-5 flex-shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Mint stablecoins against your collateral</span>
              </li>
              <li className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-5 w-5 flex-shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Withdraw your collateral at any time (subject to maintaining minimum collateralization ratio)</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {renderSuccessModal()}
    </div>
  );
} 