# Core Object Shapes

## `Project`

```txt
{ id, name, description, ownerUserId, accessLevel, canRename, canDelete, canCreateLists, canClone, canShare, canSyncHuawei, lists, createdAt, updatedAt }
```

## `List`

```txt
{ id, projectId, name, ownerUserId, accessLevel, huaweiCartKey, huaweiCartName, huaweiLastSyncedAt, huaweiLastError, productCount, products, createdAt, updatedAt }
```

## `Product`

```txt
{ id, serviceCode, serviceName, productType, title, quantity, config, pricing, createdAt, updatedAt }
```

## `Error`

```txt
{ error }
```
