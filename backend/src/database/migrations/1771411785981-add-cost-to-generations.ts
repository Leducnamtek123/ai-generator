import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCostToGenerations1771411785981 implements MigrationInterface {
  name = 'AddCostToGenerations1771411785981';

  public async up(queryRunner: QueryRunner): Promise<void> {
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
    await queryRunner.query(`ALTER TABLE "workflow" DROP COLUMN "visibility"`);
    await queryRunner.query(`ALTER TABLE "project" DROP COLUMN "content"`);
    await queryRunner.query(`ALTER TABLE "project" DROP COLUMN "thumbnail"`);
    await queryRunner.query(
      `ALTER TABLE "generation" DROP COLUMN "providerCost"`,
    );
    await queryRunner.query(`ALTER TABLE "generation" DROP COLUMN "cost"`);
    await queryRunner.query(`ALTER TABLE "project" DROP COLUMN "visibility"`);
    await queryRunner.query(
      `ALTER TABLE "project" ADD "visibility" character varying NOT NULL DEFAULT 'private'`,
    );
    await queryRunner.query(
      `ALTER TABLE "workflow" ADD "visibility" character varying NOT NULL DEFAULT 'private'`,
    );
    await queryRunner.query(
      `ALTER TABLE "project" ADD "thumbnail" character varying`,
    );
    await queryRunner.query(`ALTER TABLE "project" ADD "content" jsonb`);
  }
}
