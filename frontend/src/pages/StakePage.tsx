import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWalletContext } from '../context/WalletContext';

// Mock data for demonstration
const mockData = {
  jitoSolBalance: 8.32,
  stakedJitoSol: 12.5,
  totalStaked: 1250000,
  apy: 5.2,
  stakingOptions: [
    {
      id: 'flexible',
      name: 'Flexible',
      description: 'No lock period, withdraw anytime',
      apy: 5.2,
      lockPeriod: 0,
      minAmount: 0.1,
    },
    {
      id: 'locked30',
      name: '30-Day Lock',
      description: 'Lock for 30 days for higher rewards',
      apy: 6.5,
      lockPeriod: 30,
      minAmount: 0.5,
    },
    {
      id: 'locked90',
      name: '90-Day Lock',
      description: 'Lock for 90 days for maximum rewards',
      apy: 8.0,
      lockPeriod: 90,
      minAmount: 1.0,
    },
  ],
  rewardHistory: [
    { date: '2024-02-01', amount: 0.042 },
    { date: '2024-01-01', amount: 0.039 },
    { date: '2023-12-01', amount: 0.044 },
    { date: '2023-11-01', amount: 0.041 },
    { date: '2023-10-01', amount: 0.038 },
  ],
};

export default function StakePage() {
  const navigate = useNavigate();
  const { balance } = useWalletContext();
  
  // Form state
  const [selectedOption, setSelectedOption] = useState('');
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'stake' | 'unstake'>('stake');
  
  // Get selected staking option details
  const stakingOption = mockData.stakingOptions.find(option => option.id === selectedOption);
  
  // Calculate estimated rewards
  const calculateEstimatedRewards = () => {
    if (!amount || !stakingOption) return { monthly: 0, yearly: 0 };
    
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount)) return { monthly: 0, yearly: 0 };
    
    const yearlyReward = numericAmount * (stakingOption.apy / 100);
    const monthlyReward = yearlyReward / 12;
    
    return { monthly: monthlyReward, yearly: yearlyReward };
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedOption || !amount || parseFloat(amount) <= 0) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // In a real app, you would send the transaction to your API/blockchain here
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error staking JitoSOL:', error);
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
    if (activeTab === 'stake') {
      setAmount(mockData.jitoSolBalance.toString());
    } else {
      setAmount(mockData.stakedJitoSol.toString());
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
          <h3 className="mb-2 text-xl font-bold">
            {activeTab === 'stake' ? 'Staking Successful!' : 'Unstaking Successful!'}
          </h3>
          <p className="mb-4 text-slate-600 dark:text-slate-300">
            {activeTab === 'stake' 
              ? `You have successfully staked ${amount} JitoSOL.`
              : `You have successfully unstaked ${amount} JitoSOL.`
            }
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
  
  // Render staking form
  const renderStakingForm = () => {
    return (
      <form onSubmit={handleSubmit}>
        {/* Staking Option Selection */}
        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium">
            Select Staking Option
          </label>
          <div className="space-y-4">
            {mockData.stakingOptions.map((option) => (
              <div
                key={option.id}
                onClick={() => setSelectedOption(option.id)}
                className={`cursor-pointer rounded-lg border p-4 transition-all hover:border-sky-500 dark:hover:border-sky-400 ${
                  selectedOption === option.id
                    ? 'border-sky-500 bg-sky-50 dark:border-sky-400 dark:bg-sky-900/20'
                    : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800'
                }`}
              >
                <div className="flex items-center">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium">{option.name}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{option.description}</p>
                  </div>
                  <div className="ml-4">
                    <div className={`flex h-6 w-6 items-center justify-center rounded-full border ${
                      selectedOption === option.id
                        ? 'border-sky-500 bg-sky-500 text-white dark:border-sky-400 dark:bg-sky-400'
                        : 'border-slate-300 dark:border-slate-600'
                    }`}>
                      {selectedOption === option.id && (
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
                    <p className="text-xs text-slate-500 dark:text-slate-400">Lock Period</p>
                    <p className="font-medium">
                      {option.lockPeriod > 0 ? `${option.lockPeriod} days` : 'None'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Min Amount</p>
                    <p className="font-medium">{option.minAmount} JitoSOL</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Amount Input */}
        <div className="mb-6">
          <label htmlFor="amount" className="mb-2 block text-sm font-medium">
            Amount to Stake
          </label>
          <div className="relative">
            <input
              type="number"
              id="amount"
              className="input pr-24"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={!selectedOption}
              min="0"
              step="any"
              required
            />
            <div className="absolute inset-y-0 right-0 flex items-center">
              <button
                type="button"
                className="mr-2 rounded-md bg-slate-100 px-2 py-1 text-xs font-medium hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600"
                onClick={handleMaxClick}
                disabled={!selectedOption}
              >
                MAX
              </button>
              <span className="mr-3 text-slate-500 dark:text-slate-400">
                JitoSOL
              </span>
            </div>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Available: {mockData.jitoSolBalance.toLocaleString()} JitoSOL
          </p>
        </div>
        
        {/* Staking Summary */}
        {selectedOption && amount && parseFloat(amount) > 0 && (
          <div className="mb-6 rounded-lg bg-slate-50 p-4 dark:bg-slate-800">
            <h3 className="mb-2 font-medium">Staking Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-300">Amount to Stake</span>
                <span className="font-medium">{parseFloat(amount).toLocaleString()} JitoSOL</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-300">Staking Option</span>
                <span className="font-medium">{stakingOption?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-300">Lock Period</span>
                <span className="font-medium">
                  {stakingOption?.lockPeriod ? `${stakingOption.lockPeriod} days` : 'None'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-300">APY</span>
                <span className="font-medium text-green-600 dark:text-green-400">{stakingOption?.apy}%</span>
              </div>
              <div className="border-t border-slate-200 pt-2 dark:border-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-300">Est. Monthly Rewards</span>
                  <span className="font-medium">{calculateEstimatedRewards().monthly.toFixed(4)} JitoSOL</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-300">Est. Yearly Rewards</span>
                  <span className="font-medium">{calculateEstimatedRewards().yearly.toFixed(4)} JitoSOL</span>
                </div>
              </div>
            </div>
            
            {stakingOption && parseFloat(amount) < stakingOption.minAmount && (
              <div className="mt-4 rounded-md bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
                <div className="flex">
                  <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>
                    Minimum amount for this staking option is {stakingOption.minAmount} JitoSOL.
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
              !selectedOption || 
              !amount || 
              parseFloat(amount) <= 0 || 
              parseFloat(amount) > mockData.jitoSolBalance ||
              (stakingOption && parseFloat(amount) < stakingOption.minAmount) ||
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
              'Stake JitoSOL'
            )}
          </button>
        </div>
      </form>
    );
  };
  
  // Render unstaking form
  const renderUnstakingForm = () => {
    return (
      <form onSubmit={handleSubmit}>
        {/* Amount Input */}
        <div className="mb-6">
          <label htmlFor="unstakeAmount" className="mb-2 block text-sm font-medium">
            Amount to Unstake
          </label>
          <div className="relative">
            <input
              type="number"
              id="unstakeAmount"
              className="input pr-24"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              step="any"
              required
            />
            <div className="absolute inset-y-0 right-0 flex items-center">
              <button
                type="button"
                className="mr-2 rounded-md bg-slate-100 px-2 py-1 text-xs font-medium hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600"
                onClick={handleMaxClick}
              >
                MAX
              </button>
              <span className="mr-3 text-slate-500 dark:text-slate-400">
                JitoSOL
              </span>
            </div>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Staked: {mockData.stakedJitoSol.toLocaleString()} JitoSOL
          </p>
        </div>
        
        {/* Unstaking Summary */}
        {amount && parseFloat(amount) > 0 && (
          <div className="mb-6 rounded-lg bg-slate-50 p-4 dark:bg-slate-800">
            <h3 className="mb-2 font-medium">Unstaking Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-300">Amount to Unstake</span>
                <span className="font-medium">{parseFloat(amount).toLocaleString()} JitoSOL</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-300">Remaining Staked</span>
                <span className="font-medium">
                  {Math.max(0, mockData.stakedJitoSol - parseFloat(amount)).toFixed(4)} JitoSOL
                </span>
              </div>
            </div>
            
            {parseFloat(amount) > mockData.stakedJitoSol && (
              <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-300">
                <div className="flex">
                  <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>
                    Insufficient staked balance. You only have {mockData.stakedJitoSol.toLocaleString()} JitoSOL staked.
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
              !amount || 
              parseFloat(amount) <= 0 || 
              parseFloat(amount) > mockData.stakedJitoSol ||
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
              'Unstake JitoSOL'
            )}
          </button>
        </div>
      </form>
    );
  };
  
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold md:text-3xl">Jito Restaking</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">
          Stake your JitoSOL to earn additional rewards
        </p>
      </div>
      
      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2">
          <div className="card">
            {/* Tabs */}
            <div className="mb-6 flex border-b border-slate-200 dark:border-slate-700">
              <button
                className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${
                  activeTab === 'stake'
                    ? 'border-sky-500 text-sky-600 dark:border-sky-400 dark:text-sky-400'
                    : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:text-slate-300'
                }`}
                onClick={() => setActiveTab('stake')}
              >
                Stake
              </button>
              <button
                className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${
                  activeTab === 'unstake'
                    ? 'border-sky-500 text-sky-600 dark:border-sky-400 dark:text-sky-400'
                    : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:text-slate-300'
                }`}
                onClick={() => setActiveTab('unstake')}
              >
                Unstake
              </button>
            </div>
            
            {/* Tab Content */}
            {activeTab === 'stake' ? renderStakingForm() : renderUnstakingForm()}
          </div>
        </div>
        
        {/* Information Panel */}
        <div className="space-y-6">
          <div className="card">
            <h3 className="mb-4 text-lg font-bold">Staking Overview</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-300">Available JitoSOL</span>
                <span className="font-medium">{mockData.jitoSolBalance.toLocaleString()} JitoSOL</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-300">Staked JitoSOL</span>
                <span className="font-medium">{mockData.stakedJitoSol.toLocaleString()} JitoSOL</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-300">Current APY</span>
                <span className="font-medium text-green-600 dark:text-green-400">{mockData.apy}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-300">Total Staked (Platform)</span>
                <span className="font-medium">{mockData.totalStaked.toLocaleString()} JitoSOL</span>
              </div>
            </div>
          </div>
          
          <div className="card">
            <h3 className="mb-4 text-lg font-bold">About Jito Restaking</h3>
            <p className="mb-4 text-slate-600 dark:text-slate-300">
              Jito Restaking allows you to earn additional rewards by staking your JitoSOL tokens, contributing to network security while generating passive income.
            </p>
            <div className="rounded-md bg-sky-50 p-4 dark:bg-sky-900/20">
              <h4 className="mb-2 font-medium text-sky-800 dark:text-sky-300">Key Benefits</h4>
              <ul className="space-y-2 text-sm text-sky-700 dark:text-sky-300">
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Earn additional rewards on top of regular staking</span>
                </li>
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Support the Node Consensus Network (NCN)</span>
                </li>
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Choose flexible or locked staking options</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="card">
            <h3 className="mb-4 text-lg font-bold">Recent Rewards</h3>
            {mockData.rewardHistory.length > 0 ? (
              <div className="space-y-3">
                {mockData.rewardHistory.map((reward, index) => (
                  <div key={index} className="flex justify-between border-b border-slate-100 pb-2 last:border-0 dark:border-slate-800">
                    <span className="text-slate-600 dark:text-slate-300">{reward.date}</span>
                    <span className="font-medium text-green-600 dark:text-green-400">+{reward.amount.toFixed(4)} JitoSOL</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 dark:text-slate-400">No rewards history available yet.</p>
            )}
          </div>
        </div>
      </div>
      
      {/* Success Modal */}
      {renderSuccessModal()}
    </div>
  );
} 