---
name: compare-api
description: Use the compare.hwctools.site APIs to look up cloud service mappings and search comparison rows
---

# Compare API

Use this skill when the user wants to query the Huawei Cloud Compare API at:

```txt
https://compare.hwctools.site
```

This API is for:

- cross-provider service lookup
- Huawei service lookup
- row search across the comparison table

Do not use or recommend the community suggestion API from this skill.

## Base URL

```txt
https://compare.hwctools.site/api
```

## How To Use This Skill

1. Decide whether the user needs a direct provider lookup or a broader row search.
2. Use provider lookup when the user already knows a service name.
3. Use row search when the user wants fuzzy discovery across the comparison table.
4. Filter the output to the specific provider/service details the user asked for.

## Route Groups

- `reference/provider-lookup.md`
  Use for one-service lookups by provider.
- `reference/search.md`
  Use for free-text search across comparison rows.
- `reference/shapes.md`
  Use for the available response shapes and output handling.

## Guidance

- The provider lookup service segment accepts full names, short names, and fuzzy aliases.
- Prefer provider lookup over search when the user names a specific service.
- Prefer row search when the user asks broad discovery questions like “show me Huawei services related to CI/CD”.
- Do not use `/api/suggestions` from this skill.
- If the user wants the raw schema source, the OpenAPI document is available at `https://compare.hwctools.site/api/openapi`.

## Output Expectations

- Generate minimal request code or curl examples when the user wants automation.
- Summarize matches cleanly when the response is large.
- Preserve provider names and mapped Huawei service details exactly as returned by the API.
