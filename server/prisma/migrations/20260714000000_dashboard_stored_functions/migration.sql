CREATE OR REPLACE FUNCTION get_dashboard_stats(p_ai_agent_id TEXT)
RETURNS TABLE (
  "totalTickets"       BIGINT,
  "openTickets"        BIGINT,
  "aiResolvedCount"    BIGINT,
  "aiResolvedPercent"  INT,
  "avgResolutionTimeMs" DOUBLE PRECISION
)
LANGUAGE sql STABLE
AS $$
  WITH counts AS (
    SELECT
      COUNT(*)                                                         AS total,
      COUNT(*) FILTER (WHERE status IN ('open', 'pending'))            AS open_count,
      COUNT(*) FILTER (WHERE status = 'resolved'
                         AND "assignedToId" = p_ai_agent_id)           AS ai_count
    FROM ticket
  ),
  resolution AS (
    SELECT AVG(EXTRACT(EPOCH FROM ("updatedAt" - "createdAt")) * 1000) AS avg_ms
    FROM ticket
    WHERE status IN ('resolved', 'closed')
  )
  SELECT
    c.total,
    c.open_count,
    c.ai_count,
    CASE WHEN c.total > 0
      THEN ROUND(c.ai_count * 100.0 / c.total)::INT
      ELSE 0
    END,
    COALESCE(r.avg_ms, 0)
  FROM counts c, resolution r;
$$;

CREATE OR REPLACE FUNCTION get_tickets_per_day(p_days INT DEFAULT 30)
RETURNS TABLE (
  "date"  DATE,
  "count" BIGINT
)
LANGUAGE sql STABLE
AS $$
  SELECT
    d::DATE                                          AS "date",
    COUNT(t.id)                                      AS "count"
  FROM generate_series(
    CURRENT_DATE - (p_days - 1),
    CURRENT_DATE,
    '1 day'::INTERVAL
  ) AS d
  LEFT JOIN ticket t
    ON t."createdAt"::DATE = d::DATE
  GROUP BY d
  ORDER BY d;
$$;
