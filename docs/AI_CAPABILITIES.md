# AI readiness

This project includes a minimal AI scaffold to generate copy and summaries for merchants. The goal is to speed up content creation without blocking core flows when AI is unavailable.

## Configuration

Set these env vars:

- `OPENAI_API_KEY`
- `OPENAI_MODEL` (default `gpt-4o-mini`)

## API

POST `app/api/merchant/[slug]/ai`

Request body:

```json
{
  "purpose": "campaign_copy",
  "language": "en",
  "tone": "warm, confident, concise",
  "brandName": "Coffee House",
  "campaignName": "Spring Specials",
  "offer": "20% off lattes",
  "audience": "local coffee lovers",
  "description": "Valid weekdays only",
  "callToAction": "Claim offer",
  "points": ["Limited time", "In-store only"]
}
```

Purpose values:

- `campaign_copy`
- `voucher_copy`
- `gift_card_copy`
- `newsletter_draft`
- `builder_layout`
- `ops_assistant`

## Suggested AI use cases

- Campaign names, headlines, and short descriptions.
- Voucher fine print and CTA variations.
- Gift card message templates.
- Weekly newsletter draft and subject line ideas.
- Page builder "vibe" layout generation (storefront + rental).
- Operational checklists for launch, support, and weekly ops.
- Translation help for supported locales (with human review).
- Merchant support replies (internal draft mode).

## Notes

- If AI is not configured, the API returns `503` and UI should fall back gracefully.
- All AI activity is logged to `AuditLog` as `ai.copy_generated`.
- Vibe builder uses `ai.vibe_builder`, ops assistant uses `ai.ops_assistant`.
- Usage limits are enforced via `AI_VIBE_LIMIT` and `AI_AGENT_LIMIT` (default 5 and 20 per 24h).
