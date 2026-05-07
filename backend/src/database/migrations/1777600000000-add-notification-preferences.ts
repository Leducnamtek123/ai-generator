import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNotificationPreferences1777600000000
  implements MigrationInterface
{
  name = 'AddNotificationPreferences1777600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."notification_category_enum" AS ENUM('payment', 'workflow', 'social', 'moderation', 'system')`,
    );
    await queryRunner.query(`
      DO $$
      BEGIN
        IF to_regclass('public.notification') IS NULL THEN
          CREATE TYPE "public"."notification_type_enum" AS ENUM('success', 'info', 'warning', 'error');

          CREATE TABLE "notification" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "userId" integer NOT NULL,
            "title" character varying NOT NULL,
            "message" text NOT NULL,
            "category" "public"."notification_category_enum" NOT NULL DEFAULT 'system',
            "type" "public"."notification_type_enum" NOT NULL DEFAULT 'info',
            "isRead" boolean NOT NULL DEFAULT false,
            "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
            "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT "PK_notification_id" PRIMARY KEY ("id")
          );

          CREATE INDEX "IDX_notification_user_id" ON "notification" ("userId");

          ALTER TABLE "notification"
            ADD CONSTRAINT "FK_notification_user_id"
            FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "notification" ADD COLUMN IF NOT EXISTS "category" "public"."notification_category_enum" NOT NULL DEFAULT 'system'`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."notification_preference_category_enum" AS ENUM('payment', 'workflow', 'social', 'moderation', 'system')`,
    );
    await queryRunner.query(
      `CREATE TABLE "notification_preference" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" integer NOT NULL, "category" "public"."notification_preference_category_enum" NOT NULL, "emailEnabled" boolean NOT NULL DEFAULT true, "inAppEnabled" boolean NOT NULL DEFAULT true, "adminAlertsEnabled" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_notification_preference_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_notification_preference_user_category" ON "notification_preference" ("userId", "category")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_notification_preference_user_category"`,
    );
    await queryRunner.query(`DROP TABLE "notification_preference"`);
    await queryRunner.query(
      `DROP TYPE "public"."notification_preference_category_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "notification" DROP COLUMN IF EXISTS "category"`,
    );
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."notification_category_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."notification_type_enum"`);
  }
}
