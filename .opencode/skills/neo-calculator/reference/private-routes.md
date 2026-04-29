# Private Routes

Base URL:

```txt
https://calculator.hwctools.site/api/v1
```

Private routes require:

```txt
X-API-Key: <key>
```

Huawei sync/cart routes also require a Huawei Cloud session cookie in the request body.

## API Keys

### `GET /private/api-keys`

- Description: get current user API key
- Output:
  - `{ key }`

### `POST /private/api-keys`

- Description: create a new API key, replacing the old one
- Output:
  - `{ key, id, createdAt, message }`

### `DELETE /private/api-keys`

- Description: delete current API key
- Output:
  - `{ deleted: true }`

### `POST /private/api-keys/regenerate`

- Description: regenerate API key
- Output:
  - `{ id, key, message }`

## Projects

### `GET /private/projects`

- Description: list projects the user can access
- Output:
  - `Project[]`

### `POST /private/projects`

- Description: create a project
- Body:
  - `{ name, description? }`
- Output:
  - created `Project`

### `PATCH /private/projects/{projectId}`

- Description: rename/update a project
- Body:
  - `{ name, description? }`
- Output:
  - `{ id, name, description, updatedAt }`

### `DELETE /private/projects/{projectId}`

- Description: delete a project
- Output:
  - `{ id, deleted: true }`

### `POST /private/projects/{projectId}/lists`

- Description: create a list inside a project, optionally importing a Huawei cart
- Body:
  - `{ name?, huaweiCartKey?, cookie? }`
- Output:
  - created `List`

### `POST /private/projects/{projectId}/clone`

- Description: clone a project, optionally converting region/billing mode
- Body:
  - `{ name?, targetRegion?, targetBillingMode? }`
- Output:
  - `{ id, name, description, createdAt, updatedAt, lists, cloneSummary }`

### `POST /private/projects/{projectId}/huawei-sync`

- Description: sync all lists in a project to Huawei Cloud calculator
- Body:
  - `{ cookie }`
- Output:
  - `{ projectId, projectName, updatedAt, syncedCount, failedCount, lists }`

## Lists

### `PATCH /private/lists/{listId}`

- Description: update a list, Huawei link, or move it to another project
- Body:
  - `{ name?, huaweiCartKey?, huaweiCartName?, projectId? }`
- Output:
  - `{ id, projectId, previousProjectId, name, huaweiCartKey, huaweiCartName, huaweiLastError, updatedAt }`

### `DELETE /private/lists/{listId}`

- Description: delete a list
- Output:
  - `{ id, projectId, deleted: true, updatedAt }`

### `GET /private/lists/{listId}/products`

- Description: list products in a list
- Output:
  - `Product[]`

### `POST /private/lists/{listId}/products`

- Description: add a product to a list; server computes pricing
- Body:
  - `{ serviceCode, serviceName, productType?, title?, quantity?, config }`
- Output:
  - created `Product`

### `PATCH /private/lists/{listId}/products/{productId}`

- Description: update a product; server recomputes pricing
- Body:
  - `{ serviceCode, serviceName, productType?, title?, quantity?, config, pricing? }`
- Output:
  - `{ id, listId, projectId, serviceCode, serviceName, productType, title, quantity, config, pricing, updatedAt }`

### `DELETE /private/lists/{listId}/products/{productId}`

- Description: delete a product
- Output:
  - `{ id, listId, projectId, deleted: true, updatedAt }`

### `POST /private/lists/{listId}/clone`

- Description: clone a list, optionally converting region/billing mode
- Body:
  - `{ name?, targetRegion?, targetBillingMode? }`
- Output:
  - `{ id, projectId, name, huaweiCartKey, huaweiCartName, huaweiLastSyncedAt, huaweiLastError, huaweiLastRemoteUpdatedAt, createdAt, updatedAt, productCount, products, cloneSummary }`

### `POST /private/lists/{listId}/huawei-sync`

- Description: sync one list to Huawei Cloud calculator
- Body:
  - `{ cookie }`
- Output:
  - `{ listId, projectId, huaweiCartKey, huaweiCartName, huaweiLastSyncedAt, huaweiLastError, updatedAt }`

## Huawei Cart / Import / Sharing

### `POST /private/huawei/carts`

- Description: list Huawei Cloud calculator carts available from the cookie
- Body:
  - `{ cookie }`
- Output:
  - `{ carts: [{ ...cart, associatedListId }], syncedAt }`

### `POST /private/import`

- Description: import an exported/shared project or cart payload
- Body:
  - `{ payload, targetProjectId? }`
- Output:
  - project import: `{ resourceType: "project", projectId, firstListId, name, importedListCount, importedProductCount }`
  - cart import: `{ resourceType: "cart", projectId, listId, name, importedProductCount }`

### `POST /private/share`

- Description: create a share link
- Body:
  - `{ resourceType: "project" | "list", resourceId, mode: "copy" | "collaborate" }`
- Output:
  - share object plus `{ shareUrl }`

### `POST /private/share/{shareId}/join`

- Description: join a collaborative share
- Output:
  - join result object

### `POST /private/share/{shareId}/import`

- Description: import a shared copy into the current user account
- Output:
  - import result object

## Calculate

### `POST /calculate`

- Description: calculate prices for product inputs without creating persistent resources
- Body:
  - `{ region?, products: [{ serviceCode, productType, quantity?, config }] }`
- Output:
  - `{ region, calculatedAt, results }`
  - each result is `{ serviceCode, productType, quantity, config, pricing, error? }`
- Notes:
  - directly implemented only for `ECS`, `ELB`, and `WAF`
  - for other services, prefer schema + catalog + product creation routes
