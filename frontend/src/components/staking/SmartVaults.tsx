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
    <div className="w-full max-w-4xl mx-auto p-6 bg-gray-900 rounded-xl shadow-lg">
      <h2 className="text-3xl font-bold text-white mb-6">Smart Vaults</h2>
      <p className="text-gray-300 mb-8">
        Maximize your collateral's earning potential with automated yield strategies while maintaining the security of your stablecoin positions.
      </p>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-800 p-6 rounded-lg col-span-2">
          <h3 className="text-xl font-semibold text-white mb-4">Strategy Allocation</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value}%`} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-gray-400">
                  No allocations set
                </div>
              )}
            </div>
            
            <div className="lg:col-span-2">
              <div className="space-y-4">
                {STRATEGY_OPTIONS.map(strategy => (
                  <div 
                    key={strategy.id} 
                    className="bg-gray-700 rounded-lg p-4 cursor-pointer"
                    onClick={() => toggleStrategy(strategy.id)}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: strategy.color }}></div>
                        <span className="font-medium text-white">{strategy.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={allocations.find(a => a.id === strategy.id)?.percentage || 0}
                          onChange={(e) => handleAllocationChange(strategy.id, parseInt(e.target.value) || 0)}
                          className="w-16 bg-gray-600 text-white rounded px-2 py-1 text-center"
                        />
                        <span className="text-gray-300">%</span>
                      </div>
                    </div>
                    
                    {expandedStrategy === strategy.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="mt-3 pt-3 border-t border-gray-600"
                      >
                        <div className="text-gray-300 text-sm">{strategy.description}</div>
                        <div className="mt-2 flex justify-between">
                          <div>
                            <span className="text-gray-400 text-xs">Expected APY:</span>
                            <span className="text-green-400 ml-1">{strategy.apy}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 text-xs">Risk Level:</span>
                            <span className="text-yellow-400 ml-1">{strategy.risk}</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="mt-4 flex justify-between items-center">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="autoCompound"
                    checked={isAutoCompound}
                    onChange={() => setIsAutoCompound(!isAutoCompound)}
                    className="mr-2"
                  />
                  <label htmlFor="autoCompound" className="text-gray-300">Auto-compound yields</label>
                </div>
                
                <button
                  onClick={handleUpdateAllocations}
                  disabled={isLoading || totalAllocation !== 100}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition"
                >
                  {isLoading ? 'Updating...' : 'Update Allocation'}
                </button>
              </div>
              
              {totalAllocation !== 100 && (
                <p className="text-red-400 text-sm mt-2">
                  Total allocation must be 100% (current: {totalAllocation}%)
                </p>
              )}
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-xl font-semibold text-white mb-4">Vault Summary</h3>
          
          <div className="space-y-4">
            <div>
              <p className="text-gray-400 text-sm">Total Deposited</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(totalDeposited)} SOL</p>
            </div>
            
            <div>
              <p className="text-gray-400 text-sm">Projected Annual Yield</p>
              <p className="text-2xl font-bold text-green-400">
                {formatCurrency(projectedYield)} SOL
                <span className="text-sm text-gray-400 ml-2">
                  ({((projectedYield / totalDeposited) * 100).toFixed(2)}%)
                </span>
              </p>
            </div>
            
            <div className="pt-4 border-t border-gray-700">
              <div className="flex flex-col space-y-2 mb-4">
                <label className="text-gray-300 text-sm">Deposit SOL</label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="0.00"
                    className="flex-1 bg-gray-700 text-white rounded px-3 py-2"
                  />
                  <button
                    onClick={handleDeposit}
                    disabled={isLoading || !depositAmount}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition"
                  >
                    {isLoading ? 'Processing...' : 'Deposit'}
                  </button>
                </div>
              </div>
              
              <div className="flex flex-col space-y-2">
                <label className="text-gray-300 text-sm">Withdraw SOL</label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    min="0"
                    max={totalDeposited}
                    step="0.01"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="0.00"
                    className="flex-1 bg-gray-700 text-white rounded px-3 py-2"
                  />
                  <button
                    onClick={handleWithdraw}
                    disabled={isLoading || !withdrawAmount}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition"
                  >
                    {isLoading ? 'Processing...' : 'Withdraw'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-blue-900/30 p-6 rounded-lg border border-blue-800">
        <h3 className="text-xl font-semibold text-white mb-2">How Smart Vaults Work</h3>
        <p className="text-gray-300 mb-4">
          Smart Vaults automatically deploy your idle collateral into various yield-generating strategies while ensuring it remains available to secure your stablecoin positions.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-800/60 p-4 rounded-lg">
            <h4 className="text-blue-400 font-medium mb-2">1. Deposit Collateral</h4>
            <p className="text-gray-400 text-sm">
              Deposit your assets into Smart Vaults to start earning yield while maintaining your collateral position.
            </p>
          </div>
          
          <div className="bg-gray-800/60 p-4 rounded-lg">
            <h4 className="text-blue-400 font-medium mb-2">2. Customize Strategies</h4>
            <p className="text-gray-400 text-sm">
              Allocate your assets across multiple yield strategies based on your risk tolerance and reward expectations.
            </p>
          </div>
          
          <div className="bg-gray-800/60 p-4 rounded-lg">
            <h4 className="text-blue-400 font-medium mb-2">3. Maximize Returns</h4>
            <p className="text-gray-400 text-sm">
              Earn yield on your collateral while it secures your stablecoin positions, improving capital efficiency.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartVaults;