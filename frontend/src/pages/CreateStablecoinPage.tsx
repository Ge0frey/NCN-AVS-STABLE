import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStableFunds } from '../hooks/useStableFunds';
import { PublicKey } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletContext } from '../context/WalletContext';
import StableFundsClient, { StablecoinParams, StablebondData } from '../services/anchor-client';
import { logger } from '../services/logger';
import { generateMockTransactionSignature, formatTransactionSignature, getTransactionExplorerUrl, isValidTransactionSignature } from '../utils/transaction';
import { toast } from 'react-toastify';
import Confetti from 'react-confetti';

// Add animation styles to the document
if (typeof document !== 'undefined') {
  // Only run in browser environment
  const style = document.createElement('style');
  style.innerHTML = `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    @keyframes scaleIn {
      from { transform: scale(0.95); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
    
    .animate-fadeIn {
      animation: fadeIn 0.3s ease-out forwards;
    }
    
    .animate-scaleIn {
      animation: scaleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    
    .animate-pulse {
      animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
    
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.8; }
    }
  `;
  document.head.appendChild(style);
}

// Define the steps in the creation process
const STEPS = [
  'Basic Information',
  'Collateral Selection',
  'Parameters',
  'Review & Create'
];

// Define collateral options
const COLLATERAL_OPTIONS = [
  {
    id: 'jitosol',
    name: 'JitoSOL',
    description: 'Liquid staked SOL with Jito, earning staking rewards',
    icon: '🔷',
    minRatio: 150,
    recommendedRatio: 175,
  },
  {
    id: 'stablebond',
    name: 'Stablebond',
    description: 'Secure bonds backed by the protocol treasury',
    icon: '🔒',
    minRatio: 130,
    recommendedRatio: 150,
  },
  {
    id: 'mixed',
    name: 'Mixed Collateral',
    description: 'Combination of JitoSOL and Stablebonds for balanced risk',
    icon: '⚖️',
    minRatio: 140,
    recommendedRatio: 165,
  }
];

// Stablecoin Icons
const STABLECOIN_ICONS = ['💵', '💰', '💎', '🔒', '🪙', '💸', '💲'];

export default function CreateStablecoinPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [confettiPieces, setConfettiPieces] = useState(200);
  
  // Add these hooks
  const { connected } = useWallet();
  const { isCompressionEnabled, compressionClient } = useWalletContext();
  const { 
    loading, 
    error: hookError, 
    stablebonds, 
    fetchStablebonds, 
    createStablecoin,
    addFallbackStablecoin,
    fetchUserStablecoins
  } = useStableFunds();
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    description: '',
    collateralType: '',
    collateralizationRatio: 175,
    initialSupply: 1000,
    icon: '💵',
    selectedStablebond: null as { bondMint: PublicKey, name: string, symbol: string } | null,
    useCompression: false,
  });

  // Fetch stablebonds when collateral type is selected
  useEffect(() => {
    if (formData.collateralType === 'stablebond') {
      setErrorMessage(null); // Clear any previous errors
      setFormData(prev => ({ ...prev, selectedStablebond: null })); // Reset selected stablebond
      
      // Fetch stablebonds with retry mechanism
      fetchStablebonds(3).catch(err => {
        console.error("Failed to fetch stablebonds:", err);
        setErrorMessage("Failed to fetch available stablebonds. Please try again later or select a different collateral type.");
      });
    }
  }, [formData.collateralType, fetchStablebonds]);

  // Clear error when changing steps
  useEffect(() => {
    setErrorMessage(null);
  }, [currentStep]);

  // Show hook error if present
  useEffect(() => {
    if (hookError && !showSuccessModal) {
      setErrorMessage(hookError);
    }
  }, [hookError, showSuccessModal]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle collateral selection
  const handleCollateralSelect = (collateralId: string) => {
    const selectedCollateral = COLLATERAL_OPTIONS.find(option => option.id === collateralId);
    
    // Reset selected stablebond when changing collateral type
    setFormData(prev => ({ 
      ...prev, 
      collateralType: collateralId,
      collateralizationRatio: selectedCollateral?.recommendedRatio || 175,
      selectedStablebond: null
    }));
  };

  // Handle icon selection
  const handleIconSelect = (icon: string) => {
    setFormData(prev => ({ ...prev, icon }));
  };

  // Handle compression toggle
  const handleCompressionToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, useCompression: e.target.checked }));
  };

  // Navigate to next step
  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };

  // Navigate to previous step
  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };

  // Function to show success modal and clear any errors
  const showSuccessModalAndClearErrors = () => {
    // Clear any error messages first
    setErrorMessage(null);
    // Then show the success modal
    setShowSuccessModal(true);
  };

  // Submit the form
  const handleSubmit = async () => {
    if (!connected) {
      setErrorMessage('Please connect your wallet first');
      return;
    }
    
    // Extra validation for stablebond collateral type
    if (formData.collateralType === 'stablebond' && !formData.selectedStablebond) {
      setErrorMessage('Please select a stablebond first');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      let transactionSignature: string;
      
      // Convert collateral type to enum value
      let collateralTypeValue: number = 0; // Default to SOL
      if (formData.collateralType === 'stablebond') {
        collateralTypeValue = 1; // Stablebond
      } else if (formData.collateralType === 'mixed') {
        collateralTypeValue = 2; // Mixed (e.g. USDC)
      }
      
      try {
        // Check if using compression and if it's enabled
        if (formData.useCompression && isCompressionEnabled && compressionClient) {
          // Create compressed stablecoin
          logger.debug('Creating compressed stablecoin:', formData);
          
          try {
            const { signature, mint } = await compressionClient.createCompressedStablecoin(
              formData.name,
              formData.symbol,
              formData.description,
              STABLECOIN_ICONS.indexOf(formData.icon),
              collateralTypeValue,
              formData.collateralizationRatio * 100 // Convert to basis points
            );
            
            transactionSignature = signature;
            logger.debug(`Compressed stablecoin created with signature: ${signature}, mint: ${mint.toBase58()}`);
            setTxSignature(signature);
          } catch (compressionError) {
            logger.error('Error creating compressed stablecoin:', compressionError);
            throw compressionError;
          }
        } else {
          // Create regular stablecoin using existing mechanism
          // Prepare parameters based on selected collateral type
          const params: StablecoinParams = {
            name: formData.name,
            symbol: formData.symbol,
            description: formData.description,
            iconIndex: STABLECOIN_ICONS.indexOf(formData.icon),
            collateralType: collateralTypeValue,
            collateralizationRatio: formData.collateralizationRatio * 100, // Convert to basis points
            initialSupply: BigInt(formData.initialSupply) * BigInt(1000000), // Convert to lamports/smallest units
          };
          
          // Add stablebond mint if selected
          if (formData.collateralType === 'stablebond' && formData.selectedStablebond) {
            params.stablebondMint = formData.selectedStablebond.bondMint;
          }
          
          logger.debug('Creating stablecoin with params:', params);
          
          transactionSignature = await createStablecoin(params);
          logger.debug(`Stablecoin created with signature: ${transactionSignature}`);
          setTxSignature(transactionSignature);
        }
      } catch (blockchainError) {
        // If blockchain tx fails but we're in development mode, use a mock
        if (process.env.NODE_ENV === 'development') {
          console.warn('Using mock transaction in development mode');
          // Use a mock transaction signature for development/demo purposes
          transactionSignature = generateMockTransactionSignature();
          setTxSignature(transactionSignature);
          
          // Add a fallback stablecoin for UI purposes
          await addFallbackStablecoin({
            name: formData.name,
            symbol: formData.symbol,
            mint: new PublicKey(transactionSignature), // Use the mock signature as a "mint" for display purposes
            description: formData.description,
            icon: STABLECOIN_ICONS.indexOf(formData.icon),
            isCompressed: formData.useCompression,
          });
        } else {
          // In production, throw the error
          throw blockchainError;
        }
      }
      
      // Show confetti and success modal
      showSuccessModalAndClearErrors();
      fetchUserStablecoins(); // Refresh stablecoins list
    } catch (error) {
      console.error('Error creating stablecoin:', error);
      setErrorMessage(`Failed to create stablecoin: ${(error as Error).message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isCurrentStepValid = () => {
    switch (currentStep) {
      case 0: // Basic Information
        return formData.name.trim() !== '' && 
               formData.symbol.trim() !== '' && 
               formData.symbol.length <= 5;
      case 1: // Collateral Selection
        // For stablebond type, require a selected stablebond
        if (formData.collateralType === 'stablebond') {
          return Boolean(formData.selectedStablebond);
        }
        return formData.collateralType !== '';
      case 2: // Parameters
        return formData.collateralizationRatio >= 130 && 
               formData.initialSupply > 0;
      default:
        return true;
    }
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderBasicInfoStep();
      case 1:
        return renderCollateralStep();
      case 2:
        return renderParametersStep();
      case 3:
        return renderReviewStep();
      default:
        return null;
    }
  };

  // Step 1: Basic Information
  const renderBasicInfoStep = () => {
    return (
      <div className="space-y-6">
        <div>
          <label htmlFor="name" className="mb-2 block text-sm font-medium">
            Stablecoin Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            className="input"
            placeholder="e.g., US Dollar Fund"
            value={formData.name}
            onChange={handleInputChange}
            required
          />
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Choose a descriptive name for your stablecoin
          </p>
        </div>

        <div>
          <label htmlFor="symbol" className="mb-2 block text-sm font-medium">
            Symbol
          </label>
          <input
            type="text"
            id="symbol"
            name="symbol"
            className="input uppercase"
            placeholder="e.g., USDF"
            maxLength={5}
            value={formData.symbol}
            onChange={handleInputChange}
            required
          />
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            A short identifier for your stablecoin (max 5 characters)
          </p>
        </div>

        <div>
          <label htmlFor="description" className="mb-2 block text-sm font-medium">
            Description (Optional)
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            className="input"
            placeholder="Describe your stablecoin's purpose and features"
            value={formData.description}
            onChange={handleInputChange}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Icon
          </label>
          <div className="grid grid-cols-6 gap-2 sm:grid-cols-8 md:grid-cols-10">
            {['💵', '💶', '💷', '💴', '💰', '🪙', '💎', '🏦', '🔒', '🌐'].map((icon) => (
              <button
                key={icon}
                type="button"
                onClick={() => handleIconSelect(icon)}
                className={`flex h-12 w-12 items-center justify-center rounded-md text-2xl ${
                  formData.icon === icon 
                    ? 'bg-sky-100 ring-2 ring-sky-500 dark:bg-sky-900/30 dark:ring-sky-400' 
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700'
                }`}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Step 2: Collateral Selection
  const renderCollateralStep = () => {
    return (
      <div className="space-y-6">
        <p className="text-slate-600 dark:text-slate-300">
          Select the type of collateral that will back your stablecoin. Different collateral types have different risk profiles and collateralization requirements.
        </p>

        <div className="space-y-4">
          {COLLATERAL_OPTIONS.map((option) => (
            <div
              key={option.id}
              onClick={() => handleCollateralSelect(option.id)}
              className={`cursor-pointer rounded-lg border p-4 transition-all hover:border-sky-500 dark:hover:border-sky-400 ${
                formData.collateralType === option.id
                  ? 'border-sky-500 bg-sky-50 dark:border-sky-400 dark:bg-sky-900/20'
                  : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800'
              }`}
            >
              <div className="flex items-center">
                <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-2xl dark:bg-slate-700">
                  {option.icon}
                </div>
                <div>
                  <h3 className="text-lg font-medium">{option.name}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{option.description}</p>
                </div>
                <div className="ml-auto">
                  <div className={`flex h-6 w-6 items-center justify-center rounded-full border ${
                    formData.collateralType === option.id
                      ? 'border-sky-500 bg-sky-500 text-white dark:border-sky-400 dark:bg-sky-400'
                      : 'border-slate-300 dark:border-slate-600'
                  }`}>
                    {formData.collateralType === option.id && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="mt-4 grid grid-cols-2 gap-4 rounded-md bg-slate-50 p-3 dark:bg-slate-700/50">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Minimum Ratio</p>
                  <p className="font-medium">{option.minRatio}%</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Recommended</p>
                  <p className="font-medium">{option.recommendedRatio}%</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add Stablebond selection when stablebond collateral type is selected */}
        {formData.collateralType === 'stablebond' && (
          <div className="mt-8 backdrop-blur-sm bg-slate-800/40 rounded-xl p-6 border border-slate-700/50 shadow-lg">
            <h3 className="mb-5 text-base font-medium text-slate-200 flex items-center">
              <span className="mr-2 text-lg">🔒</span>
              Select a Stablebond
            </h3>
            
            {loading ? (
              <div className="flex flex-col items-center justify-center py-6">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-sky-400"></div>
                <span className="mt-3 text-sm text-slate-300">Loading available stablebonds...</span>
                <p className="mt-2 text-xs text-slate-400">This may take a moment. We're trying to connect to the Etherfuse SDK.</p>
              </div>
            ) : hookError ? (
              <div className="rounded-md bg-red-900/20 p-3 text-red-400 text-sm">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-4 w-4 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p>{hookError}</p>
                    <div className="mt-2 flex space-x-3">
                      <button
                        onClick={() => fetchStablebonds(3)}
                        className="rounded bg-red-900/30 px-2 py-1 text-xs font-semibold text-red-300 hover:bg-red-900/50"
                      >
                        Try Again
                      </button>
                      <button
                        onClick={() => handleCollateralSelect('jitosol')}
                        className="rounded bg-slate-800 px-2 py-1 text-xs font-semibold text-slate-300 hover:bg-slate-700"
                      >
                        Use JitoSOL Instead
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : stablebonds.length === 0 ? (
              <div className="rounded-md bg-amber-900/20 p-3 text-amber-400 text-sm">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-4 w-4 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p>No stablebonds are currently available. Please select a different collateral type.</p>
                    <div className="mt-2">
                      <button
                        onClick={() => handleCollateralSelect('jitosol')}
                        className="rounded bg-amber-900/30 px-2 py-1 text-xs font-semibold text-amber-300 hover:bg-amber-900/50"
                      >
                        Use JitoSOL Instead
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                <p className="text-xs text-slate-400 mb-3">
                  {stablebonds.length} stablebonds available. Select one to use as collateral.
                </p>
                {stablebonds.map((bond) => (
                  <div
                    key={bond.bondMint.toString()}
                    onClick={() => handleStablebondSelect(bond)}
                    className={`cursor-pointer rounded-lg transition-all backdrop-blur-sm ${
                      formData.selectedStablebond?.bondMint.toString() === bond.bondMint.toString()
                        ? 'bg-slate-700/70 border border-sky-400/80 shadow-md shadow-sky-500/10'
                        : 'bg-slate-800/30 border border-slate-700/50 hover:border-sky-600/30 hover:bg-slate-700/40'
                    }`}
                  >
                    <div className="p-3 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`flex h-5 w-5 items-center justify-center rounded-full ${
                          formData.selectedStablebond?.bondMint.toString() === bond.bondMint.toString()
                            ? 'bg-sky-500 text-white'
                            : 'border border-slate-600'
                        }`}>
                          {formData.selectedStablebond?.bondMint.toString() === bond.bondMint.toString() && (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium text-sm text-slate-200">{bond.name}</h4>
                          <p className="text-xs text-slate-400">{bond.symbol}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="text-xs font-medium text-slate-300">${bond.price.toFixed(2)}</div>
                        <div className="bg-green-900/30 text-green-400 text-xs font-medium px-1.5 py-0.5 rounded">
                          {bond.annualYield.toFixed(2)}% APY
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Step 3: Parameters
  const renderParametersStep = () => {
    const selectedCollateral = COLLATERAL_OPTIONS.find(option => option.id === formData.collateralType);
    
    return (
      <div className="space-y-6">
        <div>
          <label htmlFor="collateralizationRatio" className="mb-2 block text-sm font-medium">
            Collateralization Ratio
          </label>
          <div className="flex items-center space-x-4">
            <input
              type="range"
              id="collateralizationRatio"
              name="collateralizationRatio"
              min={selectedCollateral?.minRatio || 130}
              max="300"
              step="5"
              value={formData.collateralizationRatio}
              onChange={handleInputChange}
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 dark:bg-slate-700"
            />
            <span className="w-16 rounded-md bg-slate-100 px-2 py-1 text-center font-medium dark:bg-slate-800">
              {formData.collateralizationRatio}%
            </span>
          </div>
          <div className="mt-2 flex justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Min: {selectedCollateral?.minRatio || 130}%</span>
            <span className="text-sky-600 dark:text-sky-400">Recommended: {selectedCollateral?.recommendedRatio || 175}%</span>
            <span>Max: 300%</span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Higher ratios provide more security but require more collateral
          </p>
        </div>

        <div>
          <label htmlFor="initialSupply" className="mb-2 block text-sm font-medium">
            Initial Supply
          </label>
          <div className="relative">
            <input
              type="number"
              id="initialSupply"
              name="initialSupply"
              min="1"
              className="input pr-16"
              value={formData.initialSupply}
              onChange={handleInputChange}
              required
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 dark:text-slate-400">
              {formData.symbol || 'TOKENS'}
            </div>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            The amount of stablecoins to mint initially
          </p>
        </div>

        <div className="rounded-lg bg-sky-50 p-4 dark:bg-sky-900/20">
          <h3 className="mb-2 font-medium">Collateral Required</h3>
          <div className="flex items-center justify-between">
            <p className="text-slate-600 dark:text-slate-300">
              To mint {formData.initialSupply} {formData.symbol || 'tokens'} at {formData.collateralizationRatio}% ratio:
            </p>
            <p className="font-bold">
              {((formData.initialSupply * formData.collateralizationRatio) / 100).toFixed(2)} USD
            </p>
          </div>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            You'll need to deposit this amount of {selectedCollateral?.name || 'collateral'} in the next step
          </p>
        </div>
      </div>
    );
  };

  // Step 4: Review
  const renderReviewStep = () => {
    const selectedCollateral = COLLATERAL_OPTIONS.find(option => option.id === formData.collateralType);
    
    return (
      <div className="animate-fadeIn mt-4">
        <h2 className="text-xl font-semibold mb-6">Review Your Stablecoin</h2>
        
        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center mb-4">
            <div className="text-4xl mb-4 md:mr-4 md:mb-0">
              {formData.icon}
            </div>
            <div>
              <h3 className="text-2xl font-semibold mb-1">{formData.name} ({formData.symbol})</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm mb-2">{formData.description || 'No description provided'}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <h4 className="text-sm uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">Collateral Details</h4>
              <div className="mb-4">
                <div className="flex justify-between mb-1">
                  <span className="text-sm">Collateral Type</span>
                  <span className="font-medium">{selectedCollateral?.name || 'Not selected'}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">Collateralization Ratio</span>
                  <span className="font-medium">{formData.collateralizationRatio}%</span>
                </div>
                {formData.collateralType === 'stablebond' && formData.selectedStablebond && (
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Selected Stablebond</span>
                    <span className="font-medium">{formData.selectedStablebond.name} ({formData.selectedStablebond.symbol})</span>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <h4 className="text-sm uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">Supply Information</h4>
              <div className="flex justify-between mb-1">
                <span className="text-sm">Initial Supply</span>
                <span className="font-medium">{formData.initialSupply.toLocaleString()} {formData.symbol}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span className="text-sm">Target Value</span>
                <span className="font-medium">${formData.initialSupply.toLocaleString()}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span className="text-sm">Backing Collateral Value</span>
                <span className="font-medium">${(formData.initialSupply * (formData.collateralizationRatio / 100)).toLocaleString()}</span>
              </div>
              
              {/* Add ZK Compression toggle */}
              {isCompressionEnabled && (
                <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="flex items-center cursor-pointer">
                        <div className="mr-2">
                          <input
                            type="checkbox"
                            checked={formData.useCompression}
                            onChange={handleCompressionToggle}
                            className="sr-only peer"
                          />
                          <div className="relative w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
                        </div>
                        <span className="font-medium">Use ZK Compression</span>
                      </label>
                    </div>
                  </div>
                  <p className="text-xs text-green-700 dark:text-green-400 mt-2">
                    ZK Compression reduces on-chain storage costs by up to 99% while maintaining the same security and functionality.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Add a function to handle stablebond selection
  const handleStablebondSelect = (stablebond: StablebondData) => {
    console.log('Selected stablebond:', stablebond);
    console.log('Mint address:', stablebond.bondMint.toString());
    
    try {
      const selectedBond = {
        bondMint: new PublicKey(stablebond.bondMint.toString()), // Create a new PublicKey instance
        name: stablebond.name,
        symbol: stablebond.symbol,
        price: stablebond.price,
        maturityTime: stablebond.maturityTime,
        issuanceDate: stablebond.issuanceDate,
        annualYield: stablebond.annualYield
      };
      
      console.log('Cloned selected bond:', selectedBond);
      console.log('Cloned mint address:', selectedBond.bondMint.toString());
      
      setFormData(prev => ({
        ...prev,
        selectedStablebond: selectedBond
      }));
    } catch (error) {
      console.error('Error selecting stablebond:', error);
      setErrorMessage('Error selecting stablebond. Please try again.');
    }
  };

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

  // Success Modal
  const renderSuccessModal = () => {
    if (!showSuccessModal) return null;
    
    if (errorMessage) {
      setErrorMessage(null);
    }
    
    
    const isMockSignatureFromStorage = txSignature ? 
      sessionStorage.getItem(`tx-${txSignature}`) === 'mock' : false;
    
    const isMockSignature = isMockSignatureFromStorage || 
      (txSignature && !isValidTransactionSignature(txSignature));
    
    const explorerUrl = isMockSignature || !txSignature ? 
      null : getTransactionExplorerUrl(txSignature);

    const copyToClipboard = () => {
      if (txSignature) {
        navigator.clipboard.writeText(txSignature)
          .then(() => {
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
    
    // Set a session flag to indicate we just created a stablecoin
    // This helps the StablecoinsPage know to refresh
    sessionStorage.setItem('just_created_stablecoin', 'true');
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
        {/* Confetti effect */}
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          numberOfPieces={confettiPieces}
          recycle={false}
          colors={['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f97316']}
        />
        
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
            <h3 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-sky-600 bg-clip-text text-transparent dark:from-green-400 dark:to-sky-400">Stablecoin Created!</h3>
            <p className="mt-2 text-slate-600 dark:text-slate-300">
              Your stablecoin <span className="font-semibold">{formData.name}</span> (<span className="font-mono">{formData.symbol}</span>) has been successfully created and is now available in your wallet.
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
          
          {/* Stablecoin Details Card */}
          <div className="mb-6 rounded-lg bg-slate-50 dark:bg-slate-900/50 overflow-hidden border border-slate-200 dark:border-slate-700/50 shadow-inner">
            <div className="bg-slate-100 dark:bg-slate-800 px-4 py-3 border-b border-slate-200 dark:border-slate-700/50">
              <div className="flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-500 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Stablecoin Details</p>
              </div>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/50 dark:bg-slate-800/50 p-3 rounded-md border border-slate-200 dark:border-slate-700/30">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Initial Supply</p>
                  <p className="text-sm font-semibold">{formData.initialSupply.toLocaleString()} <span className="font-mono">{formData.symbol}</span></p>
                </div>
                <div className="bg-white/50 dark:bg-slate-800/50 p-3 rounded-md border border-slate-200 dark:border-slate-700/30">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Collateral Type</p>
                  <p className="text-sm font-semibold">{
                    formData.collateralType === 'stablebond' ? 'Stablebond' : 
                    formData.collateralType === 'jitosol' ? 'JitoSOL' : 'USDC'
                  }</p>
                </div>
                <div className="col-span-2 bg-white/50 dark:bg-slate-800/50 p-3 rounded-md border border-slate-200 dark:border-slate-700/30">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Collateralization Ratio</p>
                  <div className="flex items-center">
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 mr-2">
                      <div className="bg-gradient-to-r from-sky-400 to-sky-600 h-2.5 rounded-full dark:from-sky-600 dark:to-sky-400" 
                          style={{ width: `${Math.min(100, formData.collateralizationRatio / 3)}%` }}></div>
                    </div>
                    <span className="text-sm font-semibold">{formData.collateralizationRatio}%</span>
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
                // Pass state to indicate we're coming from the create page
                navigate('/stablecoins', { state: { fromCreate: true } });
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

  // Render current step
  const renderCurrentStep = () => {
    // If there's an error, show it at the top of the current step
    const errorAlert = errorMessage ? (
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
    ) : null;

    switch (currentStep) {
      case 0:
        return (
          <>
            {errorAlert}
            {renderBasicInfoStep()}
          </>
        );
      case 1:
        return (
          <>
            {errorAlert}
            {renderCollateralStep()}
          </>
        );
      case 2:
        return (
          <>
            {errorAlert}
            {renderParametersStep()}
          </>
        );
      case 3:
        return (
          <>
            {errorAlert}
            {renderReviewStep()}
          </>
        );
      default:
        return <div>Unknown step</div>;
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold md:text-3xl">Create Stablecoin</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">
          Design and launch your own custom stablecoin backed by your choice of collateral
        </p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => (
            <div key={index} className="flex flex-1 items-center">
              <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-medium ${
                index < currentStep 
                  ? 'bg-sky-500 text-white dark:bg-sky-600' 
                  : index === currentStep 
                    ? 'border-2 border-sky-500 bg-white text-sky-500 dark:border-sky-400 dark:bg-slate-800 dark:text-sky-400' 
                    : 'border border-slate-300 bg-white text-slate-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400'
              }`}>
                {index < currentStep ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
              {index < STEPS.length - 1 && (
                <div className={`flex-1 border-t ${
                  index < currentStep ? 'border-sky-500 dark:border-sky-600' : 'border-slate-300 dark:border-slate-600'
                }`}></div>
              )}
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-xs">
          {STEPS.map((step, index) => (
            <div 
              key={index} 
              className={`w-1/4 text-center ${
                index <= currentStep 
                  ? 'text-sky-600 dark:text-sky-400' 
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {step}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="card mb-6">
        {renderCurrentStep()}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <button
          type="button"
          onClick={handleBack}
          disabled={currentStep === 0}
          className={`btn ${
            currentStep === 0 
              ? 'invisible' 
              : 'btn-outline'
          }`}
        >
          Back
        </button>
        
        {currentStep < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={handleNext}
            disabled={!isCurrentStepValid()}
            className="btn btn-primary"
          >
            Continue
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !isCurrentStepValid()}
            className="btn btn-primary"
          >
            {isSubmitting ? (
              <>
                <svg className="mr-2 h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating...
              </>
            ) : (
              'Create Stablecoin'
            )}
          </button>
        )}
      </div>

      {/* Success Modal */}
      {renderSuccessModal()}
    </div>
  );
} 