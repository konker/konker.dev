---
title: Madge circular dependency detection for node.js
author: Konrad Markus
abstract: "DESC"
pubDate: 2022-08-08
tags: ["til", "nodejs", "javascript", "typescript"]
---
Madge is a tool which detects circular dependencies in your javascript imports. It's a handy additional linting tool that can be added to your nodejs build/CI toolchain.

https://www.npmjs.com/package/madge

## Example usage

`package.json`
```JSON
{
  "...": "",
  "scripts": {
    "circular-check": "madge --extensions ts --circular --no-color --no-spinner --warning --ts-config ./tsconfig.json src",
    "...": ""
  }
}
```
