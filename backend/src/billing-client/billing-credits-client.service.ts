import { Injectable } from '@nestjs/common';
import axios from 'axios';

export interface CreditMutationResponse {
  success: boolean;
  balance: number;
  amount?: number;
  transactionId?: string;
  status?: 'pending' | 'posted' | 'reversed';
}

@Injectable()
export class BillingCreditsClientService {
  private readonly baseURLs: string[];

  constructor() {
    this.baseURLs = this.resolveBaseURLs();
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

  async captureCredits(userId: string, transactionId: string, metadata?: any) {
    return this.request<CreditMutationResponse>('/credits/capture', {
      userId,
      transactionId,
      metadata,
    });
  }

  async releaseCredits(userId: string, transactionId: string, metadata?: any) {
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
    let lastError: unknown;

    for (const baseURL of this.baseURLs) {
      try {
        const client = axios.create({
          baseURL,
          timeout: 30000,
          headers: {
            Accept: 'application/json',
          },
        });

        const response = await client.post<T>(path, body);
        return response.data;
      } catch (error) {
        lastError = error;

        if (this.hasResponse(error) || baseURL === this.baseURLs.at(-1)) {
          throw error;
        }
      }
    }

    throw lastError;
  }

  private hasResponse(error: unknown): boolean {
    if (typeof error !== 'object' || error === null) {
      return false;
    }

    return Boolean((error as { response?: unknown }).response);
  }

  private resolveBaseURLs(): string[] {
    return [
      ...new Set(
        [
          process.env.BILLING_SERVICE_URL,
          process.env.BILLING_API_URL,
          'http://billing-service:8001/api/v1',
          'http://localhost:8001/api/v1',
        ].filter((value): value is string => Boolean(value)),
      ),
    ];
  }
}
