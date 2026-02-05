import { MigrationInterface, QueryRunner } from 'typeorm';

export class Initial21770285579831 implements MigrationInterface {
  name = 'Initial21770285579831';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "project" DROP COLUMN "thumbnail"`);
    await queryRunner.query(`ALTER TABLE "workflow" DROP COLUMN "visibility"`);
    await queryRunner.query(`ALTER TABLE "project" DROP COLUMN "visibility"`);
    await queryRunner.query(`ALTER TABLE "workflow" DROP COLUMN "previewUrl"`);
    await queryRunner.query(
      `ALTER TABLE "project" ADD "visibility" character varying NOT NULL DEFAULT 'private'`,
    );
    await queryRunner.query(
      `ALTER TABLE "workflow" ADD "previewUrl" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "project" ADD "thumbnail" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "workflow" ADD "visibility" character varying NOT NULL DEFAULT 'private'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "workflow" DROP COLUMN "visibility"`);
    await queryRunner.query(`ALTER TABLE "project" DROP COLUMN "thumbnail"`);
    await queryRunner.query(`ALTER TABLE "workflow" DROP COLUMN "previewUrl"`);
    await queryRunner.query(`ALTER TABLE "project" DROP COLUMN "visibility"`);
    await queryRunner.query(
      `ALTER TABLE "workflow" ADD "previewUrl" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "project" ADD "visibility" character varying NOT NULL DEFAULT 'private'`,
    );
    await queryRunner.query(
      `ALTER TABLE "workflow" ADD "visibility" character varying NOT NULL DEFAULT 'private'`,
    );
    await queryRunner.query(
      `ALTER TABLE "project" ADD "thumbnail" character varying`,
    );
  }
}
