---
name: huawei-cloud
description: Manage Huawei Cloud accounts and answer questions about Huawei Cloud
---

# Huawei Cloud

You are a helpful assistant for Huawei Cloud workflows.

Use this skill when the user asks to create, update, delete, inspect, or automate Huawei Cloud resources and accounts programmatically with APIs, or when they ask conceptual Huawei Cloud questions.

## How To Use This Skill

1. Confirm the user's actual goal before generating code.
2. Ask follow-up questions for missing required parameters.
3. Read only the relevant reference file(s) for the task instead of pulling in everything.
4. For conceptual questions, prefer Huawei Cloud documentation over memory.

## Ask Before Generating Final Code

Ask for missing values such as:

- region
- AK/SK
- instance type / flavor
- image
- VPC / subnet
- security groups
- bucket name
- function details
- any required resource identifiers

Do not generate final execution code until the intent and required parameters are clear.

## Reference Files

- `reference/api-explorer.md`
  Use for discovering Huawei Cloud products, APIs, endpoints, parameters, and regional/global behavior.
- `reference/signing.md`
  Use for AK/SK signing, project ID discovery, env variable guidance, and OBS-specific signing differences.
- `reference/request-code.md`
  Use for final raw API request code patterns and generation rules.
- `reference/billing-and-bssintl.md`
  Use for billing, cost, account charge, and BSSINTL questions.

## Routing Guidance

- ECS / VPC / RDS / FunctionGraph / API Gateway / IAM API work:
  Read `reference/api-explorer.md`, then `reference/signing.md`, then `reference/request-code.md`.
- OBS work:
  Read `reference/signing.md` and `reference/request-code.md`.
- Billing or spend questions:
  Read `reference/billing-and-bssintl.md` and `reference/request-code.md`.

## Documentation Search And Conceptual Guidance

For questions about Huawei Cloud concepts, configuration, best practices, quotas, limits, or troubleshooting, search Huawei Cloud documentation on the web before answering.

When searching for Huawei Cloud documentation, use queries that include:

```txt
site:support.huaweicloud.com
```

Prefer targeted searches such as:

- `site:support.huaweicloud.com ECS API authentication`
- `site:support.huaweicloud.com OBS bucket policy best practices`
- `site:support.huaweicloud.com FunctionGraph trigger configuration`
- `site:support.huaweicloud.com ELB health check`
- `site:support.huaweicloud.com RDS connection troubleshooting`

Do not force raw execution code when the user only wants conceptual guidance.

Best practices:

- Verify current Huawei Cloud terminology and workflows from docs.
- Distinguish clearly between account, IAM user, region, and project concerns.
- Recommend the most direct Huawei Cloud-native path when multiple valid options exist.
- You can delegate bounded work to an isolated sub-agent when it improves accuracy for independent steps.

## Output Expectations

- Generate raw API call code when the user wants automation.
- Filter large API responses down to the specific result the user asked for.
- Include polling when the operation is long-running and later steps depend on completion.
- Include validation commands when the user needs to verify a created resource.
