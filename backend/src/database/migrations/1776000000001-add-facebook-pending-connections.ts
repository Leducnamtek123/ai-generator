import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFacebookPendingConnections1776000000001
  implements MigrationInterface
{
  name = 'AddFacebookPendingConnections1776000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "facebook_pending_connection" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "platform" character varying NOT NULL DEFAULT 'facebook', "providerUserId" character varying NOT NULL, "providerName" character varying NOT NULL, "providerPicture" character varying, "accessToken" text NOT NULL, "expiresAt" TIMESTAMP, "pages" jsonb NOT NULL DEFAULT '[]', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" integer, CONSTRAINT "PK_facebook_pending_connection_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_facebook_pending_connection_user_id" ON "facebook_pending_connection" ("userId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "facebook_pending_connection" ADD CONSTRAINT "FK_facebook_pending_connection_user_id" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "facebook_pending_connection" DROP CONSTRAINT "FK_facebook_pending_connection_user_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_facebook_pending_connection_user_id"`,
    );
    await queryRunner.query(`DROP TABLE "facebook_pending_connection"`);
  }
}
