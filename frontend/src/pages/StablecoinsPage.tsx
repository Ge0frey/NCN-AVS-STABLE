import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStableFunds } from '../hooks/useStableFunds';

export default function StablecoinsPage() {
  const navigate = useNavigate();
  const { userStablecoins, loading, error, fetchUserStablecoins } = useStableFunds();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOwned, setFilterOwned] = useState(false);
  const [sortBy, setSortBy] = useState('marketCap');
  const [sortOrder, setSortOrder] = useState('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Refresh stablecoins when component mounts
  useEffect(() => {
    fetchUserStablecoins();
  }, [fetchUserStablecoins]);

  // Filter and sort stablecoins
  const filteredStablecoins = userStablecoins
    .filter(coin => {
      // Filter by search term
      const matchesSearch = coin.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           coin.symbol.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filter by ownership
      const matchesOwnership = filterOwned ? coin.isOwned : true;
      
      return matchesSearch && matchesOwnership;
    })
    .sort((a, b) => {
      // Sort by selected field
      const aValue = a[sortBy as keyof typeof a];
      const bValue = b[sortBy as keyof typeof b];
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue) 
          : bValue.localeCompare(aValue);
      }
      
      return 0;
    });

  // Handle sort change
  const handleSortChange = (field: string) => {
    if (sortBy === field) {
      // Toggle sort order if clicking the same field
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new sort field and default to descending
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <h1 className="text-2xl font-bold md:text-3xl">Stablecoins</h1>
        <button
          onClick={() => navigate('/stablecoins/create')}
          className="btn btn-primary inline-flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Create Stablecoin
        </button>
      </div>

      {/* Filters and Search */}
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <svg className="h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search stablecoins..."
            className="input pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center space-x-2">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500 dark:border-slate-700 dark:bg-slate-900"
              checked={filterOwned}
              onChange={() => setFilterOwned(!filterOwned)}
            />
            <span>Show only my stablecoins</span>
          </label>
        </div>

        <div className="flex items-center justify-end space-x-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`rounded-md p-2 ${viewMode === 'grid' ? 'bg-slate-200 dark:bg-slate-700' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`rounded-md p-2 ${viewMode === 'table' ? 'bg-slate-200 dark:bg-slate-700' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-sky-500"></div>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="mb-6 rounded-md bg-red-50 p-4 dark:bg-red-900/20">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error</h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                {error}
              </div>
              <div className="mt-4">
                <button
                  onClick={() => fetchUserStablecoins()}
                  className="rounded-md bg-red-50 px-4 py-2 text-sm font-medium text-red-800 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-200 dark:hover:bg-red-900/40"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No results */}
      {!loading && !error && filteredStablecoins.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
          <svg xmlns="http://www.w3.org/2000/svg" className="mb-2 h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="mb-1 text-lg font-medium">No stablecoins found</h3>
          <p className="mb-4 text-slate-500 dark:text-slate-400">
            {searchTerm ? 'Try adjusting your search or filters' : 'Create your first stablecoin to get started'}
          </p>
          <button
            onClick={() => navigate('/stablecoins/create')}
            className="btn btn-primary"
          >
            Create Stablecoin
          </button>
        </div>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && !loading && !error && filteredStablecoins.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredStablecoins.map((coin) => (
            <div key={coin.id} className="card transition-all hover:shadow-md">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="mr-3 text-3xl">{coin.icon}</div>
                  <div>
                    <h3 className="text-lg font-bold">{coin.name}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{coin.symbol}</p>
                  </div>
                </div>
                {coin.isOwned && (
                  <span className="rounded-full bg-sky-100 px-2 py-1 text-xs font-medium text-sky-800 dark:bg-sky-900/30 dark:text-sky-400">
                    Owned
                  </span>
                )}
              </div>
              <div className="mb-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Price</p>
                  <p className="font-medium">${coin.price.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Market Cap</p>
                  <p className="font-medium">${(coin.marketCap / 1000000).toFixed(1)}M</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Collateral</p>
                  <p className="font-medium">{coin.collateralType}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">C-Ratio</p>
                  <p className="font-medium">{coin.collateralRatio}%</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => {/* View details */}}
                  className="btn btn-outline flex-1"
                >
                  Details
                </button>
                {coin.isOwned ? (
                  <button
                    onClick={() => navigate('/mint')}
                    className="btn btn-primary flex-1"
                  >
                    Mint
                  </button>
                ) : (
                  <button
                    onClick={() => {/* Buy action */}}
                    className="btn btn-primary flex-1"
                  >
                    Buy
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && !loading && !error && filteredStablecoins.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-800">
              <tr>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400"
                >
                  <button 
                    className="flex items-center"
                    onClick={() => handleSortChange('name')}
                  >
                    Stablecoin
                    {sortBy === 'name' && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sortOrder === 'asc' ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
                      </svg>
                    )}
                  </button>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400"
                >
                  <button 
                    className="flex items-center"
                    onClick={() => handleSortChange('price')}
                  >
                    Price
                    {sortBy === 'price' && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sortOrder === 'asc' ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
                      </svg>
                    )}
                  </button>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400"
                >
                  <button 
                    className="flex items-center"
                    onClick={() => handleSortChange('marketCap')}
                  >
                    Market Cap
                    {sortBy === 'marketCap' && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sortOrder === 'asc' ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
                      </svg>
                    )}
                  </button>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400"
                >
                  <button 
                    className="flex items-center"
                    onClick={() => handleSortChange('collateralRatio')}
                  >
                    C-Ratio
                    {sortBy === 'collateralRatio' && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sortOrder === 'asc' ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
                      </svg>
                    )}
                  </button>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400"
                >
                  Collateral
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-700 dark:bg-slate-800">
              {filteredStablecoins.map((coin) => (
                <tr key={coin.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center">
                      <div className="mr-3 text-2xl">{coin.icon}</div>
                      <div>
                        <div className="font-medium">{coin.name}</div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">{coin.symbol}</div>
                      </div>
                      {coin.isOwned && (
                        <span className="ml-2 rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-800 dark:bg-sky-900/30 dark:text-sky-400">
                          Owned
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    ${coin.price.toFixed(2)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    ${(coin.marketCap / 1000000).toFixed(1)}M
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                      coin.collateralRatio >= 175 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                      coin.collateralRatio >= 150 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                      'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {coin.collateralRatio}%
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    {coin.collateralType}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => {/* View details */}}
                        className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      {coin.isOwned ? (
                        <button
                          onClick={() => navigate('/mint')}
                          className="rounded-md p-2 text-sky-500 hover:bg-sky-100 hover:text-sky-700 dark:text-sky-400 dark:hover:bg-sky-900/30 dark:hover:text-sky-300"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </button>
                      ) : (
                        <button
                          onClick={() => {/* Buy action */}}
                          className="rounded-md p-2 text-green-500 hover:bg-green-100 hover:text-green-700 dark:text-green-400 dark:hover:bg-green-900/30 dark:hover:text-green-300"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 