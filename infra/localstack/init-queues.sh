#!/bin/bash
set -e

for queue in purchase-events stock-reservation-requests stock-insufficient stock-reserved sale-failed sale-completed low-stock-alerts
do
  awslocal sqs create-queue --queue-name "$queue"
  echo "Ensured SQS queue exists: $queue"
done
