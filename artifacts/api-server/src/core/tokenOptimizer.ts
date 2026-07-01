import { type Plan } from "./planner";

const TOKEN_LIMIT = 2000;

export function isTokenAllowed(plan: Plan): boolean {
  const tokens = plan.input.length * 2;
  return tokens < TOKEN_LIMIT;
}
