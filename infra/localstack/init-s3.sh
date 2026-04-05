#!/bin/bash
# ============================================
# LocalStack S3 初期化スクリプト
# コンテナ起動時に自動実行される
# ============================================

echo "🪣 Creating S3 bucket: tsudocan-local ..."

awslocal s3 mb s3://tsudocan-local --region ap-northeast-1

# CORS 設定（フロントエンドからのアクセス用）
awslocal s3api put-bucket-cors --bucket tsudocan-local --cors-configuration '{
  "CORSRules": [
    {
      "AllowedOrigins": ["http://localhost:5173"],
      "AllowedMethods": ["GET", "PUT", "POST"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3600
    }
  ]
}'

echo "✅ S3 bucket 'tsudocan-local' created with CORS configuration"
