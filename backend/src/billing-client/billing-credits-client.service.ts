import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';

export interface CreditMutationResponse {
  success: boolean;
  balance: number;
  amount?: number;
  transactionId?: string;
  status?: 'pending' | 'posted' | 'reversed';
}

@Injectable()
export class BillingCreditsClientService {
  private readonly client: AxiosInstance;

  constructor() {
    const baseURL =
      process.env.BILLING_SERVICE_URL ||
      process.env.BILLING_API_URL ||
      'http://localhost:8001/api/v1';

    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        Accept: 'application/json',
      },
    });
  }

  async reserveCredits(
    userId: string,
    amount: number,
    metadata?: any,
    referenceType?: string,
    referenceId?: string,
  ) {
    return this.request<CreditMutationResponse>('/credits/reserve', {
      userId,
      amount,
      metadata,
      referenceType,
      referenceId,
    });
  }

  async captureCredits(
    userId: string,
    transactionId: string,
    metadata?: any,
  ) {
    return this.request<CreditMutationResponse>('/credits/capture', {
      userId,
      transactionId,
      metadata,
    });
  }

  async releaseCredits(
    userId: string,
    transactionId: string,
    metadata?: any,
  ) {
    return this.request<CreditMutationResponse>('/credits/release', {
      userId,
      transactionId,
      metadata,
    });
  }

  async refundCredits(userId: string, amount: number, metadata?: any) {
    return this.request<CreditMutationResponse>('/credits/refund', {
      userId,
      amount,
      metadata,
    });
  }

  async deductCredits(
    userId: string,
    amount: number,
    metadata?: any,
    referenceType?: string,
    referenceId?: string,
  ) {
    return this.reserveCredits(
      userId,
      amount,
      metadata,
      referenceType,
      referenceId,
    );
  }

  private async request<T>(path: string, body: Record<string, unknown>) {
    const response = await this.client.post<T>(path, body);
    return response.data;
  }
}
