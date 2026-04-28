import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSocialHubTables1776000000000 implements MigrationInterface {
  name = 'AddSocialHubTables1776000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "social_account" ("id" SERIAL NOT NULL, "platform" character varying NOT NULL, "platformId" character varying NOT NULL, "name" character varying, "username" character varying, "picture" character varying, "accessToken" text NOT NULL, "refreshToken" text, "expiresAt" TIMESTAMP, "metadata" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "userId" integer, CONSTRAINT "PK_social_account_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_social_account_user_id" ON "social_account" ("userId") `,
    );

    await queryRunner.query(
      `CREATE TYPE "public"."social_post_status_enum" AS ENUM('draft', 'scheduled', 'published', 'failed')`,
    );
    await queryRunner.query(
      `CREATE TABLE "social_post" ("id" SERIAL NOT NULL, "content" text NOT NULL, "mediaUrls" jsonb, "status" "public"."social_post_status_enum" NOT NULL DEFAULT 'draft', "scheduledAt" TIMESTAMP, "publishedAt" TIMESTAMP, "error" text, "externalPostId" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "userId" integer, "socialAccountId" integer, CONSTRAINT "PK_social_post_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_social_post_user_id" ON "social_post" ("userId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_social_post_account_id" ON "social_post" ("socialAccountId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_social_post_status" ON "social_post" ("status") `,
    );

    await queryRunner.query(
      `CREATE TABLE "social_post_metric" ("id" SERIAL NOT NULL, "likes" integer NOT NULL DEFAULT '0', "comments" integer NOT NULL DEFAULT '0', "shares" integer NOT NULL DEFAULT '0', "views" integer NOT NULL DEFAULT '0', "rawMetrics" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "postId" integer, CONSTRAINT "PK_social_post_metric_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_social_post_metric_post_id" ON "social_post_metric" ("postId") `,
    );

    await queryRunner.query(
      `ALTER TABLE "social_account" ADD CONSTRAINT "FK_social_account_user_id" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "social_post" ADD CONSTRAINT "FK_social_post_user_id" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "social_post" ADD CONSTRAINT "FK_social_post_account_id" FOREIGN KEY ("socialAccountId") REFERENCES "social_account"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "social_post_metric" ADD CONSTRAINT "FK_social_post_metric_post_id" FOREIGN KEY ("postId") REFERENCES "social_post"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "social_post_metric" DROP CONSTRAINT "FK_social_post_metric_post_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "social_post" DROP CONSTRAINT "FK_social_post_account_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "social_post" DROP CONSTRAINT "FK_social_post_user_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "social_account" DROP CONSTRAINT "FK_social_account_user_id"`,
    );

    await queryRunner.query(
      `DROP INDEX "public"."IDX_social_post_metric_post_id"`,
    );
    await queryRunner.query(`DROP TABLE "social_post_metric"`);

    await queryRunner.query(`DROP INDEX "public"."IDX_social_post_status"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_social_post_account_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_social_post_user_id"`);
    await queryRunner.query(`DROP TABLE "social_post"`);
    await queryRunner.query(`DROP TYPE "public"."social_post_status_enum"`);

    await queryRunner.query(`DROP INDEX "public"."IDX_social_account_user_id"`);
    await queryRunner.query(`DROP TABLE "social_account"`);
  }
}
