import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCreditLedgerStatus1777300000000 implements MigrationInterface {
  name = 'AddCreditLedgerStatus1777300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "credit_transaction" ADD COLUMN IF NOT EXISTS "status" character varying NOT NULL DEFAULT 'posted'`,
    );
    await queryRunner.query(
      `ALTER TABLE "credit_transaction" ADD COLUMN IF NOT EXISTS "referenceType" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "credit_transaction" ADD COLUMN IF NOT EXISTS "referenceId" character varying`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_credit_transaction_user_id_status" ON "credit_transaction" ("userId", "status")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_credit_transaction_user_id_status"`,
    );
    await queryRunner.query(
      `ALTER TABLE "credit_transaction" DROP COLUMN IF EXISTS "referenceId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "credit_transaction" DROP COLUMN IF EXISTS "referenceType"`,
    );
    await queryRunner.query(
      `ALTER TABLE "credit_transaction" DROP COLUMN IF EXISTS "status"`,
    );
  }
}
