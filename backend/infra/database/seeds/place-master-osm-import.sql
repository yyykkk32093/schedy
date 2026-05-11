-- Placeマスタ（OSM）投入SQL
--
-- 使い方:
--   cd backend
--   set -a && source env/.env.local && set +a
--   PSQL_URL="$(echo \"$DATABASE_URL\" | sed 's/[?&]schema=[^&]*//g')" \
--   && psql "$PSQL_URL" \
--     -v osm_jsonl="$(pwd)/infra/database/seeds/osm/data/places.jsonl" \
--     -f infra/database/seeds/place-master-osm-import.sql
--
-- 入力JSONLの1行フォーマット（transform.ts出力）:
-- {"source_id":"osm:way:...","name":"...","address":"...","lat":35.0,"lng":139.0,
--  "normalized_name":"...","normalized_address":"...","category":"community_centre"}

\if :{?osm_jsonl}
\else
\echo '[ERROR] psql variable "osm_jsonl" is required.'
\echo '        Example: -v osm_jsonl="$(pwd)/infra/database/seeds/osm/data/places.jsonl"'
\quit 1
\endif

BEGIN;

CREATE TEMP TABLE _place_import_raw (
  payload jsonb NOT NULL
);

\copy _place_import_raw(payload) FROM :'osm_jsonl'

CREATE TEMP TABLE _place_snapshot AS
SELECT
  (payload->>'sourceId')::varchar(100) AS "source_id",
  LEFT(COALESCE(payload->>'name', ''), 200)::varchar(200) AS "name",
  LEFT(COALESCE(payload->>'address', ''), 500)::varchar(500) AS "address",
  (payload->>'lat')::double precision AS "lat",
  (payload->>'lng')::double precision AS "lng",
  LEFT(COALESCE(payload->>'normalizedName', ''), 200)::varchar(200) AS "normalized_name",
  LEFT(COALESCE(payload->>'normalizedAddress', ''), 500)::varchar(500) AS "normalized_address",
  NULLIF(payload->>'category', '')::varchar(50) AS "category"
FROM _place_import_raw;

-- 妥当性チェック
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM _place_snapshot
    WHERE "source_id" IS NULL OR "source_id" = '' OR "name" = ''
  ) THEN
    RAISE EXCEPTION 'Invalid row found in _place_snapshot (sourceId/name is empty).';
  END IF;
END $$;

-- upsert（usageCount は更新しない）
INSERT INTO activity.places (
  "id",
  "name",
  "address",
  "lat",
  "lng",
  "normalized_name",
  "normalized_address",
  "category",
  "source",
  "source_id",
  "usage_count",
  "is_active",
  "created_at",
  "updated_at"
)
SELECT
  gen_random_uuid(),
  s."name",
  s."address",
  s."lat",
  s."lng",
  s."normalized_name",
  s."normalized_address",
  s."category",
  'osm',
  s."source_id",
  0,
  true,
  NOW(),
  NOW()
FROM _place_snapshot s
ON CONFLICT ("source", "source_id") DO UPDATE SET
  "name" = EXCLUDED."name",
  "address" = EXCLUDED."address",
  "lat" = EXCLUDED."lat",
  "lng" = EXCLUDED."lng",
  "normalized_name" = EXCLUDED."normalized_name",
  "normalized_address" = EXCLUDED."normalized_address",
  "category" = EXCLUDED."category",
  "is_active" = true,
  "updated_at" = NOW();

-- スナップショットに含まれないOSM Placeは論理削除
UPDATE activity.places p
SET
  "is_active" = false,
  "updated_at" = NOW()
WHERE p."source" = 'osm'
  AND p."is_active" = true
  AND NOT EXISTS (
    SELECT 1
    FROM _place_snapshot s
    WHERE s."source_id" = p."source_id"
  );

COMMIT;

-- 確認出力
SELECT COUNT(*)::int AS active_place_count
FROM activity.places
WHERE "source" = 'osm' AND "is_active" = true;
