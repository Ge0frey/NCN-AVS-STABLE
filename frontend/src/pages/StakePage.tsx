import { useState, useEffect } from 'react';
import { useWalletContext } from '../context/WalletContext';
import api from '../services/api';

interface Vault {
  address: string;
  name: string;
  balance: number;
  delegatedAmount: number;
  apy: number;
  acceptedTokens?: string[];
}

interface Position {
  vaultAddress: string;
  stakedAmount: number;
  rewards: number;
  lockPeriod: number;
  lockExpiry: number | null;
}

export default function StakePage() {
  const { publicKey, connected, isJitoEnabled, setJitoEnabled, stakeToVault, unstakeFromVault } = useWalletContext();
  const [activeTab, setActiveTab] = useState<'jito' | 'regular'>('jito');
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stakeAmount, setStakeAmount] = useState<string>('');
  const [selectedVault, setSelectedVault] = useState<string | null>(null);
  const [lockPeriod, setLockPeriod] = useState<number>(0);
  const [unstakeAmount, setUnstakeAmount] = useState<string>('');
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [jitoConnectionTested, setJitoConnectionTested] = useState<boolean>(false);
  const [jitoConnectionSuccess, setJitoConnectionSuccess] = useState<boolean>(false);

  // Load vaults and positions
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Check if Jito is enabled
        const features = await api.getFeatureFlags();
        
        // First check if need to test connection
        if (!jitoConnectionTested && !jitoConnectionSuccess) {
          await testApiConnection();
        }
        
        // Load vaults even if feature flag is off but connection succeeded
        if (jitoConnectionSuccess || features.jitoRestakingEnabled) {
          // Load vaults
          const vaultsData = await api.getVaults();
          setVaults(vaultsData);
          
          // Load positions if connected
          if (connected && publicKey) {
            const positionsData = await api.getUserPositions(publicKey.toString());
            setPositions(positionsData);
          } else {
            setPositions([]);
          }
        } else {
          setError('Jito Restaking is currently disabled');
        }
      } catch (err) {
        setError('Failed to load staking data');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [connected, publicKey, jitoConnectionTested, jitoConnectionSuccess]);
  
  // Modified staking handler with more error details
  const handleStakeWithDebugging = async () => {
    if (!selectedVault || !stakeAmount) {
      setError('Please select a vault and enter an amount');
      return;
    }
    
    const amount = parseFloat(stakeAmount);
    
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    
    console.log("=== DETAILED STAKE ATTEMPT ===");
    console.log("About to call stakeToVault with params:", {
      vaultAddress: selectedVault,
      amount,
      lockPeriod
    });
    
    try {
      // Try with our mocked approach first
      if (!connected) {
        throw new Error("Wallet not connected - please connect your wallet first");
      }
      
      if (!publicKey) {
        throw new Error("No public key found - wallet connection issue");
      }
      
      const result = await stakeToVault(selectedVault, amount, lockPeriod);
      console.log("Stake result:", result);
      
      setSuccess(`Successfully staked ${amount} SOL. Transaction signature: ${result.signature.slice(0, 8)}...`);
      setStakeAmount('');
      
      // Refresh positions after a successful transaction
      if (publicKey) {
        const positionsData = await api.getUserPositions(publicKey.toString());
        setPositions(positionsData);
      }
    } catch (err) {
      console.error("DETAILED ERROR:", err);
      
      // Get the full error stack
      if (err instanceof Error) {
        console.error("Error stack:", err.stack);
      }
      
      // Set a more detailed error message
      setError('Failed to stake: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle staking
  const handleStake = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log("=== STAKE ATTEMPT ===");
    console.log("Wallet connected:", connected);
    console.log("Public key:", publicKey?.toString());
    console.log("Jito enabled:", isJitoEnabled);
    console.log("Selected vault:", selectedVault);
    console.log("Amount:", stakeAmount);
    console.log("Lock period:", lockPeriod);
    
    if (!connected || !publicKey) {
      setError('Please connect your wallet');
      return;
    }
    
    if (!selectedVault) {
      setError('Please select a vault');
      return;
    }
    
    const amount = parseFloat(stakeAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Use the real blockchain interaction instead of simulation
      const result = await stakeToVault(selectedVault, amount, lockPeriod);
      
      if (result.success) {
        setSuccess(`Successfully staked ${amount} SOL. Transaction signature: ${result.signature.slice(0, 8)}...`);
        setStakeAmount('');
        
        // Refresh positions after a successful transaction
        if (publicKey) {
          const positionsData = await api.getUserPositions(publicKey.toString());
          setPositions(positionsData);
        }
      } else {
        setError('Failed to stake: Transaction failed');
      }
    } catch (err) {
      setError('Failed to stake: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle unstaking
  const handleUnstake = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!connected || !publicKey) {
      setError('Please connect your wallet');
      return;
    }
    
    if (selectedPosition === null) {
      setError('Please select a position');
      return;
    }
    
    const position = positions[selectedPosition];
    const amount = parseFloat(unstakeAmount);
    if (isNaN(amount) || amount <= 0 || amount > position.stakedAmount) {
      setError(`Please enter a valid amount (max: ${position.stakedAmount} SOL)`);
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Use the real blockchain interaction instead of simulation
      const result = await unstakeFromVault(position.vaultAddress, amount);
      
      if (result.success) {
        setSuccess(`Successfully unstaked ${amount} SOL. Transaction signature: ${result.signature.slice(0, 8)}...`);
        setUnstakeAmount('');
        
        // Refresh positions after a successful transaction
        if (publicKey) {
          const positionsData = await api.getUserPositions(publicKey.toString());
          setPositions(positionsData);
        }
      } else {
        setError('Failed to unstake: Transaction failed');
      }
    } catch (err) {
      setError('Failed to unstake: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Updated API connection test that enables the UI on success
  const testApiConnection = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('Testing Jito API connection...');
      
      const result = await api.testJitoConnection();
      console.log('Jito API connection test result:', result);
      
      // Set connection tested flag
      setJitoConnectionTested(true);
      
      if (result.success) {
        // Show detailed success message
        const detailsMessage = result.retried 
          ? ' (after retry)' 
          : '';
        const vaultsMessage = result.vaultsCount 
          ? ` (Found ${result.vaultsCount} vaults)` 
          : '';
          
        setSuccess(`Jito API connection successful${detailsMessage}: ${result.message}${vaultsMessage}`);
        setJitoConnectionSuccess(true);
        
        // Check if backend recommends enabling Jito
        if (result.shouldEnable) {
          console.log('Backend recommends enabling Jito client based on API test');
          // Forcibly enable Jito in the wallet context
          setJitoEnabled(true);
        }
        
        // Load vaults after successful connection
        const vaultsData = await api.getVaults();
        setVaults(vaultsData);
        
        // Load positions if connected
        if (connected && publicKey) {
          const positionsData = await api.getUserPositions(publicKey.toString());
          setPositions(positionsData);
        }
      } else {
        setError(`Jito API connection test failed: ${result.message}`);
        setJitoConnectionSuccess(false);
      }
    } catch (err) {
      console.error('API connection failed:', err);
      setError('API connection failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
      setJitoConnectionSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Check if we should render the Jito UI
  const shouldShowJitoUI = isJitoEnabled || jitoConnectionSuccess;

  // DEBUG component - only visible in development
  const DebugInfo = () => {
    if (process.env.NODE_ENV !== 'development') return null;
    
    return (
      <div className="text-xs bg-black/40 p-2 rounded mt-2 mb-4 text-left max-w-md mx-auto">
        <h4 className="font-bold mb-1 text-yellow-400">Debug Info:</h4>
        <div className="grid grid-cols-2 gap-x-4 text-white/70">
          <div>Wallet connected:</div>
          <div className={connected ? 'text-green-400' : 'text-red-400'}>
            {connected ? 'Yes' : 'No'}
          </div>
          
          <div>Public key:</div>
          <div>{publicKey ? publicKey.toString().slice(0, 8) + '...' : 'None'}</div>
          
          <div>isJitoEnabled:</div>
          <div className={isJitoEnabled ? 'text-green-400' : 'text-red-400'}>
            {isJitoEnabled ? 'Yes' : 'No'}
          </div>
          
          <div>Tested connection:</div>
          <div>{jitoConnectionTested ? 'Yes' : 'No'}</div>
          
          <div>Connection success:</div>
          <div className={jitoConnectionSuccess ? 'text-green-400' : 'text-red-400'}>
            {jitoConnectionSuccess ? 'Yes' : 'No'}
          </div>
          
          <div>Showing UI:</div>
          <div>{shouldShowJitoUI ? 'Yes' : 'No'}</div>
        </div>
        <div className="mt-2">
          <button
            onClick={() => setJitoEnabled(!isJitoEnabled)}
            className="text-xs px-2 py-1 bg-yellow-600 hover:bg-yellow-500 rounded"
          >
            Toggle Jito Enabled
          </button>
        </div>
      </div>
    );
  };

  if (!shouldShowJitoUI) {
    return (
      <div className="mt-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Jito Restaking</h2>
        <p className="text-slate-400 mb-4">Jito Restaking is currently disabled.</p>
        
        {/* Add a button to test the API connection */}
        <button 
          onClick={testApiConnection}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-colors shadow-md shadow-blue-900/20"
          disabled={isLoading}
        >
          {isLoading ? 'Testing...' : 'Test API Connection'}
        </button>
        
        {error && <p className="text-red-500 mt-2">{error}</p>}
        {success && <p className="text-green-500 mt-2">{success}</p>}
        
        <DebugInfo />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="text-center mb-12 relative">
        <div className="absolute inset-0 flex justify-center items-center pointer-events-none opacity-30 -mt-16">
          <div className="w-64 h-64 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20 rounded-full blur-3xl"></div>
        </div>
        <div className="relative">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 text-transparent bg-clip-text inline-block mb-3">
            Jito Restaking
          </h1>
          <div className="w-20 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto mb-4"></div>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Earn higher yields by staking your SOL in Jito vaults. Choose from various vaults with different risk profiles and lock periods to maximize your returns.
          </p>
        </div>
        
        {/* Add a small success indicator for API connection */}
        {jitoConnectionSuccess && (
          <div className="mt-3 text-sm text-green-400 flex items-center justify-center animate-fadeIn">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Connected to Jito Restaking Service
            
            {/* Add a retry button for retesting */}
            <button 
              onClick={testApiConnection}
              className="ml-2 px-1.5 py-0.5 text-xs bg-green-800/40 hover:bg-green-700/50 rounded transition-colors"
              disabled={isLoading}
              title="Retest connection"
            >
              {isLoading ? 'Testing...' : 'Retest'}
            </button>
          </div>
        )}
        
        {/* Add debug info in development */}
        <DebugInfo />
      </div>
      
      {/* Error and Success Messages */}
      {error && (
        <div className="mb-6 rounded-xl bg-red-900/20 backdrop-blur-sm border border-red-700/50 p-4 flex items-center text-red-400 mx-auto max-w-3xl shadow-lg animate-fadeIn">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 mr-2 flex-shrink-0">
            <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-6 rounded-xl bg-green-900/20 backdrop-blur-sm border border-green-700/50 p-4 flex items-center text-green-400 mx-auto max-w-3xl shadow-lg animate-fadeIn">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 mr-2 flex-shrink-0">
            <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
          </svg>
          {success}
        </div>
      )}
      
      {/* Tabs */}
      <div className="flex justify-center border-b border-slate-800 mb-8 max-w-3xl mx-auto">
        <button
          className={`px-6 py-3 font-medium text-lg transition-all relative ${
            activeTab === 'jito'
              ? 'text-blue-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          onClick={() => setActiveTab('jito')}
        >
          Jito Restaking
          {activeTab === 'jito' && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-blue-400 to-purple-400"></span>
          )}
        </button>
        <button
          className={`px-6 py-3 font-medium text-lg transition-all relative ${
            activeTab === 'regular'
              ? 'text-blue-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          onClick={() => setActiveTab('regular')}
        >
          Regular Staking
          {activeTab === 'regular' && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-blue-400 to-purple-400"></span>
          )}
        </button>
      </div>
      
      {/* Loading State */}
      {isLoading ? (
        <div className="flex flex-col justify-center items-center h-72">
          <div className="relative w-16 h-16 mb-6">
            <div className="absolute inset-0 rounded-full border-t-2 border-b-2 border-blue-500 animate-spin"></div>
            <div className="absolute inset-2 rounded-full border-r-2 border-l-2 border-purple-500 animate-spin animate-delay-150"></div>
            <div className="absolute inset-4 rounded-full border-t-2 border-b-2 border-pink-500 animate-spin animate-delay-300"></div>
          </div>
          <h3 className="text-xl font-medium text-slate-300 mb-2">Loading Vaults</h3>
          <p className="text-slate-400 text-center max-w-sm">
            We're retrieving the latest data from Jito vaults. This should only take a moment...
          </p>
        </div>
      ) : (
        activeTab === 'jito' ? (
          <div>
            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
              {/* Left Column - Staking Form */}
              <div className="lg:col-span-1 order-2 lg:order-1">
                {/* Staking Form */}
                <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 p-1 rounded-xl shadow-lg mb-8">
                  <div className="bg-slate-900 rounded-lg p-6">
                    <h2 className="text-xl font-bold mb-6 text-center bg-gradient-to-r from-blue-400 to-purple-400 text-transparent bg-clip-text">
                      Stake Your Tokens
                    </h2>
                    
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        handleStakeWithDebugging();
                      }}>
                      <div className="mb-5">
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Selected Vault
                        </label>
                        <select
                          className="select w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          value={selectedVault || ''}
                          onChange={(e) => setSelectedVault(e.target.value)}
                          required
                        >
                          <option value="">Select a vault</option>
                          {vaults.map((vault) => (
                            <option key={vault.address} value={vault.address}>
                              {vault.name} - {vault.apy.toFixed(2)}% APY
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="mb-5">
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Amount to Stake (SOL)
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            className="input w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="0.0"
                            value={stakeAmount}
                            onChange={(e) => setStakeAmount(e.target.value)}
                            min="0.1"
                            step="0.1"
                            required
                            id="stake-amount"
                          />
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 font-medium">
                            SOL
                          </div>
                        </div>
                      </div>
                      
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Lock Period (days)
                        </label>
                        <div className="grid grid-cols-3 gap-4">
                          <button
                            type="button"
                            className={`px-4 py-2 rounded-lg text-center transition-all ${
                              lockPeriod === 0
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            }`}
                            onClick={() => setLockPeriod(0)}
                          >
                            <div className="font-medium">No Lock</div>
                            <div className="text-xs opacity-75">Flexible</div>
                          </button>
                          <button
                            type="button"
                            className={`px-4 py-2 rounded-lg text-center transition-all ${
                              lockPeriod === 30
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            }`}
                            onClick={() => setLockPeriod(30)}
                          >
                            <div className="font-medium">30 Days</div>
                            <div className="text-xs opacity-75">Higher APY</div>
                          </button>
                          <button
                            type="button"
                            className={`px-4 py-2 rounded-lg text-center transition-all ${
                              lockPeriod === 90
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            }`}
                            onClick={() => setLockPeriod(90)}
                          >
                            <div className="font-medium">90 Days</div>
                            <div className="text-xs opacity-75">Max Rewards</div>
                          </button>
                        </div>
                      </div>
                      
                      <button
                        type="submit"
                        className="btn btn-primary w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg text-white font-medium shadow-lg hover:from-blue-600 hover:to-purple-600 transition-all"
                        disabled={isSubmitting || !connected}
                      >
                        {isSubmitting ? (
                          <span className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Staking...
                          </span>
                        ) : (
                          'Stake Now'
                        )}
                      </button>
                      
                      {!connected && (
                        <p className="text-center text-sm text-slate-400 mt-3">
                          Connect your wallet to stake tokens
                        </p>
                      )}
                    </form>
                  </div>
                </div>
              </div>
              
              {/* Right Column - Vaults */}
              <div className="lg:col-span-2 order-1 lg:order-2">
                <h2 className="text-xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 text-transparent bg-clip-text">
                  Available Vaults
                </h2>
                
                {vaults.length === 0 ? (
                  <p className="text-slate-400">No vaults available</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {vaults.map((vault) => (
                      <div 
                        key={vault.address} 
                        className={`rounded-xl p-1 transition-all transform hover:scale-[1.02] ${
                          selectedVault === vault.address 
                            ? 'bg-gradient-to-r from-blue-500 to-purple-500 shadow-lg shadow-blue-900/20' 
                            : 'bg-gradient-to-r from-slate-700/40 to-slate-800/40 hover:from-blue-800/20 hover:to-purple-800/20'
                        }`}
                      >
                        <div className="bg-slate-900 rounded-lg p-5 h-full">
                          <div className="flex justify-between items-center mb-3">
                            <h3 className="font-bold text-lg">{vault.name}</h3>
                            <div className="flex items-center bg-green-900/20 rounded-full px-3 py-1">
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-green-400 mr-1">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                              </svg>
                              <span className="text-green-400 font-semibold">{vault.apy.toFixed(2)}% APY</span>
                            </div>
                          </div>
                          
                          <div className="mb-4">
                            <div className="flex justify-between text-sm text-slate-400 mb-1">
                              <span>Total Balance</span>
                              <span className="text-white font-medium">{vault.balance.toLocaleString()} SOL</span>
                            </div>
                            <div className="flex justify-between text-sm text-slate-400">
                              <span>Delegated</span>
                              <span className="text-white font-medium">{vault.delegatedAmount.toLocaleString()} SOL</span>
                            </div>
                            
                            {vault.acceptedTokens && vault.acceptedTokens.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-slate-800 flex flex-wrap gap-1">
                                <span className="text-sm text-slate-400 mr-1">Accepts:</span>
                                {vault.acceptedTokens.map(token => (
                                  <span key={token} className="inline-block px-2 py-0.5 bg-blue-900/20 rounded-md text-xs text-blue-300 font-medium">
                                    {token}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          
                          <button
                            className={`w-full py-2.5 px-4 rounded-lg transition-colors ${
                              selectedVault === vault.address
                                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium shadow-md'
                                : 'bg-blue-600/20 hover:bg-blue-500/30 text-blue-300 hover:text-blue-200'
                            }`}
                            onClick={() => {
                              setSelectedVault(vault.address);
                              document.getElementById('stake-amount')?.focus();
                            }}
                          >
                            {selectedVault === vault.address ? 'Selected' : 'Select Vault'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* User Positions Section */}
            {connected && positions.length > 0 && (
              <div className="mb-12">
                <h2 className="text-xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 text-transparent bg-clip-text">
                  Your Active Positions
                </h2>
                
                <div className="space-y-6">
                  {positions.map((position, index) => {
                    const vault = vaults.find(v => v.address === position.vaultAddress);
                    
                    return (
                      <div key={index} className="bg-gradient-to-r from-blue-900/10 to-purple-900/10 p-1 rounded-xl shadow-lg">
                        <div className="bg-slate-900 rounded-lg p-6">
                          <div className="flex flex-col md:flex-row justify-between mb-5">
                            <div className="flex-1">
                              <div className="flex items-center">
                                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                <h3 className="font-bold text-lg">{vault?.name || 'Unknown Vault'}</h3>
                              </div>
                              
                              <div className="mt-2 flex flex-wrap gap-3">
                                <div className="flex items-center text-slate-300 text-sm bg-slate-800/50 px-3 py-1.5 rounded-lg">
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1.5 text-blue-400">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span>
                                    {position.lockPeriod > 0 
                                      ? `${position.lockPeriod} day lock` 
                                      : 'Flexible (no lock)'}
                                  </span>
                                </div>
                                
                                {position.lockExpiry && (
                                  <div className="flex items-center text-slate-300 text-sm bg-slate-800/50 px-3 py-1.5 rounded-lg">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1.5 text-purple-400">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                                    </svg>
                                    <span>
                                      Expires {new Date(position.lockExpiry).toLocaleDateString()}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="mt-4 md:mt-0 p-3 bg-gradient-to-r from-green-900/20 to-green-800/10 rounded-lg text-right">
                              <div className="flex flex-col">
                                <span className="text-xs text-green-300/70 mb-1">Total Value</span>
                                <div className="text-green-400 font-bold text-xl">
                                  {position.stakedAmount.toFixed(4)} SOL
                                </div>
                              </div>
                              <div className="flex items-center justify-end text-sm text-green-500 mt-1">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 mr-1">
                                  <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm3.53 10.28a.75.75 0 00-.186.186L12 17.273l-3.344-4.556a.75.75 0 00-1.212.88l3.75 5.25a.75.75 0 001.212 0l3.75-5.25a.75.75 0 00-.186-1.044z" clipRule="evenodd" />
                                </svg>
                                + {position.rewards.toFixed(4)} SOL rewards
                              </div>
                            </div>
                          </div>
                          
                          <div className="border-t border-slate-800 pt-5 mt-4">
                            <form className="flex gap-4 flex-col sm:flex-row" onSubmit={handleUnstake}>
                              <div className="relative flex-grow">
                                <label className="block text-sm font-medium text-slate-400 mb-1.5">
                                  Amount to unstake
                                </label>
                                <div className="relative">
                                  <input
                                    type="number"
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                                    placeholder={`Max: ${position.stakedAmount} SOL`}
                                    value={selectedPosition === index ? unstakeAmount : ''}
                                    onChange={(e) => {
                                      setSelectedPosition(index);
                                      setUnstakeAmount(e.target.value);
                                    }}
                                    min="0.001"
                                    max={position.stakedAmount}
                                    step="0.001"
                                    required
                                  />
                                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 font-medium">
                                    SOL
                                  </div>
                                </div>
                              </div>
                              <div className="sm:self-end">
                                <button
                                  type="submit"
                                  className="w-full sm:w-auto py-3 px-6 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg text-white font-medium shadow-lg hover:from-orange-600 hover:to-red-600 transition-all whitespace-nowrap disabled:opacity-70 flex items-center justify-center"
                                  disabled={isSubmitting || selectedPosition !== index}
                                >
                                  {isSubmitting && selectedPosition === index ? (
                                    <span className="flex items-center">
                                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                      </svg>
                                      Unstaking...
                                    </span>
                                  ) : (
                                    <>
                                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-1.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                                      </svg>
                                      Unstake
                                    </>
                                  )}
                                </button>
                              </div>
                            </form>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-16 max-w-md mx-auto">
            <div className="bg-gradient-to-b from-slate-800/80 to-slate-900/90 p-1 rounded-2xl shadow-xl">
              <div className="bg-slate-900/80 backdrop-blur-sm rounded-xl p-8 border border-slate-700/30">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold mb-3 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 text-transparent bg-clip-text inline-block">
                  Regular Staking Coming Soon
                </h2>
                <p className="text-slate-400 mb-6 leading-relaxed">
                  Traditional SOL staking features will be available in a future update. 
                  Stay tuned for announcements and exciting new staking opportunities!
                </p>
                <button
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl text-white font-medium shadow-lg hover:from-blue-600 hover:to-purple-600 transition-all flex items-center justify-center mx-auto"
                  onClick={() => setActiveTab('jito')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  Try Jito Restaking
                </button>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
} 