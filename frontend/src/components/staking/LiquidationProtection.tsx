import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { toast } from 'react-hot-toast';

const LiquidationProtection: React.FC = () => {
  const { connected, publicKey } = useWallet();
  const [totalDeposited, setTotalDeposited] = useState(0);
  const [protectionAmount, setProtectionAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState('30');
  const [protectionActive, setProtectionActive] = useState(false);
  const [protectionFee, setProtectionFee] = useState(0.05); // 5% fee
  
  const terms = [
    { value: '30', label: '30 Days', feeMultiplier: 1 },
    { value: '90', label: '90 Days', feeMultiplier: 2.5 },
    { value: '180', label: '180 Days', feeMultiplier: 4 },
    { value: '365', label: '365 Days', feeMultiplier: 7 },
  ];
  
  // Calculate fee based on amount and term
  const calculateFee = (amount: number, term: string) => {
    const selectedTermObj = terms.find(t => t.value === term);
    if (!selectedTermObj) return 0;
    
    return amount * protectionFee * selectedTermObj.feeMultiplier;
  };
  
  // Handle term selection
  const handleTermChange = (term: string) => {
    setSelectedTerm(term);
  };
  
  // Handle purchasing protection
  const handlePurchaseProtection = async () => {
    if (!connected || !publicKey) {
      toast.error('Please connect your wallet');
      return;
    }
    
    if (!protectionAmount || parseFloat(protectionAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Mock API call - would integrate with Solana program in real implementation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const amount = parseFloat(protectionAmount);
      const fee = calculateFee(amount, selectedTerm);
      
      setTotalDeposited(amount);
      setProtectionActive(true);
      setProtectionAmount('');
      
      toast.success(`Successfully purchased liquidation protection for ${amount} SOL`);
    } catch (error) {
      console.error('Protection purchase error:', error);
      toast.error('Failed to purchase protection. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };
  
  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-gray-900 rounded-xl shadow-lg">
      <h2 className="text-3xl font-bold text-white mb-6">Liquidation Protection</h2>
      <p className="text-gray-300 mb-8">
        Protect your collateral from liquidation during market volatility by purchasing coverage for your positions.
      </p>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-gray-800 p-6 rounded-lg">
          <h3 className="text-xl font-semibold text-white mb-4">Purchase Protection</h3>
          
          <div className="space-y-6">
            <div>
              <label className="block text-gray-300 mb-2">Protection Amount (SOL)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={protectionAmount}
                onChange={(e) => setProtectionAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-gray-700 text-white rounded px-3 py-2"
                disabled={isLoading || protectionActive}
              />
            </div>
            
            <div>
              <label className="block text-gray-300 mb-2">Protection Term</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {terms.map((term) => (
                  <button
                    key={term.value}
                    onClick={() => handleTermChange(term.value)}
                    className={`py-2 px-4 rounded-lg transition-colors ${
                      selectedTerm === term.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                    disabled={isLoading || protectionActive}
                  >
                    {term.label}
                  </button>
                ))}
              </div>
            </div>
            
            {protectionAmount && (
              <div className="bg-gray-700 p-4 rounded-lg">
                <h4 className="text-white font-medium mb-2">Fee Summary</h4>
                <div className="flex justify-between mb-1">
                  <span className="text-gray-300">Protection Amount:</span>
                  <span className="text-white">{formatCurrency(parseFloat(protectionAmount))} SOL</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="text-gray-300">Protection Term:</span>
                  <span className="text-white">{terms.find(t => t.value === selectedTerm)?.label}</span>
                </div>
                <div className="flex justify-between mb-1 border-t border-gray-600 pt-2 mt-2">
                  <span className="text-gray-300">Protection Fee:</span>
                  <span className="text-green-400">
                    {formatCurrency(calculateFee(parseFloat(protectionAmount), selectedTerm))} SOL
                  </span>
                </div>
              </div>
            )}
            
            <button
              onClick={handlePurchaseProtection}
              disabled={isLoading || !protectionAmount || protectionActive}
              className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition"
            >
              {isLoading ? 'Processing...' : protectionActive ? 'Protection Active' : 'Purchase Protection'}
            </button>
          </div>
        </div>
        
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-xl font-semibold text-white mb-4">Protection Status</h3>
          
          {protectionActive ? (
            <div className="space-y-4">
              <div className="bg-green-900/30 border border-green-800 rounded-lg p-4 flex items-center">
                <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                <span className="text-green-400 font-medium">Protection Active</span>
              </div>
              
              <div>
                <p className="text-gray-400 text-sm">Protected Amount</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(totalDeposited)} SOL</p>
              </div>
              
              <div>
                <p className="text-gray-400 text-sm">Protection Term</p>
                <p className="text-lg text-white">{terms.find(t => t.value === selectedTerm)?.label}</p>
              </div>
              
              <div>
                <p className="text-gray-400 text-sm">Expiry Date</p>
                <p className="text-lg text-white">
                  {new Date(Date.now() + parseInt(selectedTerm) * 24 * 60 * 60 * 1000).toLocaleDateString()}
                </p>
              </div>
              
              <div className="border-t border-gray-700 pt-4 mt-4">
                <p className="text-gray-300 text-sm">
                  Your position is protected from liquidation until the expiry date.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-4 flex items-center">
                <div className="w-3 h-3 rounded-full bg-gray-500 mr-2"></div>
                <span className="text-gray-400 font-medium">No Active Protection</span>
              </div>
              
              <p className="text-gray-300 text-sm">
                Purchase liquidation protection to safeguard your collateral during market volatility.
              </p>
            </div>
          )}
        </div>
      </div>
      
      <div className="bg-blue-900/30 p-6 rounded-lg border border-blue-800">
        <h3 className="text-xl font-semibold text-white mb-2">How Liquidation Protection Works</h3>
        <p className="text-gray-300 mb-4">
          Our protection system shields your collateral from getting liquidated during short-term market volatility.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-800/60 p-4 rounded-lg">
            <h4 className="text-blue-400 font-medium mb-2">1. Purchase Protection</h4>
            <p className="text-gray-400 text-sm">
              Select the amount of collateral to protect and choose a protection term. Pay a small fee based on these parameters.
            </p>
          </div>
          
          <div className="bg-gray-800/60 p-4 rounded-lg">
            <h4 className="text-blue-400 font-medium mb-2">2. Automatic Defense</h4>
            <p className="text-gray-400 text-sm">
              If your position approaches liquidation, the protocol will automatically deploy protection mechanisms.
            </p>
          </div>
          
          <div className="bg-gray-800/60 p-4 rounded-lg">
            <h4 className="text-blue-400 font-medium mb-2">3. Maintain Your Position</h4>
            <p className="text-gray-400 text-sm">
              Your collateral remains secure even during market downturns, giving you time to add more collateral or reduce debt.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiquidationProtection; 