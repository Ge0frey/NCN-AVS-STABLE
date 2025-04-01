import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { toast } from 'react-hot-toast';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

// Mock data for strategy options
const STRATEGY_OPTIONS = [
  { id: 1, name: 'Low Risk', description: 'Staking in validator pool', apy: '4-6%', risk: 'Low', color: '#38bdf8' },
  { id: 2, name: 'Medium Risk', description: 'Lending on Solend', apy: '8-12%', risk: 'Medium', color: '#818cf8' },
  { id: 3, name: 'Growth', description: 'Automated DeFi strategies', apy: '15-20%', risk: 'Medium-High', color: '#c084fc' },
  { id: 4, name: 'High Yield', description: 'Leveraged yield farming', apy: '20-30%', risk: 'High', color: '#fb7185' },
];

// Mock user allocation data
const initialAllocations = [
  { id: 1, percentage: 50 },
  { id: 2, percentage: 30 },
  { id: 3, percentage: 20 },
  { id: 4, percentage: 0 },
];

const SmartVaults: React.FC = () => {
  const { connected, publicKey } = useWallet();
  const [allocations, setAllocations] = useState(initialAllocations);
  const [totalDeposited, setTotalDeposited] = useState(2.45); // SOL
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isAutoCompound, setIsAutoCompound] = useState(true);
  const [expandedStrategy, setExpandedStrategy] = useState<number | null>(null);
  const [projectedYield, setProjectedYield] = useState(0.32); // SOL
  const [isLoading, setIsLoading] = useState(false);
  
  // Calculate total allocation to ensure it's 100%
  const totalAllocation = allocations.reduce((sum, item) => sum + item.percentage, 0);
  
  // Format for pie chart
  const chartData = allocations
    .filter(item => item.percentage > 0)
    .map(item => {
      const strategy = STRATEGY_OPTIONS.find(s => s.id === item.id);
      return {
        name: strategy?.name,
        value: item.percentage,
        color: strategy?.color,
      };
    });
  
  // Handle allocation change
  const handleAllocationChange = (id: number, value: number) => {
    // Ensure value is a number between 0 and 100
    const newValue = Math.max(0, Math.min(100, value));
    
    // Create new allocations
    const newAllocations = allocations.map(item => 
      item.id === id ? { ...item, percentage: newValue } : item
    );
    
    // Calculate how much we need to adjust other allocations
    const newTotal = newAllocations.reduce((sum, item) => sum + item.percentage, 0);
    
    if (newTotal !== 100) {
      // Distribute the difference proportionally among other allocations
      const remaining = 100 - newValue;
      const otherAllocations = newAllocations.filter(item => item.id !== id);
      const otherTotal = otherAllocations.reduce((sum, item) => sum + item.percentage, 0);
      
      if (otherTotal > 0) {
        newAllocations.forEach(item => {
          if (item.id !== id) {
            item.percentage = Math.round((item.percentage / otherTotal) * remaining);
          }
        });
        
        // Handle rounding errors
        const finalTotal = newAllocations.reduce((sum, item) => sum + item.percentage, 0);
        if (finalTotal !== 100) {
          const diff = 100 - finalTotal;
          // Add the difference to the first non-zero allocation
          for (const item of newAllocations) {
            if (item.id !== id && item.percentage > 0) {
              item.percentage += diff;
              break;
            }
          }
        }
      } else {
        // If all other allocations are 0, allocate the remaining to the first item
        const firstOther = newAllocations.find(item => item.id !== id);
        if (firstOther) {
          firstOther.percentage = remaining;
        }
      }
    }
    
    setAllocations(newAllocations);
    
    // Recalculate projected yield based on new allocations
    calculateProjectedYield(newAllocations);
  };
  
  // Calculate projected yield based on allocations
  const calculateProjectedYield = (currentAllocations = allocations) => {
    let yield_ = 0;
    
    currentAllocations.forEach(alloc => {
      const strategy = STRATEGY_OPTIONS.find(s => s.id === alloc.id);
      if (strategy) {
        // Extract APY as average of range
        const apyString = strategy.apy;
        const apyRange = apyString.match(/(\d+)-(\d+)%/);
        
        if (apyRange && apyRange.length === 3) {
          const avgApy = (parseInt(apyRange[1]) + parseInt(apyRange[2])) / 2 / 100;
          yield_ += totalDeposited * (alloc.percentage / 100) * avgApy;
        }
      }
    });
    
    setProjectedYield(parseFloat(yield_.toFixed(2)));
  };
  
  // Handle deposit
  const handleDeposit = async () => {
    if (!connected || !publicKey) {
      toast.error('Please connect your wallet');
      return;
    }
    
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Mock API call - would integrate with Anchor in real implementation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const amount = parseFloat(depositAmount);
      setTotalDeposited(prev => prev + amount);
      calculateProjectedYield();
      setDepositAmount('');
      
      toast.success(`Successfully deposited ${amount} SOL into your Smart Vault`);
    } catch (error) {
      console.error('Deposit error:', error);
      toast.error('Failed to deposit. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle withdrawal
  const handleWithdraw = async () => {
    if (!connected || !publicKey) {
      toast.error('Please connect your wallet');
      return;
    }
    
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    const amount = parseFloat(withdrawAmount);
    
    if (amount > totalDeposited) {
      toast.error('Insufficient funds in your Smart Vault');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Mock API call - would integrate with Anchor in real implementation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setTotalDeposited(prev => prev - amount);
      calculateProjectedYield();
      setWithdrawAmount('');
      
      toast.success(`Successfully withdrew ${amount} SOL from your Smart Vault`);
    } catch (error) {
      console.error('Withdrawal error:', error);
      toast.error('Failed to withdraw. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle allocation update
  const handleUpdateAllocations = async () => {
    if (!connected || !publicKey) {
      toast.error('Please connect your wallet');
      return;
    }
    
    if (totalAllocation !== 100) {
      toast.error('Total allocation must be 100%');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Mock API call - would integrate with Anchor in real implementation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      calculateProjectedYield();
      
      toast.success('Strategy allocations updated successfully');
    } catch (error) {
      console.error('Update allocation error:', error);
      toast.error('Failed to update allocations. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Toggle strategy details
  const toggleStrategy = (id: number) => {
    setExpandedStrategy(expandedStrategy === id ? null : id);
  };
  
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };
  
  useEffect(() => {
    calculateProjectedYield();
  }, [totalDeposited]);
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="glass-panel rounded-xl p-6 mb-6">
        <h2 className="text-3xl font-bold text-white mb-4">Smart Vaults</h2>
        <p className="text-slate-300 mb-6">
          Maximize your collateral's earning potential with automated yield strategies while maintaining the security of your stablecoin positions.
        </p>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="glass-card rounded-lg col-span-2 p-6">
            <h3 className="text-xl font-semibold text-blue-400 mb-4">Strategy Allocation</h3>
            
            {/* Pie chart and allocation sliders */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                {chartData.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number) => [`${value}%`, 'Allocation']}
                          contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#e2e8f0' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center">
                    <p className="text-gray-400">No allocations set</p>
                  </div>
                )}
              </div>
              
              <div>
                <div className="space-y-4">
                  {STRATEGY_OPTIONS.map((strategy) => {
                    const allocation = allocations.find(a => a.id === strategy.id) || { percentage: 0 };
                    return (
                      <div key={strategy.id} className="space-y-1">
                        <div className="flex justify-between">
                          <label className="text-slate-300 flex items-center">
                            <span className="h-3 w-3 inline-block mr-2 rounded-full" style={{ backgroundColor: strategy.color }}></span>
                            {strategy.name}
                          </label>
                          <span className="text-slate-300">{allocation.percentage}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={allocation.percentage}
                          onChange={(e) => handleAllocationChange(strategy.id, parseInt(e.target.value))}
                          className="w-full accent-blue-500"
                        />
                        <div className="flex justify-between text-xs text-slate-400">
                          <span>APY: {strategy.apy}</span>
                          <span>Risk: {strategy.risk}</span>
                        </div>
                      </div>
                    );
                  })}
                  
                  {totalAllocation !== 100 && (
                    <div className="text-amber-400 text-sm mt-2">
                      Total allocation: {totalAllocation}% (must equal 100%)
                    </div>
                  )}
                  
                  <button
                    onClick={handleUpdateAllocations}
                    disabled={isLoading || !connected || totalAllocation !== 100}
                    className="w-full px-4 py-2 mt-2 gradient-button rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Updating...' : 'Update Allocation'}
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="glass-card rounded-lg p-6">
            <h3 className="text-xl font-semibold text-blue-400 mb-4">Smart Vault Overview</h3>
            
            <div className="space-y-6">
              <div>
                <p className="text-slate-400 text-sm">Total Deposited</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(totalDeposited)} SOL</p>
              </div>
              
              <div>
                <p className="text-slate-400 text-sm">Projected Annual Yield</p>
                <p className="text-2xl font-bold text-green-400">{formatCurrency(projectedYield)} SOL</p>
                <p className="text-xs text-slate-400">Based on current allocations</p>
              </div>
              
              <div className="border-t border-slate-700 pt-4">
                <div className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    id="autoCompound"
                    checked={isAutoCompound}
                    onChange={(e) => setIsAutoCompound(e.target.checked)}
                    className="mr-2 accent-blue-500"
                  />
                  <label htmlFor="autoCompound" className="text-slate-300 text-sm font-medium">Auto-compound Rewards</label>
                </div>
                <p className="text-xs text-slate-400">Automatically reinvest your yield to maximize returns</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="glass-card rounded-lg p-6">
            <h3 className="text-xl font-semibold text-blue-400 mb-4">Deposit</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-slate-300 mb-2">Amount (SOL)</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-slate-800/70 text-white rounded px-3 py-2 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-blue-400 bg-blue-500/20 px-2 py-1 rounded">MAX</button>
                </div>
              </div>
              
              <button
                onClick={handleDeposit}
                disabled={isLoading || !depositAmount || !connected}
                className="w-full px-4 py-2 gradient-button rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Processing...' : 'Deposit'}
              </button>
            </div>
          </div>
          
          <div className="glass-card rounded-lg p-6">
            <h3 className="text-xl font-semibold text-blue-400 mb-4">Withdraw</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-slate-300 mb-2">Amount (SOL)</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    max={totalDeposited}
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-slate-800/70 text-white rounded px-3 py-2 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-blue-400 bg-blue-500/20 px-2 py-1 rounded">MAX</button>
                </div>
              </div>
              
              <button
                onClick={handleWithdraw}
                disabled={isLoading || !withdrawAmount || !connected || parseFloat(withdrawAmount) > totalDeposited}
                className="w-full px-4 py-2 gradient-button rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Processing...' : 'Withdraw'}
              </button>
            </div>
          </div>
        </div>
        
        <div className="glass-card rounded-lg p-6">
          <h3 className="text-xl font-semibold text-blue-400 mb-4">Strategy Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {STRATEGY_OPTIONS.map((strategy) => (
              <div
                key={strategy.id}
                className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden transition-transform cursor-pointer hover:scale-102 hover:shadow-glow"
                onClick={() => toggleStrategy(strategy.id)}
              >
                <div className="h-2" style={{ backgroundColor: strategy.color }}></div>
                <div className="p-4">
                  <h4 className="text-white font-medium mb-1">{strategy.name}</h4>
                  <p className="text-slate-400 text-sm mb-2">{strategy.description}</p>
                  <div className="flex justify-between text-xs">
                    <span className="text-green-400">APY: {strategy.apy}</span>
                    <span className="text-slate-300">Risk: {strategy.risk}</span>
                  </div>
                  
                  {expandedStrategy === strategy.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 pt-3 border-t border-slate-700 text-xs text-slate-300"
                    >
                      <p>Strategy details and explanation would go here. This would include how the strategy works, what protocols it interacts with, and any potential risks.</p>
                    </motion.div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartVaults;