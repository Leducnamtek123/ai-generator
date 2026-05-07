import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCostToGenerations1771411785981 implements MigrationInterface {
  name = 'AddCostToGenerations1771411785981';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF to_regclass('public.generation') IS NULL THEN
          CREATE TABLE "generation" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "userId" character varying NOT NULL,
            "type" character varying NOT NULL,
            "status" character varying NOT NULL DEFAULT 'pending',
            "prompt" text NOT NULL,
            "model" character varying,
            "resultUrl" text,
            "thumbnailUrl" text,
            "error" text,
            "cost" double precision NOT NULL DEFAULT 0,
            "providerCost" double precision,
            "metadata" jsonb,
            "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
            "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
            "deletedAt" TIMESTAMP,
            CONSTRAINT "PK_generation_id" PRIMARY KEY ("id")
          );

          CREATE INDEX "IDX_generation_user_id" ON "generation" ("userId");
          CREATE INDEX "IDX_generation_status" ON "generation" ("status");
        END IF;
      END $$;
    `);

    await queryRunner.query(`ALTER TABLE "project" DROP COLUMN IF EXISTS "content"`);
    await queryRunner.query(`ALTER TABLE "project" DROP COLUMN IF EXISTS "thumbnail"`);
    
    // Check and add if missing
    await queryRunner.query(`
      DO $$
      BEGIN
        BEGIN
          ALTER TABLE "generation" ADD COLUMN "cost" double precision NOT NULL DEFAULT '0';
        EXCEPTION
          WHEN duplicate_column THEN null;
        END;
        BEGIN
          ALTER TABLE "generation" ADD COLUMN "providerCost" double precision;
        EXCEPTION
          WHEN duplicate_column THEN null;
        END;
        BEGIN
          ALTER TABLE "project" ADD COLUMN "thumbnail" character varying;
        EXCEPTION
          WHEN duplicate_column THEN null;
        END;
        BEGIN
          ALTER TABLE "project" ADD COLUMN "content" jsonb;
        EXCEPTION
          WHEN duplicate_column THEN null;
        END;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE IF EXISTS "workflow" DROP COLUMN IF EXISTS "visibility"`);
    await queryRunner.query(`ALTER TABLE IF EXISTS "project" DROP COLUMN IF EXISTS "content"`);
    await queryRunner.query(`ALTER TABLE IF EXISTS "project" DROP COLUMN IF EXISTS "thumbnail"`);
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "generation" DROP COLUMN IF EXISTS "providerCost"`,
    );
    await queryRunner.query(`ALTER TABLE IF EXISTS "generation" DROP COLUMN IF EXISTS "cost"`);
    await queryRunner.query(`ALTER TABLE IF EXISTS "project" DROP COLUMN IF EXISTS "visibility"`);
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "project" ADD "visibility" character varying NOT NULL DEFAULT 'private'`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "workflow" ADD "visibility" character varying NOT NULL DEFAULT 'private'`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "project" ADD "thumbnail" character varying`,
    );
    await queryRunner.query(`ALTER TABLE IF EXISTS "project" ADD "content" jsonb`);
  }
}
