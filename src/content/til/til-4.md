---
title: Madge circular dependency detection for node.js
author: Konrad Markus
abstract: "Madge is a tool which detects circular dependencies in your javascript imports."
pubDate: 2022-08-08
tags: ["til", "nodejs", "javascript", "typescript"]
---
It's a handy additional linting tool that can be added to your NodeJS build/CI toolchain.

https://www.npmjs.com/package/madge

## Example usage

`package.json`
```json
{
  "...": "",
  "scripts": {
    "circular-check": "madge --extensions ts --circular --no-color --no-spinner --warning --ts-config ./tsconfig.json src",
    "...": ""
  }
}
```
