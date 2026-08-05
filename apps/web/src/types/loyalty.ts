export interface LoyaltyBalanceResponse {
  status: "SUCCESS" | "ERROR";
  balance?: number;
  message?: string;
}
