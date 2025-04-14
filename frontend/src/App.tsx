import { Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import Layout from './components/layout/Layout'
import ProtectedRoute from './components/auth/ProtectedRoute'
import ErrorBoundary from './components/ErrorBoundary'
import { WalletProvider } from './context/WalletContext'
import { AppContextProvider } from './context/AppContext'
import { Toaster } from 'react-hot-toast'
import { CivicAuthProvider } from '@civic/auth-web3/react'
import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from '@solana/wallet-adapter-react'
import { SolflareWalletAdapter, LedgerWalletAdapter, PhantomWalletAdapter } from '@solana/wallet-adapter-wallets'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { clusterApiUrl } from '@solana/web3.js'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { useMemo } from 'react'

// Import wallet adapter CSS
import '@solana/wallet-adapter-react-ui/styles.css'

// Pages
import HomePage from './pages/HomePage'
import ConnectPage from './pages/ConnectPage'
import DashboardPage from './pages/DashboardPage'
import StablecoinsPage from './pages/StablecoinsPage'
import CreateStablecoinPage from './pages/CreateStablecoinPage'
import CollateralPage from './pages/CollateralPage'
import DepositCollateralPage from './pages/DepositCollateralPage'
import WithdrawCollateralPage from './pages/WithdrawCollateralPage'
import MintPage from './pages/MintPage'
import RedeemPage from './pages/RedeemPage'
import StakePage from './pages/StakePage'
import StakeResultPage from './pages/StakeResultPage'
import GovernancePage from './pages/GovernancePage'
import SmartVaults from './components/staking/SmartVaults'
import LiquidationProtection from './components/staking/LiquidationProtection'

function App() {
  // Set up network and wallet configuration
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);
  
  // Include PhantomWalletAdapter to ensure it's available both for Civic and direct connection
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(), // Include Phantom in case Civic doesn't register it
      new SolflareWalletAdapter(),
      new LedgerWalletAdapter()
    ],
    []
  );

  // Wallet modal configuration to ensure it always shows all wallets including the embedded one
  const walletModalProps = useMemo(
    () => ({
      featuredWallets: 5, // Show more wallets in the featured section
      showAllWallets: true, // Always show all available wallets in the modal
    }),
    []
  );

  // Get the Civic Auth client ID from environment variables
  const civicClientId = import.meta.env.VITE_CIVIC_CLIENT_ID;

  // Define callbacks for Civic Auth
  const handleSignIn = (error?: Error) => {
    if (error) {
      console.error('Civic Auth sign-in error:', error);
    } else {
      console.log('Civic Auth sign-in successful');
    }
  };

  const handleSignOut = () => {
    console.log('Civic Auth sign-out successful');
  };

  return (
    <ErrorBoundary>
      {/* First, establish the Solana connection */}
      <ConnectionProvider endpoint={endpoint}>
        {/* Next, wrap with CivicAuthProvider, which needs the connection */}
        <CivicAuthProvider 
          clientId={civicClientId}
          onSignIn={handleSignIn}
          onSignOut={handleSignOut}
          displayMode="redirect"
          redirectUrl={window.location.origin + "/connect"}
        >
          {/* Then add the Solana wallet providers, which will work with Civic's embedded wallet */}
          <SolanaWalletProvider wallets={wallets} autoConnect>
            <WalletModalProvider {...walletModalProps}>
              <ThemeProvider>
                <WalletProvider>
                  <AppContextProvider>
                    <Toaster position="top-center" />
                    <div className="flex flex-col min-h-screen bg-gradient-to-b from-gray-900 to-black">
                      <Layout>
                        <Routes>
                          {/* Public routes */}
                          <Route path="/" element={<HomePage />} />
                          <Route path="/connect" element={<ConnectPage />} />
                          <Route path="/test-smart-vaults" element={<SmartVaults />} />
                          
                          {/* Protected routes */}
                          <Route path="/dashboard" element={
                            <ProtectedRoute>
                              <DashboardPage />
                            </ProtectedRoute>
                          } />
                          <Route path="/stablecoins" element={
                            <ProtectedRoute>
                              <StablecoinsPage />
                            </ProtectedRoute>
                          } />
                          <Route path="/stablecoins/create" element={
                            <ProtectedRoute>
                              <CreateStablecoinPage />
                            </ProtectedRoute>
                          } />
                          <Route path="/collateral" element={
                            <ProtectedRoute>
                              <CollateralPage />
                            </ProtectedRoute>
                          } />
                          <Route path="/collateral/deposit" element={
                            <ProtectedRoute>
                              <DepositCollateralPage />
                            </ProtectedRoute>
                          } />
                          <Route path="/collateral/withdraw" element={
                            <ProtectedRoute>
                              <WithdrawCollateralPage />
                            </ProtectedRoute>
                          } />
                          <Route path="/mint" element={
                            <ProtectedRoute>
                              <MintPage />
                            </ProtectedRoute>
                          } />
                          <Route path="/redeem" element={
                            <ProtectedRoute>
                              <RedeemPage />
                            </ProtectedRoute>
                          } />
                          <Route path="/stake" element={
                            <ProtectedRoute>
                              <StakePage />
                            </ProtectedRoute>
                          } />
                          <Route path="/stake/result" element={
                            <ProtectedRoute>
                              <StakeResultPage />
                            </ProtectedRoute>
                          } />
                          <Route path="/governance" element={
                            <ProtectedRoute>
                              <GovernancePage />
                            </ProtectedRoute>
                          } />
                          <Route path="/smart-vaults" element={
                            <ProtectedRoute>
                              <SmartVaults />
                            </ProtectedRoute>
                          } />
                          <Route path="/liquidation-protection" element={
                            <ProtectedRoute>
                              <LiquidationProtection />
                            </ProtectedRoute>
                          } />
                          
                          {/* Fallback route */}
                          <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                      </Layout>
                    </div>
                  </AppContextProvider>
                </WalletProvider>
              </ThemeProvider>
            </WalletModalProvider>
          </SolanaWalletProvider>
        </CivicAuthProvider>
      </ConnectionProvider>
    </ErrorBoundary>
  )
}

export default App
