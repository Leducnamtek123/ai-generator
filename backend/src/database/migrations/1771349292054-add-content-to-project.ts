import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddContentToProject1771349292054 implements MigrationInterface {
  name = 'AddContentToProject1771349292054';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "project" RENAME COLUMN "visibility" TO "content"`,
    );
    await queryRunner.query(`ALTER TABLE "project" DROP COLUMN "content"`);
    await queryRunner.query(`ALTER TABLE "project" DROP COLUMN "thumbnail"`);
    await queryRunner.query(
      `ALTER TABLE "project" ADD "visibility" character varying NOT NULL DEFAULT 'private'`,
    );
    await queryRunner.query(
      `ALTER TABLE "project" ADD "thumbnail" character varying`,
    );
    await queryRunner.query(`ALTER TABLE "project" ADD "content" jsonb`);
    await queryRunner.query(
      `ALTER TABLE "workflow" ADD "visibility" character varying NOT NULL DEFAULT 'private'`,
    );
    await queryRunner.query(`ALTER TABLE "template" DROP COLUMN "type"`);
    await queryRunner.query(
      `CREATE TYPE "public"."template_type_enum" AS ENUM('image-generator', 'video-generator', 'ai-assistant', 'workflow-editor', 'design-editor', 'image-upscaler', 'video-upscaler', 'voice-generator', 'music-generator', 'sfx-generator', 'icon-generator', 'mockup-generator', 'bg-remover')`,
    );
    await queryRunner.query(
      `ALTER TABLE "template" ADD "type" "public"."template_type_enum" NOT NULL DEFAULT 'workflow-editor'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "template" DROP COLUMN "type"`);
    await queryRunner.query(`DROP TYPE "public"."template_type_enum"`);
    await queryRunner.query(
      `ALTER TABLE "template" ADD "type" character varying NOT NULL DEFAULT 'workflow'`,
    );
    await queryRunner.query(`ALTER TABLE "workflow" DROP COLUMN "visibility"`);
    await queryRunner.query(`ALTER TABLE "project" DROP COLUMN "content"`);
    await queryRunner.query(`ALTER TABLE "project" DROP COLUMN "thumbnail"`);
    await queryRunner.query(`ALTER TABLE "project" DROP COLUMN "visibility"`);
    await queryRunner.query(
      `ALTER TABLE "project" ADD "thumbnail" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "project" ADD "content" character varying NOT NULL DEFAULT 'private'`,
    );
    await queryRunner.query(
      `ALTER TABLE "project" RENAME COLUMN "content" TO "visibility"`,
    );
  }
}
