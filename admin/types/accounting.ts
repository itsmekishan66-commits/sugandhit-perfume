export interface Account {
  _id: string;
  id: number;
  name: string;
  type: string;
  code?: string;
  description?: string;
  balance?: number;
  createdAt: number;
}

export interface Journal {
  _id: string;
  id: number;
  date: number;
  reference?: string;
  description?: string;
  status?: string;
  entries?: { accountId?: number; accountName?: string; debit?: number; credit?: number }[];
  createdAt: number;
}

export interface AccountingPeriod {
  _id: string;
  id: number;
  name?: string;
  start?: number;
  end?: number;
  status?: string;
  createdAt: number;
}
