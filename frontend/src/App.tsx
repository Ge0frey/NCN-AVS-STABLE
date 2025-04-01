import { Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import Layout from './components/layout/Layout'
import ProtectedRoute from './components/auth/ProtectedRoute'
import ErrorBoundary from './components/ErrorBoundary'
import { WalletProvider } from './context/WalletContext'
import { AppContextProvider } from './context/AppContext'
import { Toaster } from 'react-hot-toast'

// Solana Wallet Adapter
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from '@solana/wallet-adapter-react'
import { PhantomWalletAdapter, SolflareWalletAdapter, LedgerWalletAdapter } from '@solana/wallet-adapter-wallets'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { clusterApiUrl } from '@solana/web3.js'
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
  const network = WalletAdapterNetwork.Devnet
  const endpoint = useMemo(() => clusterApiUrl(network), [network])
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new LedgerWalletAdapter()
    ],
    []
  )

  return (
    <ErrorBoundary>
      <ConnectionProvider endpoint={endpoint}>
        <SolanaWalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>
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
      </ConnectionProvider>
    </ErrorBoundary>
  )
}

export default App
