import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCostToGenerations1771411785981 implements MigrationInterface {
  name = 'AddCostToGenerations1771411785981';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "project" DROP COLUMN "content"`);
    await queryRunner.query(`ALTER TABLE "project" DROP COLUMN "thumbnail"`);
    await queryRunner.query(`ALTER TABLE "workflow" DROP COLUMN "visibility"`);
    await queryRunner.query(`ALTER TABLE "project" DROP COLUMN "visibility"`);
    await queryRunner.query(
      `ALTER TABLE "project" ADD "visibility" character varying NOT NULL DEFAULT 'private'`,
    );
    await queryRunner.query(
      `ALTER TABLE "generation" ADD "cost" double precision NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "generation" ADD "providerCost" double precision`,
    );
    await queryRunner.query(
      `ALTER TABLE "project" ADD "thumbnail" character varying`,
    );
    await queryRunner.query(`ALTER TABLE "project" ADD "content" jsonb`);
    await queryRunner.query(
      `ALTER TABLE "workflow" ADD "visibility" character varying NOT NULL DEFAULT 'private'`,
    );
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
