import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStableFunds } from '../hooks/useStableFunds';
import { PublicKey } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';

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

export default function CreateStablecoinPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [txSignature, setTxSignature] = useState<string | null>(null);
  
  // Add these hooks
  const { connected } = useWallet();
  const { 
    loading, 
    error, 
    stablebonds, 
    fetchStablebonds, 
    createStablecoin 
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
  });

  // Fetch stablebonds when collateral type is selected
  useEffect(() => {
    if (formData.collateralType === 'stablebond') {
      fetchStablebonds();
    }
  }, [formData.collateralType, fetchStablebonds]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle collateral selection
  const handleCollateralSelect = (collateralId: string) => {
    const selectedCollateral = COLLATERAL_OPTIONS.find(option => option.id === collateralId);
    
    setFormData(prev => ({ 
      ...prev, 
      collateralType: collateralId,
      collateralizationRatio: selectedCollateral?.recommendedRatio || 175
    }));
  };

  // Handle icon selection
  const handleIconSelect = (icon: string) => {
    setFormData(prev => ({ ...prev, icon }));
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

  // Submit the form
  const handleSubmit = async () => {
    if (!connected) {
      alert('Please connect your wallet first');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Prepare the parameters for creating a stablecoin
      const params = {
        name: formData.name,
        symbol: formData.symbol,
        description: formData.description,
        iconIndex: parseInt(formData.icon.codePointAt(0)?.toString() || '0') % 10, // Convert emoji to number
        collateralType: formData.collateralType === 'stablebond' ? 'Stablebond' : 
                        formData.collateralType === 'jitosol' ? 'SOL' : 'USDC',
        stablebondMint: formData.selectedStablebond?.bondMint,
        collateralizationRatio: formData.collateralizationRatio,
        initialSupply: formData.initialSupply,
      };
      
      // Call the createStablecoin function from our hook
      const { signature } = await createStablecoin(params);
      
      // Store the transaction signature for display
      setTxSignature(signature);
      
      // Show success modal
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error creating stablecoin:', error);
      alert(`Failed to create stablecoin: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle success modal close
  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    navigate('/stablecoins');
  };

  // Validate current step
  const isCurrentStepValid = () => {
    switch (currentStep) {
      case 0: // Basic Information
        return formData.name.trim() !== '' && 
               formData.symbol.trim() !== '' && 
               formData.symbol.length <= 5;
      case 1: // Collateral Selection
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
          <div className="mt-8">
            <h3 className="mb-4 text-lg font-medium">Select a Stablebond</h3>
            
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-sky-500"></div>
              </div>
            ) : error ? (
              <div className="rounded-md bg-red-50 p-4 text-red-700 dark:bg-red-900/20 dark:text-red-400">
                {error}
              </div>
            ) : stablebonds.length === 0 ? (
              <div className="rounded-md bg-amber-50 p-4 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                No stablebonds available. Please try again later.
              </div>
            ) : (
              <div className="space-y-3">
                {stablebonds.map((bond) => (
                  <div
                    key={bond.bondMint.toString()}
                    onClick={() => handleStablebondSelect(bond)}
                    className={`cursor-pointer rounded-lg border p-4 transition-all hover:border-sky-500 dark:hover:border-sky-400 ${
                      formData.selectedStablebond?.bondMint.toString() === bond.bondMint.toString()
                        ? 'border-sky-500 bg-sky-50 dark:border-sky-400 dark:bg-sky-900/20'
                        : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{bond.name}</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{bond.symbol}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${bond.price.toFixed(2)}</p>
                        <p className="text-sm text-green-600 dark:text-green-400">
                          {bond.annualYield.toFixed(2)}% APY
                        </p>
                      </div>
                      <div className="ml-4">
                        <div className={`flex h-6 w-6 items-center justify-center rounded-full border ${
                          formData.selectedStablebond?.bondMint.toString() === bond.bondMint.toString()
                            ? 'border-sky-500 bg-sky-500 text-white dark:border-sky-400 dark:bg-sky-400'
                            : 'border-slate-300 dark:border-slate-600'
                        }`}>
                          {formData.selectedStablebond?.bondMint.toString() === bond.bondMint.toString() && (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
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
      <div className="space-y-6">
        <p className="text-slate-600 dark:text-slate-300">
          Review your stablecoin details before creating it. Once created, some properties cannot be changed.
        </p>
        
        <div className="rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="border-b border-slate-200 p-4 dark:border-slate-700">
            <h3 className="text-lg font-medium">Basic Information</h3>
          </div>
          <div className="p-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Name</p>
                <p className="font-medium">{formData.name}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Symbol</p>
                <p className="font-medium">{formData.symbol}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-slate-500 dark:text-slate-400">Description</p>
                <p className="font-medium">{formData.description}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Icon</p>
                <p className="text-2xl">{formData.icon}</p>
              </div>
            </div>
          </div>
          
          <div className="border-b border-t border-slate-200 p-4 dark:border-slate-700">
            <h3 className="text-lg font-medium">Collateral</h3>
          </div>
          <div className="p-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Type</p>
                <p className="font-medium">{selectedCollateral?.name}</p>
              </div>
              
              {formData.collateralType === 'stablebond' && formData.selectedStablebond && (
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Selected Stablebond</p>
                  <p className="font-medium">{formData.selectedStablebond.name} ({formData.selectedStablebond.symbol})</p>
                </div>
              )}
              
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Collateralization Ratio</p>
                <p className="font-medium">{formData.collateralizationRatio}%</p>
              </div>
            </div>
          </div>
          
          <div className="border-b border-t border-slate-200 p-4 dark:border-slate-700">
            <h3 className="text-lg font-medium">Supply</h3>
          </div>
          <div className="p-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Initial Supply</p>
                <p className="font-medium">{formData.initialSupply.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Add a function to handle stablebond selection
  const handleStablebondSelect = (stablebond) => {
    setFormData(prev => ({
      ...prev,
      selectedStablebond: stablebond
    }));
  };

  // Success Modal
  const renderSuccessModal = () => {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-slate-800">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="mb-2 text-xl font-bold">Stablecoin Created!</h3>
          <p className="mb-4 text-slate-600 dark:text-slate-300">
            Your stablecoin has been successfully created and is now available in your wallet.
          </p>
          
          {txSignature && (
            <div className="mb-4 overflow-hidden rounded-md bg-slate-100 p-3 dark:bg-slate-700">
              <p className="mb-1 text-xs text-slate-500 dark:text-slate-400">Transaction Signature:</p>
              <p className="overflow-x-auto text-sm font-mono">{txSignature}</p>
            </div>
          )}
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => navigate('/stablecoins')}
              className="rounded-md bg-sky-600 px-4 py-2 text-white hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-600"
            >
              View My Stablecoins
            </button>
            <button
              onClick={() => setShowSuccessModal(false)}
              className="rounded-md border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
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
        {renderStepContent()}
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
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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