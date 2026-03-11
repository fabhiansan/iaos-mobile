#!/bin/bash
set -e

echo "Creating zip bundle..."
python3 create_eb_zip.py

echo "Deploying to Elastic Beanstalk..."
eb use Iaos-mobile-env
eb deploy --timeout 20

echo "Deploy complete!"
