
-- =========================
-- ENUMS
-- =========================
CREATE TYPE public.app_role AS ENUM ('PLANT_ADMIN', 'HR_COORDINATOR', 'SUPERVISOR', 'PLANT_MANAGER');
CREATE TYPE public.skill_level AS ENUM ('TRAINEE', 'OPERATOR', 'CERTIFIED', 'EXPERT');
CREATE TYPE public.associate_category AS ENUM ('CONTRACT', 'COMPANY_OPERATIVE', 'SUPERVISOR', 'NTCI');
CREATE TYPE public.associate_status AS ENUM ('ACTIVE', 'INACTIVE', 'SEPARATED');
CREATE TYPE public.allocation_status AS ENUM ('CONFIRMED', 'OVERRIDE', 'CANCELLED');
CREATE TYPE public.audit_action AS ENUM ('INSERT', 'UPDATE', 'DELETE');

CREATE OR REPLACE FUNCTION public.skill_level_rank(_lvl public.skill_level)
RETURNS INT LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE _lvl
    WHEN 'TRAINEE'::public.skill_level THEN 1
    WHEN 'OPERATOR'::public.skill_level THEN 2
    WHEN 'CERTIFIED'::public.skill_level THEN 3
    WHEN 'EXPERT'::public.skill_level THEN 4
  END;
$$;

CREATE TABLE public.profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(60) NOT NULL UNIQUE,
  full_name VARCHAR(120),
  associate_id INT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.has_any_role(_user_id UUID, _roles public.app_role[])
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = ANY(_roles));
$$;

CREATE POLICY "profiles_read_all" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_self_update" ON public.profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "profiles_admin_all" ON public.profiles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'PLANT_ADMIN'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'PLANT_ADMIN'::public.app_role));

CREATE POLICY "user_roles_self_read" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'PLANT_ADMIN'::public.app_role));
CREATE POLICY "user_roles_admin_write" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'PLANT_ADMIN'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'PLANT_ADMIN'::public.app_role));

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.departments (
  department_id SERIAL PRIMARY KEY,
  name VARCHAR(80) NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.departments TO authenticated;
GRANT ALL ON public.departments TO service_role;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dept_read" ON public.departments FOR SELECT TO authenticated USING (true);
CREATE POLICY "dept_admin_write" ON public.departments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'PLANT_ADMIN'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'PLANT_ADMIN'::public.app_role));

CREATE TABLE public.production_lines (
  line_id SERIAL PRIMARY KEY,
  line_name VARCHAR(80) NOT NULL UNIQUE,
  area VARCHAR(80),
  department_id INT REFERENCES public.departments(department_id),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.production_lines TO authenticated;
GRANT ALL ON public.production_lines TO service_role;
ALTER TABLE public.production_lines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "line_read" ON public.production_lines FOR SELECT TO authenticated USING (true);
CREATE POLICY "line_admin_write" ON public.production_lines FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'PLANT_ADMIN'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'PLANT_ADMIN'::public.app_role));

CREATE TABLE public.machines (
  machine_id SERIAL PRIMARY KEY,
  machine_code VARCHAR(30) NOT NULL UNIQUE,
  machine_name VARCHAR(120) NOT NULL,
  line_id INT REFERENCES public.production_lines(line_id) ON DELETE RESTRICT,
  min_skill_level public.skill_level NOT NULL DEFAULT 'OPERATOR'::public.skill_level,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.machines TO authenticated;
GRANT ALL ON public.machines TO service_role;
ALTER TABLE public.machines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mach_read" ON public.machines FOR SELECT TO authenticated USING (true);
CREATE POLICY "mach_admin_write" ON public.machines FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'PLANT_ADMIN'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'PLANT_ADMIN'::public.app_role));

CREATE TABLE public.shifts (
  shift_id SERIAL PRIMARY KEY,
  shift_name VARCHAR(30) NOT NULL UNIQUE,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);
GRANT SELECT, INSERT, UPDATE ON public.shifts TO authenticated;
GRANT ALL ON public.shifts TO service_role;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shift_read" ON public.shifts FOR SELECT TO authenticated USING (true);
CREATE POLICY "shift_admin_write" ON public.shifts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'PLANT_ADMIN'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'PLANT_ADMIN'::public.app_role));

CREATE TABLE public.skill_categories (
  skill_id SERIAL PRIMARY KEY,
  skill_code VARCHAR(30) NOT NULL UNIQUE,
  skill_name VARCHAR(120) NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);
GRANT SELECT, INSERT, UPDATE ON public.skill_categories TO authenticated;
GRANT ALL ON public.skill_categories TO service_role;
ALTER TABLE public.skill_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "skill_read" ON public.skill_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "skill_admin_write" ON public.skill_categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'PLANT_ADMIN'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'PLANT_ADMIN'::public.app_role));

CREATE TABLE public.machine_skill_requirements (
  machine_id INT NOT NULL REFERENCES public.machines(machine_id) ON DELETE CASCADE,
  skill_id INT NOT NULL REFERENCES public.skill_categories(skill_id) ON DELETE RESTRICT,
  min_level public.skill_level NOT NULL DEFAULT 'OPERATOR'::public.skill_level,
  PRIMARY KEY (machine_id, skill_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.machine_skill_requirements TO authenticated;
GRANT ALL ON public.machine_skill_requirements TO service_role;
ALTER TABLE public.machine_skill_requirements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "msr_read" ON public.machine_skill_requirements FOR SELECT TO authenticated USING (true);
CREATE POLICY "msr_admin_write" ON public.machine_skill_requirements FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'PLANT_ADMIN'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'PLANT_ADMIN'::public.app_role));

CREATE TABLE public.associates (
  associate_id SERIAL PRIMARY KEY,
  employee_code VARCHAR(30) NOT NULL UNIQUE,
  full_name VARCHAR(120) NOT NULL,
  category public.associate_category NOT NULL,
  department_id INT REFERENCES public.departments(department_id),
  contact_number VARCHAR(15),
  joining_date DATE,
  status public.associate_status NOT NULL DEFAULT 'ACTIVE'::public.associate_status,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.associates TO authenticated;
GRANT ALL ON public.associates TO service_role;
ALTER TABLE public.associates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "assoc_read" ON public.associates FOR SELECT TO authenticated USING (true);
CREATE POLICY "assoc_hr_write" ON public.associates FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['PLANT_ADMIN','HR_COORDINATOR']::public.app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['PLANT_ADMIN','HR_COORDINATOR']::public.app_role[]));

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_associate_fk FOREIGN KEY (associate_id) REFERENCES public.associates(associate_id) ON DELETE SET NULL;

CREATE TABLE public.associate_skills (
  assoc_skill_id SERIAL PRIMARY KEY,
  associate_id INT NOT NULL REFERENCES public.associates(associate_id) ON DELETE CASCADE,
  skill_id INT NOT NULL REFERENCES public.skill_categories(skill_id) ON DELETE RESTRICT,
  skill_level public.skill_level NOT NULL,
  certified_on DATE,
  expires_on DATE,
  certified_by VARCHAR(120),
  is_valid BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (associate_id, skill_id)
);
CREATE INDEX idx_assoc_skill_assoc ON public.associate_skills(associate_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.associate_skills TO authenticated;
GRANT ALL ON public.associate_skills TO service_role;
ALTER TABLE public.associate_skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "askill_read" ON public.associate_skills FOR SELECT TO authenticated USING (true);
CREATE POLICY "askill_hr_write" ON public.associate_skills FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['PLANT_ADMIN','HR_COORDINATOR']::public.app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['PLANT_ADMIN','HR_COORDINATOR']::public.app_role[]));

CREATE TABLE public.associate_availability (
  availability_id SERIAL PRIMARY KEY,
  associate_id INT NOT NULL REFERENCES public.associates(associate_id) ON DELETE CASCADE,
  unavailable_date DATE NOT NULL,
  shift_id INT REFERENCES public.shifts(shift_id),
  reason VARCHAR(80),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (associate_id, unavailable_date, shift_id)
);
CREATE INDEX idx_avail_date ON public.associate_availability(unavailable_date, shift_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.associate_availability TO authenticated;
GRANT ALL ON public.associate_availability TO service_role;
ALTER TABLE public.associate_availability ENABLE ROW LEVEL SECURITY;
CREATE POLICY "avail_read" ON public.associate_availability FOR SELECT TO authenticated USING (true);
CREATE POLICY "avail_write" ON public.associate_availability FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['PLANT_ADMIN','HR_COORDINATOR','SUPERVISOR']::public.app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['PLANT_ADMIN','HR_COORDINATOR','SUPERVISOR']::public.app_role[]));

CREATE TABLE public.shift_allocations (
  allocation_id SERIAL PRIMARY KEY,
  allocation_date DATE NOT NULL,
  shift_id INT NOT NULL REFERENCES public.shifts(shift_id),
  machine_id INT NOT NULL REFERENCES public.machines(machine_id),
  associate_id INT NOT NULL REFERENCES public.associates(associate_id),
  status public.allocation_status NOT NULL DEFAULT 'CONFIRMED'::public.allocation_status,
  override_reason TEXT,
  allocated_by UUID NOT NULL REFERENCES auth.users(id),
  allocated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_allocation UNIQUE (allocation_date, shift_id, machine_id),
  CONSTRAINT chk_override_reason CHECK (
    status <> 'OVERRIDE'::public.allocation_status
    OR (override_reason IS NOT NULL AND length(trim(override_reason)) > 0)
  )
);
CREATE INDEX idx_alloc_date_shift ON public.shift_allocations(allocation_date, shift_id);
CREATE INDEX idx_alloc_assoc ON public.shift_allocations(associate_id, allocation_date);
GRANT SELECT, INSERT, UPDATE ON public.shift_allocations TO authenticated;
GRANT ALL ON public.shift_allocations TO service_role;
ALTER TABLE public.shift_allocations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "alloc_read" ON public.shift_allocations FOR SELECT TO authenticated USING (true);
CREATE POLICY "alloc_write" ON public.shift_allocations FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['PLANT_ADMIN','SUPERVISOR']::public.app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['PLANT_ADMIN','SUPERVISOR']::public.app_role[]));

CREATE OR REPLACE FUNCTION public.validate_shift_allocation()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_missing_count INT;
  v_self_assoc INT;
  v_already INT;
  v_unavail INT;
BEGIN
  IF NEW.status = 'CANCELLED'::public.allocation_status THEN
    RETURN NEW;
  END IF;

  SELECT associate_id INTO v_self_assoc FROM public.profiles WHERE user_id = NEW.allocated_by;
  IF v_self_assoc IS NOT NULL AND v_self_assoc = NEW.associate_id THEN
    RAISE EXCEPTION 'SELF_ASSIGNMENT: A user cannot allocate themselves to a machine.' USING ERRCODE = 'check_violation';
  END IF;

  SELECT COUNT(*) INTO v_already FROM public.shift_allocations
    WHERE allocation_date = NEW.allocation_date
      AND shift_id = NEW.shift_id
      AND associate_id = NEW.associate_id
      AND status <> 'CANCELLED'::public.allocation_status
      AND (TG_OP = 'INSERT' OR allocation_id <> NEW.allocation_id);
  IF v_already > 0 THEN
    RAISE EXCEPTION 'ALREADY_ALLOCATED: Associate is already allocated to another machine for this shift.' USING ERRCODE = 'check_violation';
  END IF;

  SELECT COUNT(*) INTO v_unavail FROM public.associate_availability
    WHERE associate_id = NEW.associate_id
      AND unavailable_date = NEW.allocation_date
      AND (shift_id IS NULL OR shift_id = NEW.shift_id);
  IF v_unavail > 0 AND NEW.status <> 'OVERRIDE'::public.allocation_status THEN
    RAISE EXCEPTION 'ASSOCIATE_UNAVAILABLE: Associate is marked unavailable for this date/shift.' USING ERRCODE = 'check_violation';
  END IF;

  IF NEW.status <> 'OVERRIDE'::public.allocation_status THEN
    SELECT COUNT(*) INTO v_missing_count
    FROM public.machine_skill_requirements msr
    WHERE msr.machine_id = NEW.machine_id
      AND NOT EXISTS (
        SELECT 1 FROM public.associate_skills ask
        WHERE ask.associate_id = NEW.associate_id
          AND ask.skill_id = msr.skill_id
          AND ask.is_valid = TRUE
          AND (ask.expires_on IS NULL OR ask.expires_on >= NEW.allocation_date)
          AND public.skill_level_rank(ask.skill_level) >= public.skill_level_rank(msr.min_level)
      );
    IF v_missing_count > 0 THEN
      RAISE EXCEPTION 'MACHINE_SKILL_MISMATCH: Associate does not meet all required skills for this machine.' USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_alloc
  BEFORE INSERT OR UPDATE ON public.shift_allocations
  FOR EACH ROW EXECUTE FUNCTION public.validate_shift_allocation();

CREATE OR REPLACE FUNCTION public.get_eligible_associates(
  _date DATE,
  _shift_id INT,
  _machine_id INT
)
RETURNS TABLE (
  associate_id INT,
  employee_code VARCHAR,
  full_name VARCHAR,
  category public.associate_category,
  highest_relevant_level public.skill_level,
  deployment_count_on_machine BIGINT,
  expiring_skills JSONB,
  eligibility_status TEXT
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  WITH reqs AS (
    SELECT msr.skill_id, msr.min_level
    FROM public.machine_skill_requirements msr
    WHERE msr.machine_id = _machine_id
  ),
  candidates AS (
    SELECT a.*
    FROM public.associates a
    WHERE a.status = 'ACTIVE'::public.associate_status
      AND NOT EXISTS (
        SELECT 1 FROM public.associate_availability av
        WHERE av.associate_id = a.associate_id
          AND av.unavailable_date = _date
          AND (av.shift_id IS NULL OR av.shift_id = _shift_id)
      )
      AND NOT EXISTS (
        SELECT 1 FROM public.shift_allocations sa
        WHERE sa.associate_id = a.associate_id
          AND sa.allocation_date = _date
          AND sa.shift_id = _shift_id
          AND sa.status <> 'CANCELLED'::public.allocation_status
      )
  ),
  candidate_eval AS (
    SELECT
      c.associate_id, c.employee_code, c.full_name, c.category,
      (SELECT COUNT(*) FROM reqs) AS total_reqs,
      (
        SELECT COUNT(*) FROM reqs r
        JOIN public.associate_skills ask ON ask.associate_id = c.associate_id AND ask.skill_id = r.skill_id
        WHERE ask.is_valid = TRUE
          AND public.skill_level_rank(ask.skill_level) >= public.skill_level_rank(r.min_level)
          AND (ask.expires_on IS NULL OR ask.expires_on >= _date)
      ) AS met_reqs,
      (
        SELECT COUNT(*) FROM reqs r
        JOIN public.associate_skills ask ON ask.associate_id = c.associate_id AND ask.skill_id = r.skill_id
        WHERE ask.is_valid = TRUE
          AND public.skill_level_rank(ask.skill_level) >= public.skill_level_rank(r.min_level)
          AND ask.expires_on IS NOT NULL AND ask.expires_on BETWEEN _date AND (_date + 30)
      ) AS expiring_soon_count,
      (
        SELECT MAX(ask.skill_level)
        FROM public.associate_skills ask
        WHERE ask.associate_id = c.associate_id
          AND ask.skill_id IN (SELECT skill_id FROM reqs)
      ) AS highest_level,
      (
        SELECT COUNT(*) FROM public.shift_allocations sa
        WHERE sa.associate_id = c.associate_id AND sa.machine_id = _machine_id
          AND sa.status <> 'CANCELLED'::public.allocation_status
      ) AS dep_count,
      (
        SELECT COALESCE(jsonb_agg(jsonb_build_object('skill_name', sc.skill_name, 'expires_on', ask.expires_on)), '[]'::jsonb)
        FROM public.associate_skills ask
        JOIN public.skill_categories sc ON sc.skill_id = ask.skill_id
        WHERE ask.associate_id = c.associate_id
          AND ask.skill_id IN (SELECT skill_id FROM reqs)
          AND ask.expires_on IS NOT NULL AND ask.expires_on BETWEEN _date AND (_date + 30)
      ) AS expiring_payload
    FROM candidates c
  )
  SELECT
    ce.associate_id, ce.employee_code, ce.full_name, ce.category,
    ce.highest_level,
    ce.dep_count,
    ce.expiring_payload,
    CASE
      WHEN ce.met_reqs = ce.total_reqs AND ce.expiring_soon_count > 0 THEN 'ELIGIBLE_EXPIRING_SOON'
      WHEN ce.met_reqs = ce.total_reqs THEN 'ELIGIBLE'
      ELSE 'NOT_ELIGIBLE'
    END
  FROM candidate_eval ce
  WHERE ce.met_reqs = ce.total_reqs
  ORDER BY public.skill_level_rank(ce.highest_level) DESC NULLS LAST, ce.dep_count DESC, ce.full_name ASC;
END;
$$;

CREATE TABLE public.audit_log (
  audit_id BIGSERIAL PRIMARY KEY,
  table_name VARCHAR(60) NOT NULL,
  record_pk TEXT NOT NULL,
  action public.audit_action NOT NULL,
  old_values JSONB,
  new_values JSONB,
  performed_by UUID,
  performed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_lookup ON public.audit_log (table_name, record_pk, performed_at);
GRANT SELECT ON public.audit_log TO authenticated;
GRANT ALL ON public.audit_log TO service_role;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_admin_read" ON public.audit_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'PLANT_ADMIN'::public.app_role));

CREATE OR REPLACE FUNCTION public.audit_trigger()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_pk TEXT;
  v_old JSONB;
  v_new JSONB;
  v_action public.audit_action;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action := 'INSERT'::public.audit_action; v_new := to_jsonb(NEW); v_old := NULL;
    v_pk := COALESCE((v_new->>'allocation_id'), (v_new->>'associate_id'), (v_new->>'machine_id'),
                     (v_new->>'line_id'), (v_new->>'department_id'), (v_new->>'shift_id'),
                     (v_new->>'skill_id'), (v_new->>'assoc_skill_id'), (v_new->>'availability_id'),
                     (v_new->>'user_id'), (v_new->>'id'));
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'UPDATE'::public.audit_action; v_new := to_jsonb(NEW); v_old := to_jsonb(OLD);
    v_pk := COALESCE((v_new->>'allocation_id'), (v_new->>'associate_id'), (v_new->>'machine_id'),
                     (v_new->>'line_id'), (v_new->>'department_id'), (v_new->>'shift_id'),
                     (v_new->>'skill_id'), (v_new->>'assoc_skill_id'), (v_new->>'availability_id'),
                     (v_new->>'user_id'), (v_new->>'id'));
  ELSE
    v_action := 'DELETE'::public.audit_action; v_old := to_jsonb(OLD); v_new := NULL;
    v_pk := COALESCE((v_old->>'allocation_id'), (v_old->>'associate_id'), (v_old->>'machine_id'),
                     (v_old->>'line_id'), (v_old->>'department_id'), (v_old->>'shift_id'),
                     (v_old->>'skill_id'), (v_old->>'assoc_skill_id'), (v_old->>'availability_id'),
                     (v_old->>'user_id'), (v_old->>'id'));
  END IF;

  INSERT INTO public.audit_log(table_name, record_pk, action, old_values, new_values, performed_by)
  VALUES (TG_TABLE_NAME, COALESCE(v_pk, '-'), v_action, v_old, v_new, auth.uid());

  RETURN COALESCE(NEW, OLD);
END;
$$;

DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'departments','production_lines','machines','shifts','skill_categories',
    'machine_skill_requirements','associates','associate_skills',
    'associate_availability','shift_allocations','user_roles','profiles'
  ])
  LOOP
    EXECUTE format('CREATE TRIGGER trg_audit_%I AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();', t, t);
  END LOOP;
END $$;

-- SEED
INSERT INTO public.shifts (shift_name, start_time, end_time) VALUES
  ('A', '06:00', '14:00'), ('B', '14:00', '22:00'), ('C', '22:00', '06:00'), ('G', '09:00', '18:00');

INSERT INTO public.departments (name) VALUES ('Production');

INSERT INTO public.production_lines (line_name, area, department_id)
SELECT v.lname, 'Snacks', d.department_id
FROM (VALUES ('Lay''s Line 1'), ('Kurkure Line 2')) AS v(lname)
CROSS JOIN public.departments d WHERE d.name='Production';

INSERT INTO public.machines (machine_code, machine_name, line_id, min_skill_level)
SELECT v.code, v.mname, pl.line_id, v.lvl::public.skill_level
FROM (VALUES
  ('FRY-01','Fryer Line 1','Lay''s Line 1','CERTIFIED'),
  ('SEAS-01','Seasoning Drum 1','Lay''s Line 1','OPERATOR'),
  ('PACK-01','Packaging VFFS 1','Lay''s Line 1','OPERATOR'),
  ('EXT-01','Extruder 2','Kurkure Line 2','CERTIFIED'),
  ('SEAS-02','Seasoning Drum 2','Kurkure Line 2','OPERATOR'),
  ('PACK-02','Packaging VFFS 2','Kurkure Line 2','OPERATOR')
) AS v(code, mname, lname, lvl)
JOIN public.production_lines pl ON pl.line_name = v.lname;

INSERT INTO public.skill_categories (skill_code, skill_name, description) VALUES
  ('FRY_OP','Fryer Operation','Operate continuous fryers safely'),
  ('FRY_SAFETY','Fryer Safety','Hot oil handling and emergency procedures'),
  ('EXT_OP','Extruder Operation','Operate twin-screw extruders'),
  ('SEAS_OP','Seasoning Application','Operate seasoning drums'),
  ('PACK_OP','Packaging Machine Operation','Operate VFFS packaging machines'),
  ('PACK_QC','Packaging QC','Inline quality checks for packaging'),
  ('FORKLIFT','Forklift Operation','Licensed forklift operation'),
  ('FOOD_SAFETY','Food Safety & Hygiene','GMP, allergen control, HACCP basics');

INSERT INTO public.machine_skill_requirements (machine_id, skill_id, min_level)
SELECT m.machine_id, s.skill_id, v.lvl::public.skill_level
FROM (VALUES
  ('FRY-01','FRY_OP','CERTIFIED'),
  ('FRY-01','FRY_SAFETY','CERTIFIED'),
  ('FRY-01','FOOD_SAFETY','OPERATOR'),
  ('SEAS-01','SEAS_OP','OPERATOR'),
  ('SEAS-01','FOOD_SAFETY','OPERATOR'),
  ('PACK-01','PACK_OP','OPERATOR'),
  ('PACK-01','PACK_QC','OPERATOR'),
  ('EXT-01','EXT_OP','CERTIFIED'),
  ('EXT-01','FOOD_SAFETY','OPERATOR'),
  ('SEAS-02','SEAS_OP','OPERATOR'),
  ('SEAS-02','FOOD_SAFETY','OPERATOR'),
  ('PACK-02','PACK_OP','OPERATOR'),
  ('PACK-02','PACK_QC','OPERATOR')
) AS v(mcode, scode, lvl)
JOIN public.machines m ON m.machine_code = v.mcode
JOIN public.skill_categories s ON s.skill_code = v.scode;

INSERT INTO public.associates (employee_code, full_name, category, department_id, joining_date)
SELECT v.code, v.name, v.cat::public.associate_category, d.department_id, v.jd::date
FROM (VALUES
  ('EMP-0001','Rahul Das','CONTRACT','2022-04-10'),
  ('EMP-0002','Priya Sen','CONTRACT','2022-06-15'),
  ('EMP-0003','Amit Roy','COMPANY_OPERATIVE','2020-01-20'),
  ('EMP-0004','Sneha Ghosh','CONTRACT','2023-02-01'),
  ('EMP-0005','Vikram Singh','SUPERVISOR','2019-09-05'),
  ('EMP-0006','Anita Pal','CONTRACT','2023-08-12'),
  ('EMP-0007','Suman Bose','NTCI','2021-11-30'),
  ('EMP-0008','Ravi Kumar','CONTRACT','2024-01-15')
) AS v(code, name, cat, jd)
CROSS JOIN public.departments d
WHERE d.name = 'Production';

INSERT INTO public.associate_skills (associate_id, skill_id, skill_level, certified_on, expires_on, certified_by)
SELECT a.associate_id, s.skill_id, v.lvl::public.skill_level, v.cert::date, v.exp::date, 'Plant Trainer'
FROM (VALUES
  ('EMP-0001','FRY_OP','CERTIFIED','2023-01-01','2026-01-01'),
  ('EMP-0001','FRY_SAFETY','CERTIFIED','2023-01-01','2026-01-01'),
  ('EMP-0001','FOOD_SAFETY','OPERATOR','2023-01-01','2026-01-01'),
  ('EMP-0002','SEAS_OP','OPERATOR','2023-02-01','2026-02-01'),
  ('EMP-0002','FOOD_SAFETY','OPERATOR','2023-02-01','2026-02-01'),
  ('EMP-0003','PACK_OP','EXPERT','2021-05-01','2026-05-01'),
  ('EMP-0003','PACK_QC','CERTIFIED','2021-05-01','2026-05-01'),
  ('EMP-0003','FOOD_SAFETY','CERTIFIED','2021-05-01','2026-05-01'),
  ('EMP-0004','PACK_OP','OPERATOR','2023-03-01','2026-03-01'),
  ('EMP-0004','PACK_QC','OPERATOR','2023-03-01','2026-03-01'),
  ('EMP-0005','EXT_OP','EXPERT','2020-01-01','2027-01-01'),
  ('EMP-0005','FRY_OP','CERTIFIED','2020-01-01','2027-01-01'),
  ('EMP-0005','FRY_SAFETY','CERTIFIED','2020-01-01','2027-01-01'),
  ('EMP-0005','FOOD_SAFETY','EXPERT','2020-01-01','2027-01-01'),
  ('EMP-0006','SEAS_OP','OPERATOR','2024-01-01','2027-01-01'),
  ('EMP-0006','FOOD_SAFETY','OPERATOR','2024-01-01','2027-01-01'),
  ('EMP-0007','EXT_OP','CERTIFIED','2022-01-01','2025-12-15'),
  ('EMP-0007','FOOD_SAFETY','OPERATOR','2022-01-01','2025-12-15'),
  ('EMP-0008','PACK_OP','TRAINEE','2024-06-01','2025-12-30'),
  ('EMP-0008','FOOD_SAFETY','OPERATOR','2024-06-01','2027-06-01')
) AS v(code, scode, lvl, cert, exp)
JOIN public.associates a ON a.employee_code = v.code
JOIN public.skill_categories s ON s.skill_code = v.scode;
