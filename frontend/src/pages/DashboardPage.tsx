import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWalletContext } from '../context/WalletContext';
import api from '../services/api';

// Define types for dashboard data
interface Stablecoin {
  name: string;
  balance: number;
  icon: string;
}

interface Activity {
  id: number;
  type: 'Deposit' | 'Mint' | 'Stake' | 'Governance';
  amount?: string;
  action?: string;
  timestamp: number;
}

// Initial empty state
const initialDashboardState = {
  walletBalance: 0,
  jitoSolHoldings: 0,
  stablebondHoldings: 0,
  ownedStablecoins: [] as Stablecoin[],
  collateralizationRatio: 0,
  recentActivity: [] as Activity[],
  networkStatus: 'Unknown',
};

export default function DashboardPage() {
  console.log('DashboardPage: Rendering');
  
  const navigate = useNavigate();
  const { balance, publicKey, connected, isInitialized, isLoading } = useWalletContext();
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(initialDashboardState);
  
  // Add NCN state
  const [ncnOperators, setNcnOperators] = useState<any[]>([]);
  const [isNcnEnabled, setIsNcnEnabled] = useState<boolean>(false);
  const [isLoadingNcn, setIsLoadingNcn] = useState<boolean>(false);

  console.log('DashboardPage: State', {
    connected,
    isInitialized,
    isLoading,
    isPageLoading,
    hasPublicKey: !!publicKey,
    balance,
  });

  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      setIsPageLoading(true);
      
      try {
        
        let jitoSolHoldings = 0;
        if (connected && publicKey) {
          try {
            const positions = await api.getUserPositions(publicKey.toString());
            jitoSolHoldings = positions.reduce((total, pos) => total + pos.stakedAmount, 0);
          } catch (error) {
            console.error('Failed to fetch Jito positions:', error);
          }
        }
        
        // Set dashboard data with real wallet balance and Jito holdings
        setDashboardData({
          walletBalance: balance,
          jitoSolHoldings,
          stablebondHoldings: 0, 
          ownedStablecoins: [], 
          collateralizationRatio: 0, 
          recentActivity: [], 
          networkStatus: 'Healthy', 
        });
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setIsPageLoading(false);
      }
    };
    
    loadDashboardData();
  }, [balance, connected, publicKey]);
  
  // Add useEffect to fetch NCN operators
  useEffect(() => {
    const fetchNcnData = async () => {
      setIsLoadingNcn(true);
      
      try {
        // Check if NCN features are enabled
        const features = await api.getFeatureFlags();
        
        setIsNcnEnabled(features.ncnEnabled);
        
        if (features.ncnEnabled) {
          // Fetch NCN operators
          const operators = await api.getOperators();
          setNcnOperators(operators || []);
        }
      } catch (error) {
        console.error('Failed to fetch NCN data:', error);
        setIsNcnEnabled(false);
      } finally {
        setIsLoadingNcn(false);
      }
    };
    
    fetchNcnData();
  }, []);

  // Format timestamp to relative time
  const formatRelativeTime = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) return `${interval} year${interval === 1 ? '' : 's'} ago`;
    
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) return `${interval} month${interval === 1 ? '' : 's'} ago`;
    
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) return `${interval} day${interval === 1 ? '' : 's'} ago`;
    
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) return `${interval} hour${interval === 1 ? '' : 's'} ago`;
    
    interval = Math.floor(seconds / 60);
    if (interval >= 1) return `${interval} minute${interval === 1 ? '' : 's'} ago`;
    
    return `${Math.floor(seconds)} second${seconds === 1 ? '' : 's'} ago`;
  };

  // Render loading skeleton
  if (isPageLoading) {
    console.log('DashboardPage: Rendering loading skeleton');
    return (
      <div className="animate-pulse">
        <h1 className="mb-6 text-2xl font-bold md:text-3xl">Dashboard</h1>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 rounded-lg bg-slate-200 dark:bg-slate-700"></div>
          ))}
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="h-64 rounded-lg bg-slate-200 dark:bg-slate-700"></div>
          <div className="h-64 rounded-lg bg-slate-200 dark:bg-slate-700"></div>
        </div>
      </div>
    );
  }

  console.log('DashboardPage: Rendering content');
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold md:text-3xl">Dashboard</h1>
        <div className="flex items-center space-x-2 text-sm text-slate-500 dark:text-slate-400">
          <span className={`h-2 w-2 rounded-full ${dashboardData.networkStatus === 'Healthy' ? 'bg-green-500' : 'bg-red-500'}`}></span>
          <span>Network: {dashboardData.networkStatus}</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Wallet Balance */}
        <div className="card card-hover">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Wallet Balance</h3>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-sky-600 dark:bg-sky-900 dark:text-sky-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
          </div>
          <div className="mb-1 text-2xl font-bold">{dashboardData.walletBalance.toFixed(2)} SOL</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {publicKey && `${publicKey.toString().slice(0, 4)}...${publicKey.toString().slice(-4)}`}
          </div>
        </div>

        {/* JitoSOL Holdings */}
        <div className="card card-hover">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">JitoSOL Holdings</h3>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-violet-600 dark:bg-violet-900 dark:text-violet-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
          <div className="mb-1 text-2xl font-bold">{dashboardData.jitoSolHoldings.toFixed(2)} JitoSOL</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Available for staking or collateral
          </div>
        </div>

        {/* Stablebond Holdings */}
        <div className="card card-hover">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Stablebond Holdings</h3>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
          </div>
          <div className="mb-1 text-2xl font-bold">{dashboardData.stablebondHoldings.toLocaleString()} BOND</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Secure collateral for stablecoins
          </div>
        </div>

        {/* Collateralization Ratio */}
        <div className="card card-hover">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Collateralization Ratio</h3>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <div className="mb-1 text-2xl font-bold">{dashboardData.collateralizationRatio}%</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {dashboardData.collateralizationRatio >= 150 ? 'Healthy' : 'At risk'}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        <button
          onClick={() => navigate('/stablecoins/create')}
          className="flex items-center justify-center rounded-md bg-sky-100 p-3 text-sky-700 transition-colors hover:bg-sky-200 dark:bg-sky-900/30 dark:text-sky-400 dark:hover:bg-sky-900/50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Create Stablecoin
        </button>
        <button
          onClick={() => navigate('/collateral/deposit')}
          className="flex items-center justify-center rounded-md bg-violet-100 p-3 text-violet-700 transition-colors hover:bg-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:hover:bg-violet-900/50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Deposit Collateral
        </button>
        <button
          onClick={() => navigate('/mint')}
          className="flex items-center justify-center rounded-md bg-emerald-100 p-3 text-emerald-700 transition-colors hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
          </svg>
          Mint Stablecoins
        </button>
        <button
          onClick={() => navigate('/stake')}
          className="flex items-center justify-center rounded-md bg-amber-100 p-3 text-amber-700 transition-colors hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Stake JitoSOL
        </button>
      </div>

      {/* Main Content */}
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {/* Owned Stablecoins */}
        <div className="card">
          <h2 className="mb-4 text-xl font-bold">Your Stablecoins</h2>
          {dashboardData.ownedStablecoins.length > 0 ? (
            <div className="space-y-4">
              {dashboardData.ownedStablecoins.map((coin, index) => (
                <div key={index} className="flex items-center justify-between rounded-md border border-slate-200 p-3 transition-colors hover:border-sky-500 dark:border-slate-700 dark:hover:border-sky-400">
                  <div className="flex items-center">
                    <div className="mr-3 text-2xl">{coin.icon}</div>
                    <div>
                      <div className="font-medium">{coin.name}</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">Stablecoin</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{coin.balance.toLocaleString()}</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">≈ ${coin.balance.toLocaleString()}</div>
                  </div>
                </div>
              ))}
              <button
                onClick={() => navigate('/stablecoins')}
                className="mt-2 w-full rounded-md border border-slate-200 p-2 text-center text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800/50"
              >
                View All Stablecoins
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-slate-300 p-6 text-center dark:border-slate-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="mb-2 h-10 w-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="mb-4 text-slate-500 dark:text-slate-400">You don't have any stablecoins yet</p>
              <button
                onClick={() => navigate('/stablecoins/create')}
                className="btn btn-primary"
              >
                Create Your First Stablecoin
              </button>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="card">
          <h2 className="mb-4 text-xl font-bold">Recent Activity</h2>
          {dashboardData.recentActivity.length > 0 ? (
            <div className="space-y-4">
              {dashboardData.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3 border-b border-slate-100 pb-3 last:border-0 dark:border-slate-800">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                    {activity.type === 'Deposit' && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    )}
                    {activity.type === 'Mint' && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
                      </svg>
                    )}
                    {activity.type === 'Stake' && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    )}
                    {activity.type === 'Governance' && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">
                        {activity.type === 'Governance' ? activity.action : `${activity.type} ${activity.amount}`}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {formatRelativeTime(activity.timestamp)}
                      </div>
                    </div>
                    <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {activity.type === 'Deposit' && 'Added collateral to your account'}
                      {activity.type === 'Mint' && 'Created new stablecoins'}
                      {activity.type === 'Stake' && 'Staked tokens for rewards'}
                      {activity.type === 'Governance' && 'Participated in platform governance'}
                    </div>
                  </div>
                </div>
              ))}
              <button
                className="mt-2 w-full rounded-md border border-slate-200 p-2 text-center text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800/50"
              >
                View All Activity
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-slate-300 p-6 text-center dark:border-slate-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="mb-2 h-10 w-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-slate-500 dark:text-slate-400">No recent activity</p>
            </div>
          )}
        </div>
      </div>

      {/* Collateralization Chart (Placeholder) */}
      <div className="mt-8 card">
        <h2 className="mb-4 text-xl font-bold">Collateralization Overview</h2>
        <div className="h-64 rounded-md bg-slate-100 dark:bg-slate-800">
          <div className="flex h-full items-center justify-center">
            <p className="text-slate-500 dark:text-slate-400">
              Chart visualization will be implemented here
            </p>
          </div>
        </div>
      </div>

      {/* NCN Information Panel */}
      {isNcnEnabled && (
        <div className="col-span-1 md:col-span-2 glass-panel p-6">
          <h3 className="text-xl font-bold mb-4 gradient-text">NCN Network Status</h3>
          
          {isLoadingNcn ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-800/50 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-400">{ncnOperators.length}</div>
                  <div className="text-xs text-slate-400">Total Operators</div>
                </div>
                <div className="bg-slate-800/50 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-400">
                    {ncnOperators.filter(op => op.status === 'Active').length}
                  </div>
                  <div className="text-xs text-slate-400">Active Operators</div>
                </div>
                <div className="bg-slate-800/50 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-purple-400">
                    {ncnOperators.reduce((sum, op) => sum + op.stake, 0).toLocaleString()}
                  </div>
                  <div className="text-xs text-slate-400">Total Stake</div>
                </div>
              </div>
              
              <h4 className="text-sm font-medium text-slate-300 mb-2">Active Operators</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                {ncnOperators.map((operator) => (
                  <div
                    key={operator.publicKey}
                    className="bg-slate-800/30 p-2 rounded flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center">
                      <div className={`h-2 w-2 rounded-full mr-2 ${
                        operator.status === 'Active' ? 'bg-green-500 pulse' : 
                        operator.status === 'Inactive' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}></div>
                      <span className="font-medium">{operator.name}</span>
                    </div>
                    <div className="text-slate-400">{operator.stake.toLocaleString()} tokens</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
} 