import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVisualFlowTables1777000000000 implements MigrationInterface {
  name = 'AddVisualFlowTables1777000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ─────────────────────────────────────────────
    // visual_project
    // ─────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "visual_project" (
        "id"          uuid                NOT NULL DEFAULT uuid_generate_v4(),
        "userId"      character varying   NOT NULL,
        "name"        character varying   NOT NULL,
        "story"       text,
        "thumbnailUrl" character varying,
        "language"    character varying   NOT NULL DEFAULT 'en',
        "status"      character varying   NOT NULL DEFAULT 'ACTIVE',
        "createdAt"   TIMESTAMP           NOT NULL DEFAULT now(),
        "updatedAt"   TIMESTAMP           NOT NULL DEFAULT now(),
        "deletedAt"   TIMESTAMP,
        CONSTRAINT "PK_visual_project_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_visual_project_userId" ON "visual_project" ("userId")`,
    );

    // ─────────────────────────────────────────────
    // visual_character
    // ─────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "visual_character" (
        "id"               uuid              NOT NULL DEFAULT uuid_generate_v4(),
        "projectId"        uuid              NOT NULL,
        "name"             character varying NOT NULL,
        "entityType"       character varying NOT NULL DEFAULT 'character',
        "description"      text,
        "voiceDescription" text,
        "referenceImageUrl" character varying,
        "mediaId"          character varying,
        "refStatus"        character varying NOT NULL DEFAULT 'PENDING',
        "createdAt"        TIMESTAMP         NOT NULL DEFAULT now(),
        "updatedAt"        TIMESTAMP         NOT NULL DEFAULT now(),
        CONSTRAINT "PK_visual_character_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_visual_character_projectId" ON "visual_character" ("projectId")`,
    );
    await queryRunner.query(`
      ALTER TABLE "visual_character"
        ADD CONSTRAINT "FK_visual_character_project"
        FOREIGN KEY ("projectId") REFERENCES "visual_project"("id") ON DELETE CASCADE
    `);

    // ─────────────────────────────────────────────
    // visual_video
    // ─────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "visual_video" (
        "id"           uuid              NOT NULL DEFAULT uuid_generate_v4(),
        "projectId"    uuid              NOT NULL,
        "title"        character varying NOT NULL,
        "description"  text,
        "displayOrder" integer           NOT NULL DEFAULT 0,
        "status"       character varying NOT NULL DEFAULT 'DRAFT',
        "verticalUrl"  character varying,
        "horizontalUrl" character varying,
        "thumbnailUrl" character varying,
        "duration"     double precision,
        "createdAt"    TIMESTAMP         NOT NULL DEFAULT now(),
        "updatedAt"    TIMESTAMP         NOT NULL DEFAULT now(),
        "deletedAt"    TIMESTAMP,
        CONSTRAINT "PK_visual_video_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_visual_video_projectId" ON "visual_video" ("projectId")`,
    );
    await queryRunner.query(`
      ALTER TABLE "visual_video"
        ADD CONSTRAINT "FK_visual_video_project"
        FOREIGN KEY ("projectId") REFERENCES "visual_project"("id") ON DELETE CASCADE
    `);

    // ─────────────────────────────────────────────
    // visual_scene
    // ─────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "visual_scene" (
        "id"                     uuid              NOT NULL DEFAULT uuid_generate_v4(),
        "videoId"                uuid              NOT NULL,
        "displayOrder"           integer           NOT NULL DEFAULT 0,
        "prompt"                 text,
        "videoPrompt"            text,
        "characterNames"         jsonb             DEFAULT '[]',
        "parentSceneId"          uuid,
        "chainType"              character varying NOT NULL DEFAULT 'ROOT',
        "verticalImageUrl"       character varying,
        "verticalVideoUrl"       character varying,
        "verticalMediaId"        character varying,
        "verticalImageStatus"    character varying NOT NULL DEFAULT 'PENDING',
        "verticalVideoStatus"    character varying NOT NULL DEFAULT 'PENDING',
        "horizontalImageUrl"     character varying,
        "horizontalVideoUrl"     character varying,
        "horizontalMediaId"      character varying,
        "horizontalImageStatus"  character varying NOT NULL DEFAULT 'PENDING',
        "horizontalVideoStatus"  character varying NOT NULL DEFAULT 'PENDING',
        "trimStart"              double precision,
        "trimEnd"                double precision,
        "duration"               double precision,
        "createdAt"              TIMESTAMP         NOT NULL DEFAULT now(),
        "updatedAt"              TIMESTAMP         NOT NULL DEFAULT now(),
        CONSTRAINT "PK_visual_scene_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_visual_scene_videoId" ON "visual_scene" ("videoId")`,
    );
    await queryRunner.query(`
      ALTER TABLE "visual_scene"
        ADD CONSTRAINT "FK_visual_scene_video"
        FOREIGN KEY ("videoId") REFERENCES "visual_video"("id") ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop in reverse order of dependencies
    await queryRunner.query(
      `ALTER TABLE "visual_scene" DROP CONSTRAINT "FK_visual_scene_video"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_visual_scene_videoId"`);
    await queryRunner.query(`DROP TABLE "visual_scene"`);

    await queryRunner.query(
      `ALTER TABLE "visual_video" DROP CONSTRAINT "FK_visual_video_project"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_visual_video_projectId"`);
    await queryRunner.query(`DROP TABLE "visual_video"`);

    await queryRunner.query(
      `ALTER TABLE "visual_character" DROP CONSTRAINT "FK_visual_character_project"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_visual_character_projectId"`,
    );
    await queryRunner.query(`DROP TABLE "visual_character"`);

    await queryRunner.query(`DROP INDEX "public"."IDX_visual_project_userId"`);
    await queryRunner.query(`DROP TABLE "visual_project"`);
  }
}
