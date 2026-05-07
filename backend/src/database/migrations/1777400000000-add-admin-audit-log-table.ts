import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAdminAuditLogTable1777400000000 implements MigrationInterface {
  name = 'AddAdminAuditLogTable1777400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "admin_audit_log" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "actorId" integer NOT NULL, "actorEmail" text, "actorRole" text, "action" character varying NOT NULL, "entityType" character varying NOT NULL, "entityId" text, "entityName" text, "before" jsonb, "after" jsonb, "meta" jsonb, "success" boolean NOT NULL DEFAULT true, "error" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_admin_audit_log_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_admin_audit_log_actor_id" ON "admin_audit_log" ("actorId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_admin_audit_log_action" ON "admin_audit_log" ("action") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_admin_audit_log_entity_type" ON "admin_audit_log" ("entityType") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_admin_audit_log_created_at" ON "admin_audit_log" ("createdAt") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_admin_audit_log_created_at"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_admin_audit_log_entity_type"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_admin_audit_log_action"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_admin_audit_log_actor_id"`,
    );
    await queryRunner.query(`DROP TABLE "admin_audit_log"`);
  }
}
