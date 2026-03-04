/**
 * ============================================================================
 * RULE ENGINE SERVICE — Condition matching and variant selection
 * ============================================================================
 *
 * This service is the decision-making core of the API. It takes:
 *   1. A list of rules (ordered by priority)
 *   2. A filtered visitor context (already consent-safe)
 *   3. A fallback variant (returned when no rules match)
 *
 * And returns the first matching variant (first-match-wins strategy).
 *
 * EVALUATION STRATEGY:
 *   - Rules are checked TOP-TO-BOTTOM (array order = priority)
 *   - Each rule has one or more conditions (AND logic — all must match)
 *   - The FIRST rule whose ALL conditions match WINS
 *   - If NO rule matches, the FALLBACK variant is returned
 *
 * SUPPORTED OPERATORS:
 *   - "eq"       → Exact string equality
 *   - "in"       → Value is contained in a list of allowed values
 *   - "contains" → String contains a substring
 */

import { Injectable } from '@nestjs/common';
import { Rule, Fallback, ConsentSafeContext } from '../types';

/** The shape of a successful evaluation result */
export interface EvaluationResult {
  variantId: string;
  headline: string;
  flags: Record<string, boolean>;
}

@Injectable()
export class RuleEngineService {
  /**
   * Evaluate rules against the visitor context and return the winning variant.
   *
   * @param rules    - Ordered list of rules (highest priority first)
   * @param context  - The consent-filtered visitor context
   * @param fallback - Default variant returned when no rules match
   * @returns The variant that the visitor should see
   */
  evaluate(
    rules: Rule[],
    context: ConsentSafeContext,
    fallback: Fallback,
  ): EvaluationResult {
    // ── Loop through rules top-to-bottom ─────────────────────────────
    // The first rule where ALL conditions match is the winner.
    // This "first-match-wins" strategy is simple, predictable,
    // and easy for marketing teams to reason about.
    for (const rule of rules) {
      // Check if ALL conditions in this rule match (AND logic)
      const allConditionsMatch = rule.conditions.every((condition) =>
        this.evaluateCondition(condition.field, condition.operator, condition.value, context),
      );

      // ── MATCH FOUND ──────────────────────────────────────────────
      // Return this rule's variant immediately — no further rules checked
      if (allConditionsMatch) {
        return {
          variantId: rule.variantId,
          headline: rule.headline,
          flags: rule.flags,
        };
      }
    }

    // ── NO MATCH — RETURN FALLBACK ─────────────────────────────────
    // None of the rules matched the visitor's context.
    // Return the default variant to ensure we always have a response.
    return {
      variantId: fallback.variantId,
      headline: fallback.headline,
      flags: fallback.flags,
    };
  }

  /**
   * Evaluate a single condition against the visitor context.
   *
   * @param field    - The context field to check (e.g., "country")
   * @param operator - The comparison operator ("eq", "in", or "contains")
   * @param value    - The expected value(s) to compare against
   * @param context  - The visitor context object
   * @returns true if the condition matches, false otherwise
   */
  private evaluateCondition(
    field: string,
    operator: 'eq' | 'in' | 'contains',
    value: string | string[],
    context: ConsentSafeContext,
  ): boolean {
    // Get the actual value from the visitor context for this field
    const contextValue = context[field];

    // If the field doesn't exist in the context, the condition cannot match.
    // This naturally handles the consent boundary: when marketing=false,
    // fields like "visitorId" simply don't exist in the context,
    // so any rule targeting them will fail to match.
    if (contextValue === undefined || contextValue === null) {
      return false;
    }

    // Convert the context value to a string for comparison
    const contextStr = String(contextValue);

    switch (operator) {
      // ── "eq": Exact string equality ──────────────────────────────
      // Example: country eq "EG" → true only if country is exactly "EG"
      case 'eq':
        return contextStr === String(value);

      // ── "in": Value is in a list of allowed values ───────────────
      // Example: country in ["EG", "SA", "AE"] → true if country is any of these
      case 'in':
        if (Array.isArray(value)) {
          return value.includes(contextStr);
        }
        // If value is not an array, fall back to equality check
        return contextStr === String(value);

      // ── "contains": String contains a substring ──────────────────
      // Example: referrerDomain contains "google" → true for "google.com"
      case 'contains':
        return contextStr.includes(String(value));

      // ── Unknown operator — fail safely ───────────────────────────
      default:
        return false;
    }
  }
}
