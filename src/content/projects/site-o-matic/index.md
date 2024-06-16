---
title: site-o-matic
author: Konrad Markus
description: 'FIXME desc'
pubDate: 2022-08-08
tags: ['FIXME', 'project', 'nodejs', 'typescript', 'aws', 'cdk']
---

# site-o-matic

site-o-matic is a personal tool for deploying static websites to AWS, based on an [S3-backed](https://aws.amazon.com/s3/) [Cloudfront](https://aws.amazon.com/cloudfront/) distribution.

It's a wrapper around [AWS CDK](https://aws.amazon.com/cdk/), such that you can generate and deploy a [Cloudformation](https://aws.amazon.com/cloudformation/) stack for a static website, based on a [JSON5](https://json5.org/) configuration file.

The minimal JSON5 configuration file looks like this:

```js
{
  rootDomainName: 'minimal-example.com';
}
```

## Features

site-o-matic supports the following main features:

- Provisioning of a secure S3 bucket for website content.
- Creation and configuration of a Cloudfront CDN distribution to serve the S3 content.
- Provisioning and configuration of SSL certificates.
- Support for subdomains.
- [Route53](https://aws.amazon.com/route53/) DNS hosting, and declarative JSON5 configuration for custom DNS records.
- Support for declarative provisioning of a [Codebuild](https://aws.amazon.com/codebuild/) pipeline for automatically deploying the content based on git commits.
- Support for redirects via [Cloudfront Edge Function](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/cloudfront-functions.html).
- Support for automatic redirects to index page for subdirectories. [TODO: check the wording here]
- Automatic generation of placeholder content for new website deployments.
- Support for optional WAF rules.
- Registrar DNS integration for Dynadot (plugin based).

## Goals

site-o-matic has been created as a tool for cloud-savvy users who are familiar with AWS. The tool has a command line interface, and assumes the user has an AWS account and is familiar with acquiring command line authorization to perform AWS operations.

The tool is a way of dynamically generating CDK projects (and thus ultimately, Cloudformation stacks) based on a constrained, simplified JSON5 configuration file. It does not cover every corner of every feature.
