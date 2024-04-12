---
title: 'Notes on registering a domain with AWS Route53'
pubDate: 2024-04-08
description: 'Desc from FM'
author: 'Konker <mail@konker.dev>'
image:
    url: 'https://docs.astro.build/assets/full-logo-dark.png'
    alt: 'The full Astro logo.'
tags: ["til", "aws"]
---

- `.click` domains are the cheapest, good if you need something cheap and cheerful
- Added the following information for the WHOIS record:
  - type: Person
  - First name: REDACTED
  - Last Name: FOR PRIVACY
  - Email: <real email> - Needs to be a real email so that you can verify it - Otherwise, domain will be suspended after 15 days
    ```
    Verify your email to avoid domain suspension
    Choose the link in the email sent to privacy@example.com from noreply@domainnameverification.net or noreply@registrar.amazon.com to verify your email is reachable.
    ```
  - I set it to: webmaster+<domainName>@morningwoodsoftware.com
  - NOTE: check spam for these verification emails
  - NOTE: any changes to the domain, e.g. contact info starts an async process. Check the Route53 > Domains > Requests page to see progress. Performing another operation when a previous operation is in progress will result in an error (but won't interrupt the in-progress operation)
    If verification is not received within 15 days after you registered the domain or changed the contact email, the domain will be suspended and no longer be accessible on the internet.```
  - Phone: +1 5551234567
  - Address1: REDACTED
  - Address2: <blank>
  - Country: United States
  - State/Province: California
  - City: Beverly Hills
  - Zip code: 90210
- NOTE: Even domains for which AWS disables domain privacy, e.g. `.click`, upon inspection of the WHOIS record nothing is leaked, other than that AWS is the registrar. NOTE!: anecdotal data, not to be used for any important decisions.
