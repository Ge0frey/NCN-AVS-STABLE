import { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react';
import { PublicKey } from '@solana/web3.js';
import { CivicAuth, CivicWallet } from '@civic/auth-web3/react';
import toast from 'react-hot-toast';

// Define your Civic Auth client ID
// Replace this with your actual Client ID from auth.civic.com dashboard
const CIVIC_CLIENT_ID = import.meta.env.VITE_CIVIC_CLIENT_ID || 'YOUR_CIVIC_CLIENT_ID';

interface CivicAuthContextProps {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any | null;
  embeddedWallet: CivicWallet | null;
  embeddedWalletPublicKey: PublicKey | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  getAuthToken: () => Promise<string | null>;
}

const CivicAuthContext = createContext<CivicAuthContextProps | undefined>(undefined);

export function CivicAuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [user, setUser] = useState<any | null>(null);
  const [embeddedWallet, setEmbeddedWallet] = useState<CivicWallet | null>(null);
  const [embeddedWalletPublicKey, setEmbeddedWalletPublicKey] = useState<PublicKey | null>(null);
  const [authInstance, setAuthInstance] = useState<CivicAuth | null>(null);

  // Initialize Civic Auth
  useEffect(() => {
    const initCivicAuth = async () => {
      try {
        // Initialize the Civic Auth instance
        const auth = new CivicAuth({
          clientId: CIVIC_CLIENT_ID,
        });
        
        setAuthInstance(auth);
        
        // Check if user is already signed in
        const isSignedIn = await auth.isSignedIn();
        setIsAuthenticated(isSignedIn);
        
        if (isSignedIn) {
          // Get user data
          const userData = await auth.getUserData();
          setUser(userData);
          
          // Get embedded wallet
          const wallet = await auth.getEmbeddedWallet();
          setEmbeddedWallet(wallet);
          
          if (wallet) {
            const publicKey = wallet.getPublicKey();
            setEmbeddedWalletPublicKey(new PublicKey(publicKey));
          }
        }
      } catch (error) {
        console.error('Error initializing Civic Auth:', error);
        toast.error('Failed to initialize authentication');
      } finally {
        setIsLoading(false);
      }
    };
    
    initCivicAuth();
  }, []);

  // Login with Civic Auth
  const login = useCallback(async () => {
    if (!authInstance) {
      toast.error('Authentication system not initialized');
      return;
    }
    
    try {
      setIsLoading(true);
      await authInstance.signIn();
      
      // Check if user is signed in after the sign-in process
      const isSignedIn = await authInstance.isSignedIn();
      setIsAuthenticated(isSignedIn);
      
      if (isSignedIn) {
        // Get user data
        const userData = await authInstance.getUserData();
        setUser(userData);
        
        // Get embedded wallet
        const wallet = await authInstance.getEmbeddedWallet();
        setEmbeddedWallet(wallet);
        
        if (wallet) {
          const publicKey = wallet.getPublicKey();
          setEmbeddedWalletPublicKey(new PublicKey(publicKey));
          toast.success('Successfully signed in with Civic Auth');
        }
      }
    } catch (error) {
      console.error('Error signing in with Civic Auth:', error);
      toast.error('Failed to sign in');
    } finally {
      setIsLoading(false);
    }
  }, [authInstance]);

  // Logout from Civic Auth
  const logout = useCallback(async () => {
    if (!authInstance) {
      return;
    }
    
    try {
      setIsLoading(true);
      await authInstance.signOut();
      setIsAuthenticated(false);
      setUser(null);
      setEmbeddedWallet(null);
      setEmbeddedWalletPublicKey(null);
      toast.success('Successfully signed out');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
    } finally {
      setIsLoading(false);
    }
  }, [authInstance]);

  // Get auth token for API calls
  const getAuthToken = useCallback(async (): Promise<string | null> => {
    if (!authInstance || !isAuthenticated) {
      return null;
    }
    
    try {
      const token = await authInstance.getAuthToken();
      return token;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }, [authInstance, isAuthenticated]);

  const value = {
    isAuthenticated,
    isLoading,
    user,
    embeddedWallet,
    embeddedWalletPublicKey,
    login,
    logout,
    getAuthToken,
  };

  return (
    <CivicAuthContext.Provider value={value}>
      {children}
    </CivicAuthContext.Provider>
  );
}

export const useCivicAuth = () => {
  const context = useContext(CivicAuthContext);
  if (context === undefined) {
    throw new Error('useCivicAuth must be used within a CivicAuthProvider');
  }
  return context;
}; 