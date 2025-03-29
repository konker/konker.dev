#!/usr/bin/env bash

# Check inputs
if [[ -z "$CODECOV_TOKEN" ]]; then
  echo "No CODECOV_TOKEN"
  exit
fi

PWD=$1
if [[ -z "$PWD" ]]; then
  echo "No pwd"
  exit
fi
echo "PWD: $PWD"

FLAG=$2
if [[ -z "$FLAG" ]]; then
  echo "No flag"
  exit
fi
echo "FLAG: $FLAG"

# Resolve temp directory
TMPDIR=${RUNNER_TEMP:-'/tmp'}
echo "TMPDIR: $TMPDIR"

if [[ -f "$TMPDIR/codecov" ]]; then
  echo "codecov exists at $TMPDIR/codecov. Skipping download"
else
  # Download and verify the uploader tool to the temp directory
  curl --output-dir "$TMPDIR" https://keybase.io/codecovsecurity/pgp_keys.asc | gpg --no-default-keyring --keyring trustedkeys.gpg --import # One-time step
  curl --output-dir "$TMPDIR" -Os https://cli.codecov.io/latest/linux/codecov
  curl --output-dir "$TMPDIR" -Os https://cli.codecov.io/latest/linux/codecov.SHA256SUM
  curl --output-dir "$TMPDIR" -Os https://cli.codecov.io/latest/linux/codecov.SHA256SUM.sig
  gpg --verify "$TMPDIR/codecov.SHA256SUM.sig" "$TMPDIR/codecov.SHA256SUM"

  shasum -a 256 -c "$TMPDIR/codecov.SHA256SUM"
fi
chmod +x "$TMPDIR/codecov"

# Change to code root
cd "$PWD" || exit

# Perform the upload
"$TMPDIR/codecov" upload-process --token "$CODECOV_TOKEN" --flag "$FLAG" --git-service github
