import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWorkspacesMultitenant1771411785982
  implements MigrationInterface
{
  name = 'AddWorkspacesMultitenant1771411785982';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasWorkspaceTable = await queryRunner.hasTable('workspace');
    const hasOrganizationTable = await queryRunner.hasTable('organization');

    if (hasWorkspaceTable || hasOrganizationTable) {
      return;
    }

    // Create WorkspaceRole enum type
    const hasWorkspaceRoleEnum = await queryRunner.query(
      `SELECT to_regtype('public.workspace_role_enum') IS NOT NULL AS "exists"`,
    );
    if (!hasWorkspaceRoleEnum[0]?.exists) {
      await queryRunner.query(
        `CREATE TYPE "workspace_role_enum" AS ENUM('ADMIN', 'MEMBER', 'BILLING')`,
      );
    }

    // Create workspace table
    await queryRunner.query(`
      CREATE TABLE "workspace" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "slug" character varying NOT NULL,
        "url" character varying,
        "description" text,
        "domain" character varying,
        "should_attach_users_by_domain" boolean NOT NULL DEFAULT false,
        "avatar_url" character varying,
        "owner_id" integer NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_workspace_slug" UNIQUE ("slug"),
        CONSTRAINT "UQ_workspace_domain" UNIQUE ("domain"),
        CONSTRAINT "PK_workspace" PRIMARY KEY ("id")
      )
    `);

    // Create member table
    await queryRunner.query(`
      CREATE TABLE "member" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" integer NOT NULL,
        "workspace_id" uuid NOT NULL,
        "role" "workspace_role_enum" NOT NULL DEFAULT 'MEMBER',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_member_user_workspace" UNIQUE ("user_id", "workspace_id"),
        CONSTRAINT "PK_member" PRIMARY KEY ("id")
      )
    `);

    // Create invite table
    await queryRunner.query(`
      CREATE TABLE "invite" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "author_id" integer,
        "workspace_id" uuid NOT NULL,
        "email" character varying NOT NULL,
        "role" "workspace_role_enum" NOT NULL DEFAULT 'MEMBER',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_invite_workspace_email" UNIQUE ("workspace_id", "email"),
        CONSTRAINT "PK_invite" PRIMARY KEY ("id")
      )
    `);

    // Create indexes
    await queryRunner.query(
      `CREATE INDEX "IDX_workspace_slug" ON "workspace" ("slug")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_invite_email" ON "invite" ("email")`,
    );

    // Add foreign keys
    await queryRunner.query(`
      ALTER TABLE "member"
        ADD CONSTRAINT "FK_member_workspace"
        FOREIGN KEY ("workspace_id")
        REFERENCES "workspace"("id")
        ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "invite"
        ADD CONSTRAINT "FK_invite_workspace"
        FOREIGN KEY ("workspace_id")
        REFERENCES "workspace"("id")
        ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    // Add workspace_id to project table (nullable for backward compat)
    await queryRunner.query(`
      ALTER TABLE "project"
        ADD COLUMN "workspace_id" uuid,
        ADD COLUMN "owner_member_id" uuid
    `);

    await queryRunner.query(`
      ALTER TABLE "project"
        ADD CONSTRAINT "FK_project_workspace"
        FOREIGN KEY ("workspace_id")
        REFERENCES "workspace"("id")
        ON DELETE SET NULL ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasWorkspaceTable = await queryRunner.hasTable('workspace');
    const hasOrganizationTable = await queryRunner.hasTable('organization');

    if (!hasWorkspaceTable || hasOrganizationTable) {
      return;
    }

    await queryRunner.query(
      `ALTER TABLE "project" DROP CONSTRAINT IF EXISTS "FK_project_workspace"`,
    );
    await queryRunner.query(
      `ALTER TABLE "project" DROP COLUMN IF EXISTS "owner_member_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "project" DROP COLUMN IF EXISTS "workspace_id"`,
    );

    await queryRunner.query(
      `ALTER TABLE "invite" DROP CONSTRAINT IF EXISTS "FK_invite_workspace"`,
    );
    await queryRunner.query(
      `ALTER TABLE "member" DROP CONSTRAINT IF EXISTS "FK_member_workspace"`,
    );

    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_invite_email"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_workspace_slug"`);

    await queryRunner.query(`DROP TABLE IF EXISTS "invite"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "member"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "workspace"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "workspace_role_enum"`);
  }
}
