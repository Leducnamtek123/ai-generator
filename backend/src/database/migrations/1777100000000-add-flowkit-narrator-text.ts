import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFlowkitNarratorText1777100000000 implements MigrationInterface {
  name = 'AddFlowkitNarratorText1777100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add narratorText column for TTS narration pipeline
    await queryRunner.query(`
      ALTER TABLE "visual_scene"
        ADD COLUMN IF NOT EXISTS "narratorText" text
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "visual_scene"
        DROP COLUMN IF EXISTS "narratorText"
    `);
  }
}
