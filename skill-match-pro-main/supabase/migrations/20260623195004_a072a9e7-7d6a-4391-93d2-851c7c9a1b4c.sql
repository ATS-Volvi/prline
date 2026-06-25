INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'PLANT_ADMIN'::app_role FROM public.profiles WHERE username = 'sheikh'
ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.get_skill_gap(p_line_id integer DEFAULT NULL)
RETURNS TABLE (
  machine_id integer,
  machine_code text,
  machine_name text,
  line_id integer,
  line_name text,
  trainee_count integer,
  operator_count integer,
  certified_count integer,
  expert_count integer,
  total_count integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH level_rank AS (
    SELECT * FROM (VALUES
      ('TRAINEE'::skill_level, 1),
      ('OPERATOR'::skill_level, 2),
      ('CERTIFIED'::skill_level, 3),
      ('EXPERT'::skill_level, 4)
    ) AS t(lvl, rnk)
  ),
  machine_reqs AS (
    SELECT m.machine_id, count(msr.skill_id) AS req_count
    FROM machines m
    LEFT JOIN machine_skill_requirements msr ON msr.machine_id = m.machine_id
    WHERE m.is_active
    GROUP BY m.machine_id
  ),
  qualified AS (
    SELECT m.machine_id, lr.lvl, a.associate_id
    FROM machines m
    CROSS JOIN level_rank lr
    CROSS JOIN associates a
    JOIN machine_reqs mr ON mr.machine_id = m.machine_id
    WHERE m.is_active AND a.status = 'ACTIVE' AND mr.req_count > 0
      AND NOT EXISTS (
        SELECT 1 FROM machine_skill_requirements msr
        LEFT JOIN associate_skills ask
          ON ask.associate_id = a.associate_id
         AND ask.skill_id = msr.skill_id
         AND ask.is_valid
         AND (ask.expires_on IS NULL OR ask.expires_on >= current_date)
        LEFT JOIN level_rank lr2 ON lr2.lvl = ask.skill_level
        WHERE msr.machine_id = m.machine_id
          AND (ask.assoc_skill_id IS NULL OR lr2.rnk < lr.rnk)
      )
  )
  SELECT
    m.machine_id,
    m.machine_code::text,
    m.machine_name::text,
    m.line_id,
    pl.line_name::text,
    COALESCE(count(*) FILTER (WHERE q.lvl = 'TRAINEE'), 0)::int,
    COALESCE(count(*) FILTER (WHERE q.lvl = 'OPERATOR'), 0)::int,
    COALESCE(count(*) FILTER (WHERE q.lvl = 'CERTIFIED'), 0)::int,
    COALESCE(count(*) FILTER (WHERE q.lvl = 'EXPERT'), 0)::int,
    COALESCE(count(DISTINCT q.associate_id), 0)::int
  FROM machines m
  LEFT JOIN production_lines pl ON pl.line_id = m.line_id
  LEFT JOIN qualified q ON q.machine_id = m.machine_id
  WHERE m.is_active
    AND (p_line_id IS NULL OR m.line_id = p_line_id)
  GROUP BY m.machine_id, m.machine_code, m.machine_name, m.line_id, pl.line_name
  ORDER BY pl.line_name NULLS LAST, m.machine_code;
$$;

GRANT EXECUTE ON FUNCTION public.get_skill_gap(integer) TO authenticated;