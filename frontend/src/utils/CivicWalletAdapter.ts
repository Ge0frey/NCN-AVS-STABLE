import {
  BaseMessageSignerWalletAdapter,
  WalletConnectionError,
  WalletDisconnectionError,
  WalletName,
  WalletNotConnectedError,
  WalletSignTransactionError,
} from '@solana/wallet-adapter-base';
import { PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';
import { CivicWallet } from '@civic/auth-web3/react';

export const CivicWalletName = 'Civic' as WalletName<'Civic'>;

export class CivicWalletAdapter extends BaseMessageSignerWalletAdapter {
  name = CivicWalletName;
  url = 'https://www.civic.com';
  icon = 'https://auth.civic.com/favicon.ico';
  private _connecting: boolean;
  private _wallet: CivicWallet | null;
  private _publicKey: PublicKey | null;
  private _connected: boolean;

  constructor(wallet: CivicWallet | null = null) {
    super();
    this._connecting = false;
    this._wallet = wallet;
    this._publicKey = wallet ? new PublicKey(wallet.getPublicKey()) : null;
    this._connected = !!wallet;
  }

  get publicKey(): PublicKey | null {
    return this._publicKey;
  }

  get connected(): boolean {
    return this._connected;
  }

  get connecting(): boolean {
    return this._connecting;
  }

  // Set the wallet instance
  setWallet(wallet: CivicWallet | null): void {
    this._wallet = wallet;
    this._publicKey = wallet ? new PublicKey(wallet.getPublicKey()) : null;
    this._connected = !!wallet;
    
    if (wallet) {
      this.emit('connect', this._publicKey as PublicKey);
    } else {
      this.emit('disconnect');
    }
  }

  async connect(): Promise<void> {
    try {
      this._connecting = true;
      
      if (!this._wallet) {
        throw new WalletConnectionError('Civic wallet is not available');
      }
      
      if (!this._connected) {
        this._publicKey = new PublicKey(this._wallet.getPublicKey());
        this._connected = true;
        this.emit('connect', this._publicKey);
      }
    } catch (error: any) {
      throw new WalletConnectionError(error?.message, error);
    } finally {
      this._connecting = false;
    }
  }

  async disconnect(): Promise<void> {
    try {
      this._connecting = false;
      this._connected = false;
      this._publicKey = null;
      this.emit('disconnect');
    } catch (error: any) {
      throw new WalletDisconnectionError(error?.message, error);
    }
  }

  async signTransaction<T extends Transaction | VersionedTransaction>(transaction: T): Promise<T> {
    try {
      if (!this._wallet || !this._connected) {
        throw new WalletNotConnectedError('Wallet not connected');
      }
      
      return await this._wallet.signTransaction(transaction) as T;
    } catch (error: any) {
      throw new WalletSignTransactionError(error?.message, error);
    }
  }

  async signAllTransactions<T extends Transaction | VersionedTransaction>(transactions: T[]): Promise<T[]> {
    try {
      if (!this._wallet || !this._connected) {
        throw new WalletNotConnectedError('Wallet not connected');
      }
      
      return await this._wallet.signAllTransactions(transactions) as T[];
    } catch (error: any) {
      throw new WalletSignTransactionError(error?.message, error);
    }
  }

  async signMessage(message: Uint8Array): Promise<Uint8Array> {
    try {
      if (!this._wallet || !this._connected) {
        throw new WalletNotConnectedError('Wallet not connected');
      }
      
      const { signature } = await this._wallet.signMessage(message);
      return signature;
    } catch (error: any) {
      throw new WalletSignTransactionError(error?.message, error);
    }
  }
} 