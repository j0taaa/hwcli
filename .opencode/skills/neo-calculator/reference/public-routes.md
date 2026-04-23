# Public Routes

Base URL:

```txt
http://hwctools.site:3000/api/v1
```

## `GET /public/services`

- Description: list available services
- Input: none
- Output:
  - `{ services: [{ code, name, category, pricingUrl }], total }`

## `GET /public/regions`

- Description: list available Huawei regions
- Input: none
- Output:
  - `{ regions: [{ code, short, full, catalogRegionId }], total }`

## `GET /public/catalog/{service}/pricing?region={region}`

- Description: get parsed pricing catalog for a service in a region
- Input:
  - path: `service`
  - query: optional `region`
- Output:
  - `{ service, region, catalogRegionId, catalog }`
  - on error: `{ error }`

## `GET /public/services/{serviceCode}/schema`

- Description: get the JSON schema and example body for creating/updating a product for a service
- Input:
  - path: `serviceCode`
- Output:
  - `{ serviceCode, serviceName, productType, billingOptions, schema, configDefaults, example }`
  - on unknown service: `{ error, availableServices? }`

## `GET /public/share/{shareId}`

- Description: get public snapshot of a shared project or list
- Input:
  - path: `shareId`
- Output:
  - shared resource snapshot
  - or `{ error: "Share not found" }`

## `GET /public/ecs-flavors`

- Description: list/filter ECS flavors, optionally including Flexus L plans
- Input:
  - query: `region`, `cpu`, `minCpu`, `maxCpu`, `ramGiB`, `minRamGiB`, `maxRamGiB`, `q`, `billingMode`, `limit`, `includeFlexusL`, `sort`, `order`
- Output:
  - `{ region, catalogRegionId, ecsCount, flexusLCount, flavors, flexusLPlans }`

## `GET /public/catalog/full-export?regions=r1,r2,...`

- Description: export catalogs for all services across selected regions
- Input:
  - query: `regions` as comma-separated region keys
- Output:
  - `{ regions, catalogs, flexusLPlans, generatedAt }`
