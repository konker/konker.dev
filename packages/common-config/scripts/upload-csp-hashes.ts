/* eslint-disable */

import '@aws-sdk/signature-v4-crt';
import _ from 'lodash';

import path from 'node:path';

import {
  CloudFrontKeyValueStoreClient,
  DescribeKeyValueStoreCommand,
  UpdateKeysCommand,
} from '@aws-sdk/client-cloudfront-keyvaluestore';

export const CMD = 'upload-csp-hashes';
export const CSP_HASHES_KEY_PREFIX = 'csp-hashes' as const;
export const UPLOAD_MAX_BATCH_SIZE = 50;

// --------------------------------------------------------------------------
async function uploadToKeyValueStore(
  keyValueStoreArn: string,
  keyValuePuts: Array<{ Key: string; Value: string }>
): Promise<number> {
  // Upload to key-value store. First call describe to get the etag
  const keyValueStoreClient = new CloudFrontKeyValueStoreClient({
    region: 'us-east-1',
  });
  const cmd1 = new DescribeKeyValueStoreCommand({
    KvsARN: keyValueStoreArn,
  });
  const result1 = await keyValueStoreClient.send(cmd1);
  const etag = result1.ETag;

  // Use etag to make the update
  const cmd2 = new UpdateKeysCommand({
    KvsARN: keyValueStoreArn,
    IfMatch: etag,
    Puts: keyValuePuts,
    Deletes: [],
  });
  const result2 = await keyValueStoreClient.send(cmd2);
  const itemCount = result2.ItemCount;
  if (itemCount === undefined) {
    throw new Error(`[${CMD}] Upload failed`);
  }

  return itemCount;
}

// --------------------------------------------------------------------------
(async function main() {
  // Check args, print usage
  const fullProjectPath = process.argv[2];
  const keyValueStoreArn = process.argv[3];
  if (!fullProjectPath || !keyValueStoreArn) {
    console.error(`Usage: ${process.argv[1]} <project_dir> <key_value_store_arn>`);
    return process.exit(1);
  }

  // Dynamically import sriHashes.mjs
  const fullProjectSourcePath = path.join(fullProjectPath, 'src', 'generated', 'sriHashes.mjs');
  const relativeProjectSourcePath = path.relative(import.meta.dirname, fullProjectSourcePath);
  const sriHashes = await import(relativeProjectSourcePath);

  // Extract common resource hosts
  const perResourceSriHashes = sriHashes.perResourceSriHashes ?? {};
  const commonResourceSourcesScripts = [
    Object.keys(perResourceSriHashes.scripts).filter((x) => x.startsWith('https://')),
  ];
  const commonResourceSourcesStyles = [
    Object.keys(perResourceSriHashes.styles).filter((x) => x.startsWith('https://')),
  ];

  // Reformat into as array of [key, value] tuples
  const perPageSriHashes = sriHashes.perPageSriHashes ?? {};
  const keyValuePutsPerPage = Object.keys(perPageSriHashes).reduce(
    (acc, val) => {
      const scriptSrc = perPageSriHashes[val].scripts
        .map((x: string) => `'${x}'`)
        .concat(commonResourceSourcesScripts)
        .join(' ');
      const styleSrc = perPageSriHashes[val].styles
        .map((x: string) => `'${x}'`)
        .concat(commonResourceSourcesStyles)
        .join(' ');

      return [
        ...acc,
        {
          Key: `${CSP_HASHES_KEY_PREFIX}-/${val}`,
          Value: `script-src 'self' 'strict-dynamic' ${scriptSrc}; style-src 'self' 'strict-dynamic' ${styleSrc}; `,
        },
      ];
    },
    [] as Array<{ Key: string; Value: string }>
  );

  // Split into batches and upload one by one, note limit for key-value updates in one batch os 50
  const batches = _.chunk(keyValuePutsPerPage, UPLOAD_MAX_BATCH_SIZE);
  for (const batch of batches) {
    console.log(`[${CMD}] Uploading ${batch.length} items to key-value store...`);
    const itemCount = await uploadToKeyValueStore(keyValueStoreArn, batch);
    console.log(`[${CMD}] Result: ${itemCount} items`);
  }

  return process.exit(0);
})().catch(console.error);
