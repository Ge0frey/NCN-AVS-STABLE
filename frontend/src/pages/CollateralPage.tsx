import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWalletContext } from '../context/WalletContext';
import api from '../services/api';

// Define types for collateral data
interface CollateralAsset {
  id: string;
  name: string;
  icon: string;
  balance: number;
  value: number;
  apy: number;
  price: number;
}

interface HistoryPoint {
  date: string;
  value: number;
}

interface OracleData {
  price: number;
  source: string;
  timestamp: string;
  confidence: number;
}

// Initial empty state
const initialCollateralState = {
  totalCollateralValue: 0,
  collateralRatio: 0,
  collateralAssets: [
    {
      id: 'jitosol',
      name: 'JitoSOL',
      icon: '🔷',
      balance: 0,
      value: 0,
      apy: 0,
      price: 0,
    },
    {
      id: 'stablebond',
      name: 'Stablebond',
      icon: '🔒',
      balance: 0,
      value: 0,
      apy: 0,
      price: 0,
    },
  ] as CollateralAsset[],
  collateralHistory: [] as HistoryPoint[],
};

export default function CollateralPage() {
  const navigate = useNavigate();
  const { balance, publicKey, connected } = useWalletContext();
  const [isLoading, setIsLoading] = useState(true);
  const [collateralData, setCollateralData] = useState(initialCollateralState);
  
  // Add oracle price state
  const [oraclePrices, setOraclePrices] = useState<Record<string, OracleData>>({});
  const [isOracleEnabled, setIsOracleEnabled] = useState<boolean>(false);
  const [isLoadingOracle, setIsLoadingOracle] = useState<boolean>(false);

  // Add useEffect to fetch oracle prices - make sure this is correctly running
  useEffect(() => {
    const fetchOraclePrices = async () => {
      setIsLoadingOracle(true);
      
      try {
        // Check if NCN features are enabled
        const features = await api.getFeatureFlags();
        
        setIsOracleEnabled(features.ncnEnabled);
        
        if (features.ncnEnabled) {
          // Fetch oracle prices for each asset
          const prices: Record<string, OracleData> = {};
          
          const fetchPromises = initialCollateralState.collateralAssets.map(async (asset) => {
            try {
              const data = await api.getAssetPrice(asset.id);
              if (data) {
                prices[asset.id] = data;
              }
            } catch (err) {
              console.error(`Failed to fetch price for ${asset.id}:`, err);
            }
          });
          
          // Wait for all fetch operations to complete
          await Promise.allSettled(fetchPromises);
          
          setOraclePrices(prices);
          
          // Log the oracle data
          console.log('Oracle data fetched successfully:', prices);
        }
      } catch (error) {
        console.error('Failed to fetch oracle prices:', error);
        setIsOracleEnabled(false);
      } finally {
        setIsLoadingOracle(false);
      }
    };
    
    fetchOraclePrices();
    
    // Set up a periodic refresh (every 60 seconds)
    const refreshInterval = setInterval(fetchOraclePrices, 60000);
    
    return () => {
      clearInterval(refreshInterval);
    };
  }, []);

  // Load collateral data
  useEffect(() => {
    const loadCollateralData = async () => {
      setIsLoading(true);
      
      try {
        let jitoSolBalance = 0;
        if (connected && publicKey) {
          try {
            const positions = await api.getUserPositions(publicKey.toString());
            jitoSolBalance = positions.reduce((total, pos) => total + pos.stakedAmount, 0);
          } catch (error) {
            console.error('Failed to fetch Jito positions:', error);
          }
        }
        
        // Create a copy of the initial state to update
        const updatedCollateralData = { ...initialCollateralState };
        
        // Update each collateral asset with oracle data if available
        updatedCollateralData.collateralAssets = updatedCollateralData.collateralAssets.map(asset => {
          const updatedAsset = { ...asset };
          
          // Update JitoSOL balance with real data
          if (asset.id === 'jitosol') {
            updatedAsset.balance = jitoSolBalance;
          }
          
          // Use oracle price data if available
          if (oraclePrices[asset.id]) {
            updatedAsset.price = oraclePrices[asset.id].price;
            updatedAsset.value = asset.balance * oraclePrices[asset.id].price;
          }
          
          return updatedAsset;
        });
        
        // Calculate total collateral value
        updatedCollateralData.totalCollateralValue = updatedCollateralData.collateralAssets.reduce(
          (total, asset) => total + asset.value, 
          0
        );
        
        // Calculate collateral ratio (if there's any debt)
        const totalDebt = 0; // This would come from a real API call in a full implementation
        if (totalDebt > 0) {
          updatedCollateralData.collateralRatio = (updatedCollateralData.totalCollateralValue / totalDebt) * 100;
        } else {
          updatedCollateralData.collateralRatio = 999; // Arbitrary high number when there's no debt
        }
        
        setCollateralData(updatedCollateralData);
      } catch (error) {
        console.error('Failed to load collateral data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadCollateralData();
  }, [connected, publicKey, oraclePrices]); // Make sure this runs when oracle prices update

  // Calculate health status based on collateralization ratio
  const getHealthStatus = (ratio: number) => {
    if (ratio >= 200) return { status: 'Excellent', color: 'text-green-400' };
    if (ratio >= 150) return { status: 'Good', color: 'text-blue-400' };
    if (ratio >= 120) return { status: 'Moderate', color: 'text-yellow-400' };
    return { status: 'At Risk', color: 'text-red-400' };
  };

  const healthStatus = getHealthStatus(collateralData.collateralRatio);

  // Render loading skeleton
  if (isLoading) {
    return (
      <div className="animate-pulse">
        <h1 className="mb-6 text-2xl font-bold md:text-3xl">Collateral</h1>
        <div className="mb-6 grid gap-6 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 rounded-lg bg-slate-200 dark:bg-slate-700"></div>
          ))}
        </div>
        <div className="mb-6 h-64 rounded-lg bg-slate-200 dark:bg-slate-700"></div>
        <div className="grid gap-6 md:grid-cols-2">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-48 rounded-lg bg-slate-200 dark:bg-slate-700"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <h1 className="text-2xl font-bold md:text-3xl">Collateral</h1>
        <div className="flex space-x-3">
          <button
            onClick={() => navigate('/collateral/deposit')}
            className="btn btn-primary inline-flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Deposit
          </button>
          <button
            onClick={() => navigate('/collateral/withdraw')}
            className="btn btn-outline inline-flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Withdraw
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mb-8 grid gap-6 md:grid-cols-3">
        {/* Total Collateral Value */}
        <div className="card transition-all hover:shadow-md">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Collateral Value</h3>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-sky-600 dark:bg-sky-900 dark:text-sky-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="mb-1 text-2xl font-bold">${collateralData.totalCollateralValue.toLocaleString()}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Total value of your deposited collateral
          </div>
        </div>

        {/* Collateralization Ratio */}
        <div className="card transition-all hover:shadow-md">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Collateralization Ratio</h3>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-violet-600 dark:bg-violet-900 dark:text-violet-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <div className="mb-1 text-2xl font-bold">{collateralData.collateralRatio}%</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Current ratio of collateral to stablecoins
          </div>
        </div>

        {/* Health Status */}
        <div className="card transition-all hover:shadow-md">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Health Status</h3>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
          </div>
          <div className={`mb-1 text-2xl font-bold ${healthStatus.color}`}>{healthStatus.status}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {healthStatus.status === 'At Risk' 
              ? 'Deposit more collateral to improve health' 
              : 'Your collateral position is healthy'}
          </div>
        </div>
      </div>

      {/* Collateralization Gauge */}
      <div className="mb-8 card">
        <h2 className="mb-4 text-xl font-bold">Collateralization Ratio</h2>
        <div className="mb-6">
          <div className="mb-2 flex justify-between text-sm">
            <span className="text-red-500 dark:text-red-400">Liquidation Risk</span>
            <span className="text-amber-500 dark:text-amber-400">Fair</span>
            <span className="text-sky-500 dark:text-sky-400">Good</span>
            <span className="text-green-500 dark:text-green-400">Excellent</span>
          </div>
          <div className="h-4 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-red-500 via-amber-500 via-sky-500 to-green-500"
              style={{ width: '100%' }}
            ></div>
          </div>
          <div className="relative mt-1 h-6">
            <div 
              className="absolute -translate-x-1/2 transform"
              style={{ 
                left: `${Math.min(Math.max((collateralData.collateralRatio - 100) / 2, 0), 100)}%`,
                top: 0
              }}
            >
              <div className="flex flex-col items-center">
                <svg className="h-6 w-6 text-slate-800 dark:text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3z" />
                </svg>
                <span className="font-medium">{collateralData.collateralRatio}%</span>
              </div>
            </div>
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>100%</span>
              <span>130%</span>
              <span>150%</span>
              <span>175%</span>
              <span>200%+</span>
            </div>
          </div>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Your current collateralization ratio is <span className="font-medium">{collateralData.collateralRatio}%</span>. 
          {collateralData.collateralRatio < 130 && (
            <span className="text-red-500 dark:text-red-400"> You are at risk of liquidation. Please deposit more collateral immediately.</span>
          )}
          {collateralData.collateralRatio >= 130 && collateralData.collateralRatio < 150 && (
            <span className="text-amber-500 dark:text-amber-400"> Your position is fair but could be improved by adding more collateral.</span>
          )}
          {collateralData.collateralRatio >= 150 && collateralData.collateralRatio < 175 && (
            <span className="text-sky-500 dark:text-sky-400"> Your position is in good standing.</span>
          )}
          {collateralData.collateralRatio >= 175 && (
            <span className="text-green-500 dark:text-green-400"> Your position is excellent with a strong safety margin.</span>
          )}
        </p>
      </div>

      {/* Collateral Assets */}
      <div className="mb-8">
        <h2 className="mb-4 text-xl font-bold">Your Collateral Assets</h2>
        <div className="collateral-assets grid grid-cols-1 sm:grid-cols-2 gap-6">
          {collateralData.collateralAssets.map((asset) => (
            <div key={asset.id} className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{asset.icon}</div>
                  <div>
                    <h3 className="font-semibold text-white">{asset.name}</h3>
                    <div className="text-sm text-slate-400">Balance: {asset.balance.toFixed(4)}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-semibold text-white">${asset.value.toFixed(2)}</div>
                  <div className="text-sm text-slate-400">Value</div>
                </div>
              </div>
              
              {/* Oracle Data Display */}
              {isOracleEnabled && oraclePrices[asset.id] && (
                <div className="mt-3 p-3 bg-slate-700/50 rounded-lg border border-slate-600">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-slate-300">Oracle Price:</span>
                    <span className="font-medium text-white">${oraclePrices[asset.id].price.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-slate-300">Source:</span>
                    <span className="text-sm text-slate-300">{oraclePrices[asset.id].source}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-300">Last Updated:</span>
                    <span className="text-sm text-slate-300">
                      {new Date(oraclePrices[asset.id].timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-300">Confidence:</span>
                    <span className="text-sm text-slate-300">
                      {(oraclePrices[asset.id].confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              )}
              
              {isLoadingOracle && !oraclePrices[asset.id] && (
                <div className="mt-3 p-3 bg-slate-700/50 rounded-lg border border-slate-600 flex items-center justify-center">
                  <div className="animate-pulse flex space-x-2 items-center">
                    <div className="h-2 w-2 bg-blue-400 rounded-full"></div>
                    <div className="h-2 w-2 bg-blue-400 rounded-full"></div>
                    <div className="h-2 w-2 bg-blue-400 rounded-full"></div>
                    <span className="text-sm text-slate-400">Loading oracle data...</span>
                  </div>
                </div>
              )}
              
              {!isLoadingOracle && !oraclePrices[asset.id] && isOracleEnabled && (
                <div className="mt-3 p-3 bg-slate-700/50 rounded-lg border border-slate-600">
                  <div className="text-sm text-amber-400 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Oracle data unavailable
                  </div>
                </div>
              )}
              
              <div className="mt-4 flex space-x-2">
                <button 
                  onClick={() => navigate('/deposit')}
                  className="flex-1 py-2 px-3 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Deposit
                </button>
                <button 
                  onClick={() => navigate('/withdraw')}
                  className="flex-1 py-2 px-3 rounded-lg bg-slate-600 text-white text-sm font-medium hover:bg-slate-700 transition-colors"
                >
                  Withdraw
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Collateral History Chart (Placeholder) */}
      <div className="card">
        <h2 className="mb-4 text-xl font-bold">Collateral History</h2>
        <div className="h-64 rounded-md bg-slate-100 dark:bg-slate-800">
          <div className="flex h-full items-center justify-center">
            <p className="text-slate-500 dark:text-slate-400">
              Chart visualization will be implemented here
            </p>
          </div>
        </div>
        <div className="mt-4 flex justify-between text-sm text-slate-500 dark:text-slate-400">
          {collateralData.collateralHistory.map((point, index) => (
            <div key={index} className="text-center">
              <p>{point.date.split('-').slice(1).join('/')}</p>
              <p className="font-medium">${(point.value / 1000).toFixed(1)}k</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 