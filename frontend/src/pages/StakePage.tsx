import { useState, useEffect } from 'react';
import { useWalletContext } from '../context/WalletContext';
import api from '../services/api';

interface Vault {
  address: string;
  name: string;
  balance: number;
  delegatedAmount: number;
  apy: number;
}

interface Position {
  vaultAddress: string;
  stakedAmount: number;
  rewards: number;
  lockPeriod: number;
  lockExpiry: number | null;
}

export default function StakePage() {
  const { publicKey, connected, isJitoEnabled } = useWalletContext();
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

  // Load vaults and positions
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Check if Jito is enabled
        const features = await api.getFeatureFlags();
        
        if (!features.jitoRestakingEnabled) {
          setError('Jito Restaking is currently disabled');
          setIsLoading(false);
          return;
        }
        
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
      } catch (err) {
        setError('Failed to load staking data');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [connected, publicKey]);
  
  // Handle staking
  const handleStake = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
      await api.stakeToVault(
        publicKey.toString(),
        selectedVault,
        amount,
        lockPeriod
      );
      
      setSuccess(`Successfully staked ${amount} SOL`);
      setStakeAmount('');
      
      // Refresh positions
      const positionsData = await api.getUserPositions(publicKey.toString());
      setPositions(positionsData);
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
      await api.unstakeFromVault(
        publicKey.toString(),
        position.vaultAddress,
        amount
      );
      
      setSuccess(`Successfully unstaked ${amount} SOL`);
      setUnstakeAmount('');
      
      // Refresh positions
      const positionsData = await api.getUserPositions(publicKey.toString());
      setPositions(positionsData);
    } catch (err) {
      setError('Failed to unstake: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isJitoEnabled) {
    return (
      <div className="mt-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Jito Restaking</h2>
        <p className="text-slate-400">Jito Restaking is currently disabled.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 gradient-text">Jito Restaking</h1>
      
      {/* Tabs */}
      <div className="flex border-b border-slate-700 mb-6">
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === 'jito'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          onClick={() => setActiveTab('jito')}
        >
          Jito Restaking
        </button>
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === 'regular'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          onClick={() => setActiveTab('regular')}
        >
          Regular Staking
        </button>
      </div>
      
      {/* Error and Success Messages */}
      {error && (
        <div className="mb-6 rounded-md bg-red-900/20 border border-red-700 p-4 text-red-400">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-6 rounded-md bg-green-900/20 border border-green-700 p-4 text-green-400">
          {success}
        </div>
      )}
      
      {/* Loading State */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        activeTab === 'jito' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Staking Form */}
            <div className="glass-panel p-6 col-span-1">
              <h2 className="text-xl font-bold mb-4">Stake Tokens</h2>
              
              <form onSubmit={handleStake}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Select Vault
                  </label>
                  <select
                    className="select w-full"
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
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Amount to Stake (SOL)
                  </label>
                  <input
                    type="number"
                    className="input w-full"
                    placeholder="0.0"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                    min="0.1"
                    step="0.1"
                    required
                    id="stake-amount"
                  />
                </div>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Lock Period (days)
                  </label>
                  <select
                    className="select w-full"
                    value={lockPeriod}
                    onChange={(e) => setLockPeriod(parseInt(e.target.value))}
                  >
                    <option value="0">No lock (flexible)</option>
                    <option value="30">30 days (higher rewards)</option>
                    <option value="90">90 days (maximum rewards)</option>
                  </select>
                </div>
                
                <button
                  type="submit"
                  className="btn btn-primary w-full"
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
                    'Stake'
                  )}
                </button>
              </form>
            </div>
            
            {/* Vault Information */}
            <div className="glass-panel p-6 col-span-1 lg:col-span-2">
              <h2 className="text-xl font-bold mb-4">Available Vaults</h2>
              
              {vaults.length === 0 ? (
                <p className="text-slate-400">No vaults available</p>
              ) : (
                <div className="space-y-4">
                  {vaults.map((vault) => (
                    <div key={vault.address} className="gradient-border p-4 rounded-lg bg-slate-800/50">
                      <div className="flex justify-between mb-2">
                        <h3 className="font-bold">{vault.name}</h3>
                        <span className="text-green-400">{vault.apy.toFixed(2)}% APY</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm text-slate-300">
                        <div>Total Balance: {vault.balance.toLocaleString()} SOL</div>
                        <div>Delegated: {vault.delegatedAmount.toLocaleString()} SOL</div>
                      </div>
                      <button
                        className="btn btn-secondary mt-3 w-full"
                        onClick={() => {
                          setSelectedVault(vault.address);
                          document.getElementById('stake-amount')?.focus();
                        }}
                      >
                        Select Vault
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* User Positions */}
            {connected && positions.length > 0 && (
              <div className="glass-panel p-6 col-span-1 lg:col-span-3">
                <h2 className="text-xl font-bold mb-4">Your Positions</h2>
                
                <div className="space-y-4">
                  {positions.map((position, index) => {
                    const vault = vaults.find(v => v.address === position.vaultAddress);
                    
                    return (
                      <div key={index} className="gradient-border p-4 rounded-lg bg-slate-800/50">
                        <div className="flex justify-between mb-2">
                          <h3 className="font-bold">{vault?.name || 'Unknown Vault'}</h3>
                          <span className="text-green-400">
                            {position.rewards.toFixed(4)} SOL Rewards
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-sm text-slate-300 mb-3">
                          <div>Staked Amount: {position.stakedAmount.toFixed(4)} SOL</div>
                          <div>
                            Lock Period: {position.lockPeriod > 0 
                              ? `${position.lockPeriod} days` 
                              : 'No lock'}
                          </div>
                          {position.lockExpiry && (
                            <div>
                              Lock Expires: {new Date(position.lockExpiry).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                        
                        <form className="flex gap-2" onSubmit={handleUnstake}>
                          <input
                            type="number"
                            className="input flex-1"
                            placeholder={`Amount (max: ${position.stakedAmount} SOL)`}
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
                          <button
                            type="submit"
                            className="btn btn-primary whitespace-nowrap"
                            disabled={isSubmitting || selectedPosition !== index}
                          >
                            {isSubmitting && selectedPosition === index ? 'Unstaking...' : 'Unstake'}
                          </button>
                        </form>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <h2 className="text-xl mb-4">Regular Staking Coming Soon</h2>
            <p className="text-slate-400">
              Traditional SOL staking features will be available in a future update.
            </p>
          </div>
        )
      )}
    </div>
  );
} 