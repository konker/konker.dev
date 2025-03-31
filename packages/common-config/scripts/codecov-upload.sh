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

SLUG=${FLAG/\//-}
echo "Slug: $SLUG"

# Resolve temp directory
TMPDIR=${RUNNER_TEMP:-'/tmp'}
echo "TMPDIR: $TMPDIR"

# Create slug directory
SLUGDIR="$TMPDIR/$SLUG"
echo "SLUGDIR: $SLUGDIR"
mkdir -p "$SLUGDIR"

echo "Checking codecov exists at $SLUGDIR/codecov"
if [[ -f "$SLUGDIR/codecov" ]]; then
  echo "codecov exists at $SLUGDIR/codecov. Skipping download"
else
  # Download and verify the uploader tool to the temp directory
  curl --output-dir "$SLUGDIR" https://keybase.io/codecovsecurity/pgp_keys.asc | gpg --no-default-keyring --keyring trustedkeys.gpg --import # One-time step
  curl --output-dir "$SLUGDIR" -Os https://cli.codecov.io/latest/linux/codecov
  curl --output-dir "$SLUGDIR" -Os https://cli.codecov.io/latest/linux/codecov.SHA256SUM
  curl --output-dir "$SLUGDIR" -Os https://cli.codecov.io/latest/linux/codecov.SHA256SUM.sig
  gpg --verify "$SLUGDIR/codecov.SHA256SUM.sig" "$SLUGDIR/codecov.SHA256SUM"

  cd "$SLUGDIR" || exit
  shasum -a 256 -c "$SLUGDIR/codecov.SHA256SUM" || exit
  cd - || exit
fi
chmod +x "$SLUGDIR/codecov"

# Change to code root
cd "$PWD" || exit

# Perform the upload
"$SLUGDIR/codecov" upload-process --token "$CODECOV_TOKEN" --flag "$FLAG" --git-service github
