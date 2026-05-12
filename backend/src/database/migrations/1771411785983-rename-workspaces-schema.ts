import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameWorkspacesSchema1771411785983
  implements MigrationInterface
{
  name = 'RenameWorkspacesSchema1771411785983';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasOrganizationTable = await queryRunner.hasTable('organization');
    const hasWorkspaceTable = await queryRunner.hasTable('workspace');

    const hasOrgRoleEnum = await queryRunner.query(
      `SELECT to_regtype('public.org_role_enum') IS NOT NULL AS "exists"`,
    );
    const hasWorkspaceRoleEnum = await queryRunner.query(
      `SELECT to_regtype('public.workspace_role_enum') IS NOT NULL AS "exists"`,
    );

    if (hasOrgRoleEnum[0]?.exists && !hasWorkspaceRoleEnum[0]?.exists) {
      await queryRunner.query(
        `ALTER TYPE "org_role_enum" RENAME TO "workspace_role_enum"`,
      );
    }

    if (hasOrganizationTable && !hasWorkspaceTable) {
      await queryRunner.query(`ALTER TABLE "organization" RENAME TO "workspace"`);
    }

    if (await queryRunner.hasColumn('member', 'organization_id')) {
      await queryRunner.query(
        `ALTER TABLE "member" RENAME COLUMN "organization_id" TO "workspace_id"`,
      );
    }

    if (await queryRunner.hasColumn('invite', 'organization_id')) {
      await queryRunner.query(
        `ALTER TABLE "invite" RENAME COLUMN "organization_id" TO "workspace_id"`,
      );
    }

    if (await queryRunner.hasColumn('project', 'organization_id')) {
      await queryRunner.query(
        `ALTER TABLE "project" RENAME COLUMN "organization_id" TO "workspace_id"`,
      );
    }

    if (await queryRunner.hasColumn('workflow', 'organization_id')) {
      await queryRunner.query(
        `ALTER TABLE "workflow" RENAME COLUMN "organization_id" TO "workspace_id"`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasWorkspaceTable = await queryRunner.hasTable('workspace');
    const hasOrganizationTable = await queryRunner.hasTable('organization');

    const hasWorkspaceRoleEnum = await queryRunner.query(
      `SELECT to_regtype('public.workspace_role_enum') IS NOT NULL AS "exists"`,
    );
    const hasOrgRoleEnum = await queryRunner.query(
      `SELECT to_regtype('public.org_role_enum') IS NOT NULL AS "exists"`,
    );

    if (hasWorkspaceRoleEnum[0]?.exists && !hasOrgRoleEnum[0]?.exists) {
      await queryRunner.query(
        `ALTER TYPE "workspace_role_enum" RENAME TO "org_role_enum"`,
      );
    }

    if (hasWorkspaceTable && !hasOrganizationTable) {
      await queryRunner.query(`ALTER TABLE "workspace" RENAME TO "organization"`);
    }

    if (await queryRunner.hasColumn('workflow', 'workspace_id')) {
      await queryRunner.query(
        `ALTER TABLE "workflow" RENAME COLUMN "workspace_id" TO "organization_id"`,
      );
    }

    if (await queryRunner.hasColumn('project', 'workspace_id')) {
      await queryRunner.query(
        `ALTER TABLE "project" RENAME COLUMN "workspace_id" TO "organization_id"`,
      );
    }

    if (await queryRunner.hasColumn('invite', 'workspace_id')) {
      await queryRunner.query(
        `ALTER TABLE "invite" RENAME COLUMN "workspace_id" TO "organization_id"`,
      );
    }

    if (await queryRunner.hasColumn('member', 'workspace_id')) {
      await queryRunner.query(
        `ALTER TABLE "member" RENAME COLUMN "workspace_id" TO "organization_id"`,
      );
    }

  }
}
