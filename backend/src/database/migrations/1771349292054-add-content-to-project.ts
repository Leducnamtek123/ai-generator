import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddContentToProject1771349292054 implements MigrationInterface {
  name = 'AddContentToProject1771349292054';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "project" DROP COLUMN IF EXISTS "content"`);
    await queryRunner.query(`ALTER TABLE "project" DROP COLUMN IF EXISTS "thumbnail"`);
    
    await queryRunner.query(`ALTER TABLE "template" DROP COLUMN IF EXISTS "type"`);
    await queryRunner.query(`
      DO $$
      BEGIN
        BEGIN
          CREATE TYPE "public"."template_type_enum" AS ENUM('image-generator', 'video-generator', 'ai-assistant', 'workflow-editor', 'design-editor', 'image-upscaler', 'video-upscaler', 'voice-generator', 'music-generator', 'sfx-generator', 'icon-generator', 'mockup-generator', 'bg-remover');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END;
        BEGIN
          ALTER TABLE "template" ADD "type" "public"."template_type_enum" NOT NULL DEFAULT 'workflow-editor';
        EXCEPTION
          WHEN duplicate_column THEN null;
        END;
        BEGIN
          ALTER TABLE "project" ADD "thumbnail" character varying;
        EXCEPTION
          WHEN duplicate_column THEN null;
        END;
        BEGIN
          ALTER TABLE "project" ADD "content" jsonb;
        EXCEPTION
          WHEN duplicate_column THEN null;
        END;
      END $$;
    `);
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
