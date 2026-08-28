#!/bin/bash
# Start all project EC2 instances
INSTANCE_IDS=$(aws ec2 describe-instances \
  --filters "Name=tag:Project,Values=banking-devsecops-project" "Name=instance-state-name,Values=stopped" \
  --query "Reservations[].Instances[].InstanceId" --output text)

if [ -z "$INSTANCE_IDS" ]; then
  echo "No stopped instances found."
else
  echo "Starting instances: $INSTANCE_IDS"
  aws ec2 start-instances --instance-ids $INSTANCE_IDS
  echo "Wait ~1-2 min, then run 'terraform refresh' inside infra/terraform to get new public IPs."
fi
