import { MigrationInterface, QueryRunner } from 'typeorm';
import crypto from 'crypto';

type ApiKeyRow = {
  id: string;
  key: string;
};

export class AddApiKeyHashing1777800000000 implements MigrationInterface {
  name = 'AddApiKeyHashing1777800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF to_regclass('public.api_key') IS NULL THEN
          CREATE TABLE "api_key" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "key" character varying NOT NULL,
            "name" text,
            "userId" integer,
            "lastUsedAt" TIMESTAMP,
            "expiresAt" TIMESTAMP,
            "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
            "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
            "deletedAt" TIMESTAMP,
            CONSTRAINT "PK_api_key_id" PRIMARY KEY ("id"),
            CONSTRAINT "UQ_api_key_key" UNIQUE ("key")
          );

          CREATE INDEX "IDX_api_key_user_id" ON "api_key" ("userId");

          ALTER TABLE "api_key"
            ADD CONSTRAINT "FK_api_key_user_id"
            FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);

    await queryRunner.query(
      `ALTER TABLE IF EXISTS "api_key" ADD COLUMN IF NOT EXISTS "keyPrefix" character varying(32)`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "api_key" ADD COLUMN IF NOT EXISTS "keyLast4" character varying(8)`,
    );

    const rows: ApiKeyRow[] = await queryRunner.query(
      `SELECT "id", "key" FROM "api_key"`,
    );

    for (const row of rows) {
      const key = String(row.key);
      const keyPrefix = key.slice(0, 10);
      const keyLast4 = key.slice(-4);
      const keyHash = crypto.createHash('sha256').update(key).digest('hex');

      await queryRunner.query(
        `UPDATE "api_key" SET "key" = $1, "keyPrefix" = $2, "keyLast4" = $3 WHERE "id" = $4`,
        [keyHash, keyPrefix, keyLast4, row.id],
      );
    }

    await queryRunner.query(
      `ALTER TABLE "api_key" ALTER COLUMN "keyPrefix" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "api_key" ALTER COLUMN "keyLast4" SET NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE IF EXISTS "api_key" DROP COLUMN IF EXISTS "keyLast4"`);
    await queryRunner.query(`ALTER TABLE IF EXISTS "api_key" DROP COLUMN IF EXISTS "keyPrefix"`);
  }
}
