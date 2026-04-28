# Response Shapes

## PublicService

OpenAPI component shape:

```txt
{ id, provider, providerName, generalFunction, name, shortName, icon, description, keywords }
```

## Search Response

```txt
{ query, count, rows }
```

Each row can include:

```txt
{ category, generalFunction, providers }
```

## Notes

- Provider lookup responses are described as “matched service and its Huawei mapping”.
- Search responses return service rows from the comparison table.
- The full OpenAPI spec is available at:

```txt
https://compare.hwctools.site/api/openapi
```

- Excluded from this skill:

```txt
POST /api/suggestions
```
