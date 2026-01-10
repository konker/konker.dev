#!/bin/bash

ssh -f -N \
  -o ControlMaster=yes \
  -o ControlPath="$HOME/.ssh/pg-rds-development.sock" \
  -L 54321:konkerdotdev-db-development.cu6r2wfxvgww.eu-west-1.rds.amazonaws.com:5432 \
ec2-user@bastion.development.konker.dev

echo "Single SSH master with the following tunnels: "
echo "  RDS Postgres development (54321)"
