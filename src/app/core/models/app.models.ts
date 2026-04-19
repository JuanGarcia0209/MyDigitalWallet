export type CardBrand = 'visa' | 'mastercard' | 'unknown';

export interface AppUser {
  uid: string;
  firstName: string;
  lastName: string;
  documentType: string;
  documentNumber: string;
  country: string;
  email: string;
  quickBiometricEnabled?: boolean;
  createdAt?: string;
}

export interface WalletCard {
  id?: string;
  uid: string;
  holderName: string;
  cardNumber: string;
  maskedNumber: string;
  expiry: string;
  brand: CardBrand;
  createdAt: string;
}

export interface WalletTransaction {
  id?: string;
  uid: string;
  cardId: string;
  merchant: string;
  amount: number;
  date: string;
  emoji?: string;
}
