import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrganizationsMultitenant1771411785982
  implements MigrationInterface
{
  name = 'AddOrganizationsMultitenant1771411785982';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create OrgRole enum type
    await queryRunner.query(
      `CREATE TYPE "org_role_enum" AS ENUM('ADMIN', 'MEMBER', 'BILLING')`,
    );

    // Create organization table
    await queryRunner.query(`
      CREATE TABLE "organization" (
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
        CONSTRAINT "UQ_organization_slug" UNIQUE ("slug"),
        CONSTRAINT "UQ_organization_domain" UNIQUE ("domain"),
        CONSTRAINT "PK_organization" PRIMARY KEY ("id")
      )
    `);

    // Create member table
    await queryRunner.query(`
      CREATE TABLE "member" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" integer NOT NULL,
        "organization_id" uuid NOT NULL,
        "role" "org_role_enum" NOT NULL DEFAULT 'MEMBER',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_member_user_org" UNIQUE ("user_id", "organization_id"),
        CONSTRAINT "PK_member" PRIMARY KEY ("id")
      )
    `);

    // Create invite table
    await queryRunner.query(`
      CREATE TABLE "invite" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "author_id" integer,
        "organization_id" uuid NOT NULL,
        "email" character varying NOT NULL,
        "role" "org_role_enum" NOT NULL DEFAULT 'MEMBER',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_invite_org_email" UNIQUE ("organization_id", "email"),
        CONSTRAINT "PK_invite" PRIMARY KEY ("id")
      )
    `);

    // Create indexes
    await queryRunner.query(
      `CREATE INDEX "IDX_organization_slug" ON "organization" ("slug")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_invite_email" ON "invite" ("email")`,
    );

    // Add foreign keys
    await queryRunner.query(`
      ALTER TABLE "member"
        ADD CONSTRAINT "FK_member_organization"
        FOREIGN KEY ("organization_id")
        REFERENCES "organization"("id")
        ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "invite"
        ADD CONSTRAINT "FK_invite_organization"
        FOREIGN KEY ("organization_id")
        REFERENCES "organization"("id")
        ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    // Add organization_id to project table (nullable for backward compat)
    await queryRunner.query(`
      ALTER TABLE "project"
        ADD COLUMN "organization_id" uuid,
        ADD COLUMN "owner_member_id" uuid
    `);

    await queryRunner.query(`
      ALTER TABLE "project"
        ADD CONSTRAINT "FK_project_organization"
        FOREIGN KEY ("organization_id")
        REFERENCES "organization"("id")
        ON DELETE SET NULL ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "project" DROP CONSTRAINT IF EXISTS "FK_project_organization"`,
    );
    await queryRunner.query(
      `ALTER TABLE "project" DROP COLUMN IF EXISTS "owner_member_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "project" DROP COLUMN IF EXISTS "organization_id"`,
    );

    await queryRunner.query(
      `ALTER TABLE "invite" DROP CONSTRAINT IF EXISTS "FK_invite_organization"`,
    );
    await queryRunner.query(
      `ALTER TABLE "member" DROP CONSTRAINT IF EXISTS "FK_member_organization"`,
    );

    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_invite_email"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_organization_slug"`);

    await queryRunner.query(`DROP TABLE IF EXISTS "invite"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "member"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "organization"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "org_role_enum"`);
  }
}
