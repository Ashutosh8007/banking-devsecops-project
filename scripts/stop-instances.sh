#!/bin/bash
# Stop all project EC2 instances to save cost when not in use
INSTANCE_IDS=$(aws ec2 describe-instances \
  --filters "Name=tag:Project,Values=banking-devsecops-project" "Name=instance-state-name,Values=running" \
  --query "Reservations[].Instances[].InstanceId" --output text)

if [ -z "$INSTANCE_IDS" ]; then
  echo "No running instances found."
else
  echo "Stopping instances: $INSTANCE_IDS"
  aws ec2 stop-instances --instance-ids $INSTANCE_IDS
fi
