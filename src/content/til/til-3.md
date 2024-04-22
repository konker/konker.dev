---
title: Absolute path to current script in bash
author: Konrad Markus
description:  "Get the absolute path to the directory of the current bash script. From there every other path reference can be made relative to this fixed point."
pubDate: 2024-04-11
tags: ["til", "shell", "bash"]
---

## Example Usage

```bash
#!/usr/bin/env bash

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
```
