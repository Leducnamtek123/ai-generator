import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWorkflowExecutions1777700000000 implements MigrationInterface {
  name = 'AddWorkflowExecutions1777700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "workflow" ADD COLUMN IF NOT EXISTS "lastExecution" jsonb`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "workflow_execution" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "workflowId" uuid NOT NULL,
        "runId" text NOT NULL,
        "jobId" text,
        "userId" text NOT NULL,
        "projectId" uuid,
        "graph" jsonb NOT NULL DEFAULT '{}',
        "nodeStates" jsonb NOT NULL DEFAULT '[]',
        "status" text NOT NULL,
        "error" text,
        "startedAt" TIMESTAMP,
        "completedAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_workflow_execution_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_workflow_execution_workflow_run" ON "workflow_execution" ("workflowId", "runId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_workflow_execution_user_id" ON "workflow_execution" ("userId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_workflow_execution_project_id" ON "workflow_execution" ("projectId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_workflow_execution_project_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_workflow_execution_user_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_workflow_execution_workflow_run"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "workflow_execution"`);
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "workflow" DROP COLUMN IF EXISTS "lastExecution"`,
    );
  }
}
