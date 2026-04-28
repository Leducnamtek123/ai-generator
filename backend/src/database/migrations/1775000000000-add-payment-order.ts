import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPaymentOrder1775000000000 implements MigrationInterface {
  name = 'AddPaymentOrder1775000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "payment_order" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" character varying NOT NULL, "provider" character varying NOT NULL, "orderCode" character varying NOT NULL, "credits" integer NOT NULL, "amountVnd" integer NOT NULL, "status" character varying NOT NULL DEFAULT 'pending', "paymentUrl" character varying, "providerTxnRef" character varying, "metadata" jsonb, "callbackPayload" jsonb, "paidAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_payment_order_order_code" UNIQUE ("orderCode"), CONSTRAINT "PK_payment_order_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_payment_order_user_id" ON "payment_order" ("userId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_payment_order_order_code" ON "payment_order" ("orderCode") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_payment_order_status" ON "payment_order" ("status") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_payment_order_status"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_payment_order_order_code"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_payment_order_user_id"`);
    await queryRunner.query(`DROP TABLE "payment_order"`);
  }
}
