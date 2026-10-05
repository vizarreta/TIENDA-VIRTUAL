import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { isRetryableTransactionError, TRANSACTION_POLICY } from './transaction-policy';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }

  /**
   * @param operation Trabajo de base de datos sin efectos externos: puede ejecutarse de nuevo.
   * @returns Resultado de la transaccion confirmada, o el ultimo error al agotar reintentos.
   */
  async transaction<T>(operation: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    for (let attempt = 0; ; attempt++) {
      try {
        return await this.$transaction(operation, {
          maxWait: TRANSACTION_POLICY.maxWaitMs,
          timeout: TRANSACTION_POLICY.timeoutMs,
        });
      } catch (error: unknown) {
        if (attempt >= TRANSACTION_POLICY.maxRetries || !isRetryableTransactionError(error))
          throw error;
        await new Promise((resolve) =>
          setTimeout(resolve, TRANSACTION_POLICY.retryDelayMs * (attempt + 1))
        );
      }
    }
  }
}
