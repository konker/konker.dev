---
title: 'TreeCrawler()'
author: 'Konrad Markus'
description: 'FIXME-DESC'
order: 5
kind: reference
---

# TreeCrawler()

```ts
type TreeCrawler<T>: (tfs, events, filters, handlers) => (dirPath, rootPath?, level?) => P.Effect.Effect<void, TinyTreeCrawlerError>;
```

## Type parameters

• **T** _extends_ `TinyFileSystem` = `TinyFileSystem`

## Parameters

• **tfs**: `T`

• **events**: `E.TinyEventDispatcher`\<[`TreeCrawlerEvent`](/projects/konkerdev-tiny-treecrawler-fp/reference/enumerations/treecrawlerevent), [`TreeCrawlerData`](/projects/konkerdev-tiny-treecrawler-fp/reference/type-aliases/treecrawlerdata)\>

• **filters**: [`TreeCrawlerFilters`](/projects/konkerdev-tiny-treecrawler-fp/reference/type-aliases/treecrawlerfilters)

• **handlers**: [`TreeCrawlerHandlers`](/projects/konkerdev-tiny-treecrawler-fp/reference/type-aliases/treecrawlerhandlers)

## Returns

`Function`

### Parameters

• **dirPath**: `string`

• **rootPath?**: `string`

• **level?**: `number`

### Returns

`P.Effect.Effect`\<`void`, `TinyTreeCrawlerError`\>

## Source

[index.ts:54](https://github.com/konkerdotdev/tiny-treecrawler-fp/blob/d889edd43bad878816e43a5941ed304eb3d9e371/src/index.ts#L54)
