-- Smart OPD: PostgreSQL reference schema based on the supplied ERD.
-- Not connected to the frontend demo. Apply only to a new development database.
CREATE TABLE account (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  username varchar(150) NOT NULL UNIQUE,
  password_hash text NOT NULL,
  full_name varchar(150) NOT NULL,
  employee_code varchar(50) UNIQUE,
  role varchar(20) NOT NULL CHECK (role IN ('admin','coordinator','doctor')),
  status varchar(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active','locked')),
  created_at timestamptz NOT NULL DEFAULT now(),
  last_login_at timestamptz
);
CREATE TABLE login_session (
  id uuid PRIMARY KEY,
  account_id bigint NOT NULL REFERENCES account(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  ended_at timestamptz,
  end_reason text
);
CREATE TABLE system_log (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  account_id bigint REFERENCES account(id),
  operation varchar(50) NOT NULL,
  object_type varchar(50),
  object_id varchar(100),
  detail jsonb NOT NULL DEFAULT '{}',
  occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE service_configuration (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name varchar(150) NOT NULL,
  resource_count integer NOT NULL CHECK (resource_count > 0),
  average_service_minutes numeric NOT NULL CHECK (average_service_minutes > 0),
  queue_capacity integer NOT NULL CHECK (queue_capacity > 0),
  result_wait_minutes numeric NOT NULL DEFAULT 0 CHECK (result_wait_minutes >= 0)
);
CREATE TABLE activity (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  service_configuration_id bigint REFERENCES service_configuration(id),
  name varchar(150) NOT NULL,
  stage varchar(50) NOT NULL,
  required_order integer,
  eligible_population jsonb NOT NULL DEFAULT '{}',
  produces_result boolean NOT NULL DEFAULT false
);
CREATE TABLE encounter (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  patient_code varchar(50) NOT NULL,
  patient_name varchar(150) NOT NULL,
  gender varchar(20),
  age integer CHECK (age >= 0 AND age <= 120),
  marital_status varchar(30),
  status varchar(30) NOT NULL DEFAULT 'waiting',
  priority integer NOT NULL DEFAULT 0,
  arrived_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  coordinator_id bigint REFERENCES account(id)
);
CREATE TABLE encounter_activity (
  encounter_id bigint NOT NULL REFERENCES encounter(id),
  activity_id bigint NOT NULL REFERENCES activity(id),
  doctor_id bigint REFERENCES account(id),
  status varchar(30) NOT NULL DEFAULT 'pending',
  started_at timestamptz,
  completed_at timestamptz,
  notes text,
  PRIMARY KEY (encounter_id, activity_id)
);
CREATE TABLE activity_event (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  encounter_id bigint NOT NULL REFERENCES encounter(id),
  activity_id bigint NOT NULL REFERENCES activity(id),
  lifecycle_stage varchar(50) NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  is_override boolean NOT NULL DEFAULT false
);
CREATE TABLE suggestion (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  encounter_id bigint NOT NULL REFERENCES encounter(id),
  activity_id bigint REFERENCES activity(id),
  suggestion_type varchar(50) NOT NULL,
  confidence numeric CHECK (confidence >= 0 AND confidence <= 1),
  is_fallback boolean NOT NULL DEFAULT false,
  latency_ms integer CHECK (latency_ms >= 0),
  payload jsonb NOT NULL DEFAULT '{}',
  status varchar(30) NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE override_reason (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name varchar(200) NOT NULL,
  enabled boolean NOT NULL DEFAULT true
);
CREATE TABLE ai_decision (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  suggestion_id bigint NOT NULL UNIQUE REFERENCES suggestion(id),
  encounter_id bigint NOT NULL REFERENCES encounter(id),
  account_id bigint NOT NULL REFERENCES account(id),
  decision_type varchar(20) NOT NULL CHECK (decision_type IN ('accept','override','reject')),
  override_reason_id bigint REFERENCES override_reason(id),
  reason_detail text,
  alternative_action jsonb,
  decided_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE dispatch_method (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name varchar(150) NOT NULL,
  method_type varchar(20) NOT NULL CHECK (method_type IN ('ai','heuristic','optimization')),
  branch_code varchar(50),
  realtime_supported boolean NOT NULL DEFAULT false,
  realtime_enabled boolean NOT NULL DEFAULT false,
  enabled boolean NOT NULL DEFAULT true,
  model_parameters jsonb NOT NULL DEFAULT '{}'
);
CREATE TABLE simulation_scenario (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  admin_id bigint NOT NULL REFERENCES account(id),
  dispatch_method_id bigint REFERENCES dispatch_method(id),
  name varchar(150) NOT NULL,
  description text,
  queue_type varchar(20) NOT NULL CHECK (queue_type IN ('static','priority','random')),
  patient_count integer NOT NULL CHECK (patient_count > 0),
  mean_arrival_interval numeric CHECK (mean_arrival_interval > 0),
  male_ratio numeric CHECK (male_ratio >= 0 AND male_ratio <= 1),
  married_ratio numeric CHECK (married_ratio >= 0 AND married_ratio <= 1),
  base_seed bigint NOT NULL,
  repetitions integer NOT NULL DEFAULT 1 CHECK (repetitions > 0),
  resource_configuration jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE simulation_job (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  scenario_id bigint NOT NULL REFERENCES simulation_scenario(id),
  status varchar(20) NOT NULL DEFAULT 'pending',
  processed_count integer NOT NULL DEFAULT 0,
  total_count integer NOT NULL,
  current_repetition integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz,
  error_message text
);
CREATE TABLE simulation_result (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  scenario_id bigint NOT NULL REFERENCES simulation_scenario(id),
  job_id bigint NOT NULL REFERENCES simulation_job(id),
  repetition integer NOT NULL,
  seed bigint NOT NULL,
  average_wait_minutes numeric NOT NULL,
  completed_patients integer NOT NULL,
  congestion_data jsonb NOT NULL DEFAULT '{}',
  UNIQUE (job_id,repetition)
);
CREATE INDEX encounter_status_idx ON encounter(status, priority, arrived_at);
CREATE INDEX system_log_time_idx ON system_log(occurred_at DESC);
CREATE INDEX suggestion_pending_idx ON suggestion(status, created_at);
