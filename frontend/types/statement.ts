// types/statement.ts

export interface Transaction {
  date: string;
  merchant: string;
  amount: number;
}

export interface StatementData {
  issuer_name: string;
  card_variant_last4: string;
  billing_cycle_dates: string;
  payment_due_date: string;
  total_new_balance: number;
  transactions?: Transaction[];
  id?: string;
  uploaded_at?: string;
  filename?: string;
}