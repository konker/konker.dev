---
title: About
---

This website is a place to document software and projects developed by Konrad Markus.

I have the following channels:

- [Codeberg](https://codeberg.org/konker/)
- [Github](https://github.com/konker/)
- [LinkedIn](https://www.linkedin.com/in/konradmarkus/)
- You can also drop me a line at `mail@<this website hostname>`

## Site

This website has been built using [Astro](https://astro.build/), which is a modern, superior, descendant of the previous generation of [static site generators](http://nxt.flotsam.nl/the-rise-of-the-smiths). It can also do various other client-side things, but I haven't really develed in to those yet. Astro has a position of being very good for documentation and content-based websites, and as such, is a great fit for this site which aims to curate technical content.

If [Tailwind](https://tailwindcss.com/) is controversial, then I am now a believer. As an old-school hand-crafter when it comes to CSS, I have been won over by the fluency with which you can apply responsive designs, and light/dark mode variations. The site also uses the [Tailwind Typography plugin](https://github.com/tailwindlabs/tailwindcss-typography) for formatting content sections.

Currently, the site is deployed to AWS Cloudfront, using a tool that I have written for managing such website deployement stacks: [Site-O-Matic](/projects/site-o-matic).

### Design

The site design is aiming to be quite minimalist, with some style cues drawn from an aethetic based on the original web browsers.
Blue, underlined links. Visited links indicated with a small colour change. A gray-ish background. Serif fonts for content.
Plus some small icon flourishes to help sign-post the information architecture.

## Technical

Currently, my interests lie in advancing my understanding and practical experience of [functional programming](https://leanpub.com/fp-made-easier).
I believe it's a way to structure complicated code in a way that can be reasoned about with more clarity, and with more confidence in its correctness. Meaning, in general, a tool to create code of a higher quality, and with higher resistance to unexpected side-effects and regressions.

This comes at a price. A learning curve for a start. And a shift in mental model, which requires an effort to achieve. It seems that outside of some specialist niches, professional work is quite difficult to find, but I live in hope!

I'm a big fan of [Scott Wlaschin](https://fsharpforfunandprofit.com/pipeline/), whose talks and books are really good at introducing the benefits of functional programming techniques, and for providing pragmatic guides on how to apply such techniques to real world problems.

As I've also been involved with a lot of typescript, I'm experimenting with the [Effect](https://effect.website/) framework. This is the "successor" to [fp-ts](), which although a thicker abstraction over the native Typescript language, with a runtime, nevertheless provides _a lot_ of features. Worth to note, the [M-word](https://fi.wikipedia.org/wiki/Burrito) doesn't appear at all in the Effect website/docs.

I'm currently trying to create various [code projects](/tags/effect) to create practical examples and usages of all this FP-ness. Most things are open source, and developed in public (not that anyone cares); with one [exception](https://drawing.wang/) - maybe one day I will lift the lid on that project. It will be a game-changer!

## Stack

I develop on [Arch Linux](https://archlinux.org/) (btw), on a desktop PC with a lot of CPU and a lot of RAM. I frequently use a laptop to [VNC](https://www.realvnc.com/en/) into this PC when working from other places. It means that I can close the laptop, and seamlessly pick up from where I left off later. This setup is very dependent on a baseline of internet connectivity (around 100 Mbit is fine), but so far, this has rarely been a problem for me. I have set up a commercial RealVNC server and client setup, as it is just more reliable than the open source alternatives.

To network together the various devices, I have a [Tailscale](https://tailscale.com/) setup. Basically magic that means the PC and the laptop (and other stuff) is on the same network, no matter where I actually am.

As a fail-safe I have a [Raspberry Pi 5](https://www.raspberrypi.com/products/raspberry-pi-5/) acting as an SSH gateway, and a Raspberry Pi 3 acting as a backup gateway.

Sometimes, I just need to press the power button on the PC. Maybe it has locked up and needs to be reset, or maybe there was a power-cut, and it needs to be powered back up. To solve this: behold! The [Internet of Button](/projects/internet-of-button)! A small ESP32 powered device that allows me to simulate power button presses remotely over the internet.

As a laptop I use a [Macbook Air M1 (2020)](https://support.apple.com/en-us/111883). It has a great screen, and portable form-factor; but mainly it has amazing battery life! Especially as I mostly use it as a VNC terminal. I'm happy with the silver colour-way. Timeless and more forgiving of fingerprints and scratches.

I make a lot of use of [JetBrains](https://www.jetbrains.com/) IDEs and tools, especially WebStorm and DataGrip. Another benefit of the beefy PC setup is that I can run these "heavy" IDEs easily, and take advantage of their extensive features.

Outside of that, I'm a VIM man, but have been lured over by [Spacemacs](https://www.spacemacs.org/) for some things.
