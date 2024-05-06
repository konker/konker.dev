---
title: SWC to speed up typescript
author: Konrad Markus
description: 'SWC is a great project which re-implements `tsc` the Typescript transpiler in Rust. Using this can significantly speed up typescript builds.'
pubDate: 2022-08-08
tags: ['til', 'typescript']
---

Good use cases are where you may be currently using `ts-node` to directly execute typescript code.
Integrating this with Jest can also yield significant speed increases for a typescript project.

At the current time of writing I recommend that this tool is used in specifically chosen situations, and that the official `tsc` transpiler is used to build code for production.

https://swc.rs/

## Example usage

TODO
