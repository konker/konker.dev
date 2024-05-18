---
title: Absolute path to a relative file
slug: absolute-path-to-a-relative-file
author: Konrad Markus
description: 'Get the absolute path to a file based on the relative path.'
pubDate: 2024-04-11
tags: ['til', 'shell', 'linux', 'bash']
---

Sometimes you want to get the absolute path to a file,
but don't want to have the hassle of concatenating the result of `pwd` to a relative path.

No need! Enter the `realpath` command.

## Example Usage

```bash
# Hassle
$ echo `pwd`/src/content/til/til-2.md
/home/konker/src/content/​til/til-2.md

# 1000% better
$ realpath src/content/til/til-2.md
/home/konker/src/content/​til/til-2.md
```

## Additional
Also handy can be this snippet to put into scripts to establish the absolute path of the script itself. From there every other path reference can be made relative to this fixed point.

### Example Usage
```bash
#!/usr/bin/env bash

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
```
