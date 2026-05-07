import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import {
  BILLING_PLAN_CATALOG,
  BILLING_PLAN_CATALOG_BY_SEGMENT,
  CREDIT_COST_GUIDE,
  TOP_UP_CATALOG,
} from "./config/billing-catalog";

@ApiTags("Plans")
@Controller({ path: "plans", version: "1" })
export class PlansController {
  @Get()
  listPlans() {
    return {
      plans: BILLING_PLAN_CATALOG,
      individualPlans: BILLING_PLAN_CATALOG_BY_SEGMENT.individual,
      teamPlans: BILLING_PLAN_CATALOG_BY_SEGMENT.team,
      topUpPackages: TOP_UP_CATALOG,
      creditCostGuide: CREDIT_COST_GUIDE,
    };
  }
}
