import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSiteConfigTable1777700000000 implements MigrationInterface {
  name = 'AddSiteConfigTable1777700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "site_config" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "key" text NOT NULL, "locale" text NOT NULL, "value" jsonb NOT NULL DEFAULT '{}', "description" text, "updatedById" integer, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_site_config_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_site_config_key_locale" ON "site_config" ("key", "locale") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_site_config_key" ON "site_config" ("key") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_site_config_key"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_site_config_key_locale"`);
    await queryRunner.query(`DROP TABLE "site_config"`);
  }
}
