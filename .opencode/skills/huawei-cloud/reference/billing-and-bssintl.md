# Billing And BSSINTL

The service called Customer Operation Capabilities (`BSSINTL`) is not a normal product service. It is a group of APIs for managing costs, accounts, coupons, invoices, and related billing operations.

Use this reference when the user asks about:

- current costs
- billing
- account charges
- monthly spend
- invoices
- coupons

Rules:

- If the user asks about current costs, billing, or account charges, generate code that uses the BSSINTL APIs.
- When determining BSSINTL API metadata, use `sa-brazil-1` as the reference region if needed.
- When generating actual BSSINTL request code, remember these are global APIs, not region-specific.

Typical URL:

```txt
https://bss-intl.myhuaweicloud.com/v4/costs/cost-analysed-bills/query
```
