import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVoiceTemplateTable1777200000000 implements MigrationInterface {
  name = 'AddVoiceTemplateTable1777200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "voice_template" (
        "id"             uuid              NOT NULL DEFAULT uuid_generate_v4(),
        "userId"         character varying NOT NULL,
        "name"           character varying NOT NULL,
        "description"    text,
        "audioPath"      character varying,
        "referenceText"  text,
        "voice"          character varying,
        "model"          character varying,
        "speed"          double precision,
        "duration"       double precision,
        "provider"       character varying NOT NULL DEFAULT 'openai',
        "createdAt"      TIMESTAMP         NOT NULL DEFAULT now(),
        "updatedAt"      TIMESTAMP         NOT NULL DEFAULT now(),
        CONSTRAINT "PK_voice_template_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_voice_template_name" UNIQUE ("name")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_voice_template_userId" ON "voice_template" ("userId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_voice_template_userId"`);
    await queryRunner.query(`DROP TABLE "voice_template"`);
  }
}
