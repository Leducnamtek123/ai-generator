import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddContentToProject1771349292054 implements MigrationInterface {
  name = 'AddContentToProject1771349292054';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        CREATE TYPE "public"."template_type_enum" AS ENUM('image-generator', 'video-generator', 'ai-assistant', 'workflow-editor', 'design-editor', 'image-upscaler', 'video-upscaler', 'voice-generator', 'music-generator', 'sfx-generator', 'icon-generator', 'mockup-generator', 'bg-remover');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF to_regclass('public.template') IS NULL THEN
          CREATE TABLE "template" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "title" character varying NOT NULL,
            "description" character varying,
            "thumbnail" character varying,
            "type" "public"."template_type_enum" NOT NULL DEFAULT 'workflow-editor',
            "visibility" character varying NOT NULL DEFAULT 'private',
            "content" jsonb,
            "authorId" integer,
            "usageCount" integer NOT NULL DEFAULT 0,
            "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
            "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
            "deletedAt" TIMESTAMP,
            CONSTRAINT "PK_template_id" PRIMARY KEY ("id")
          );

          ALTER TABLE "template"
            ADD CONSTRAINT "FK_template_authorId"
            FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);

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
    await queryRunner.query(`ALTER TABLE IF EXISTS "template" DROP COLUMN IF EXISTS "type"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."template_type_enum"`);
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "template" ADD "type" character varying NOT NULL DEFAULT 'workflow'`,
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
