import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBillingPlanWallet1777500000000 implements MigrationInterface {
  name = 'AddBillingPlanWallet1777500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "billing_account" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "scopeType" character varying NOT NULL, "scopeId" character varying NOT NULL, "currentPlanId" character varying, "status" character varying NOT NULL DEFAULT 'free', "includedCreditsGranted" integer NOT NULL DEFAULT 0, "includedCreditsRemaining" integer NOT NULL DEFAULT 0, "topUpCreditsPurchased" integer NOT NULL DEFAULT 0, "topUpCreditsBalance" integer NOT NULL DEFAULT 0, "currentPeriodStart" TIMESTAMP, "currentPeriodEnd" TIMESTAMP, "renewalAt" TIMESTAMP, "metadata" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_billing_account_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_billing_account_scope" ON "billing_account" ("scopeType", "scopeId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_order" ADD COLUMN IF NOT EXISTS "purchaseType" character varying NOT NULL DEFAULT 'topup'`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_order" ADD COLUMN IF NOT EXISTS "planId" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_order" ADD COLUMN IF NOT EXISTS "topUpPackageId" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_order" ADD COLUMN IF NOT EXISTS "scopeType" character varying NOT NULL DEFAULT 'user'`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_order" ADD COLUMN IF NOT EXISTS "scopeId" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "credit_transaction" ADD COLUMN IF NOT EXISTS "scopeType" character varying NOT NULL DEFAULT 'user'`,
    );
    await queryRunner.query(
      `ALTER TABLE "credit_transaction" ADD COLUMN IF NOT EXISTS "scopeId" character varying`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_credit_transaction_scope_type" ON "credit_transaction" ("scopeType")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_credit_transaction_scope_id" ON "credit_transaction" ("scopeId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_credit_transaction_scope_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_credit_transaction_scope_type"`,
    );
    await queryRunner.query(
      `ALTER TABLE "credit_transaction" DROP COLUMN IF EXISTS "scopeId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "credit_transaction" DROP COLUMN IF EXISTS "scopeType"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_order" DROP COLUMN IF EXISTS "scopeId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_order" DROP COLUMN IF EXISTS "scopeType"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_order" DROP COLUMN IF EXISTS "topUpPackageId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_order" DROP COLUMN IF EXISTS "planId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_order" DROP COLUMN IF EXISTS "purchaseType"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_billing_account_scope"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "billing_account"`);
  }
}
