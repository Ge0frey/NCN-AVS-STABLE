import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWalletContext } from '../context/WalletContext';

// Mock data for demonstration
const mockCollateralData = {
  totalCollateralValue: 12500,
  collateralRatio: 185,
  collateralAssets: [
    {
      id: 'jitosol',
      name: 'JitoSOL',
      icon: '🔷',
      balance: 8.32,
      value: 7500,
      apy: 5.2,
    },
    {
      id: 'stablebond',
      name: 'Stablebond',
      icon: '🔒',
      balance: 5000,
      value: 5000,
      apy: 3.8,
    },
  ],
  collateralHistory: [
    { date: '2023-10-01', value: 8000 },
    { date: '2023-11-01', value: 9200 },
    { date: '2023-12-01', value: 10500 },
    { date: '2024-01-01', value: 11800 },
    { date: '2024-02-01', value: 12500 },
  ],
};

export default function CollateralPage() {
  const navigate = useNavigate();
  const { balance } = useWalletContext();
  const [isLoading, setIsLoading] = useState(true);
  const [collateralData, setCollateralData] = useState(mockCollateralData);

  // Simulate data loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      // In a real app, you would fetch data from your API here
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Calculate health status based on collateralization ratio
  const getHealthStatus = (ratio: number) => {
    if (ratio >= 175) return { status: 'Excellent', color: 'text-green-500 dark:text-green-400' };
    if (ratio >= 150) return { status: 'Good', color: 'text-sky-500 dark:text-sky-400' };
    if (ratio >= 130) return { status: 'Fair', color: 'text-amber-500 dark:text-amber-400' };
    return { status: 'At Risk', color: 'text-red-500 dark:text-red-400' };
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
        <div className="grid gap-6 md:grid-cols-2">
          {collateralData.collateralAssets.map((asset) => (
            <div key={asset.id} className="card transition-all hover:shadow-md">
              <div className="mb-4 flex items-center">
                <div className="mr-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-2xl dark:bg-slate-700">
                  {asset.icon}
                </div>
                <div>
                  <h3 className="text-lg font-bold">{asset.name}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    APY: <span className="text-green-500 dark:text-green-400">{asset.apy}%</span>
                  </p>
                </div>
              </div>
              <div className="mb-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Balance</p>
                  <p className="font-medium">{asset.balance.toLocaleString()} {asset.id === 'jitosol' ? 'JitoSOL' : 'BOND'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Value</p>
                  <p className="font-medium">${asset.value.toLocaleString()}</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => navigate('/collateral/deposit')}
                  className="btn btn-outline flex-1"
                >
                  Deposit
                </button>
                <button
                  onClick={() => navigate('/collateral/withdraw')}
                  className="btn btn-outline flex-1"
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