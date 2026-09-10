-- FitTrack Supabase Database Schema & RLS Security Policies
-- Run this SQL in your Supabase SQL Editor to set up tables and security policies.

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    role TEXT NOT NULL CHECK (role IN ('coach', 'client')) DEFAULT 'client',
    assigned_coach_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    target_weight NUMERIC(5,2),
    status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'pending')) DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure target_weight and coach profile columns exist on existing installations
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS target_weight NUMERIC(5,2);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS coach_title TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS coach_bio TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS coach_philosophy TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS certifications TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS achievements TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS specialties TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS experience_years INTEGER DEFAULT 5;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS instagram_handle TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS has_set_coach_profile BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS has_set_name BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- 3. Create Diet Plans Table
CREATE TABLE IF NOT EXISTS public.diet_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    coach_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    daily_calorie_target INTEGER NOT NULL DEFAULT 2000,
    protein_grams INTEGER NOT NULL DEFAULT 150,
    carbs_grams INTEGER NOT NULL DEFAULT 200,
    fat_grams INTEGER NOT NULL DEFAULT 65,
    meals JSONB NOT NULL DEFAULT '[]'::jsonb,
    day_plans JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure day_plans column exists on existing installations
ALTER TABLE public.diet_plans ADD COLUMN IF NOT EXISTS day_plans JSONB DEFAULT '{}'::jsonb;

-- 4. Create Exercise Plans Table
CREATE TABLE IF NOT EXISTS public.exercise_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    coach_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    day_of_week TEXT NOT NULL,
    target_muscle TEXT,
    is_rest_day BOOLEAN DEFAULT false,
    exercises JSONB NOT NULL DEFAULT '[]'::jsonb,
    day_routines JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure day_routines, target_muscle, is_rest_day columns exist on existing installations
ALTER TABLE public.exercise_plans ADD COLUMN IF NOT EXISTS day_routines JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.exercise_plans ADD COLUMN IF NOT EXISTS target_muscle TEXT;
ALTER TABLE public.exercise_plans ADD COLUMN IF NOT EXISTS is_rest_day BOOLEAN DEFAULT false;

-- 5. Create Reminders Table
CREATE TABLE IF NOT EXISTS public.reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    coach_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    scheduled_time TEXT NOT NULL,
    recurring_days TEXT[] NOT NULL DEFAULT ARRAY['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Create Logs Table
CREATE TABLE IF NOT EXISTS public.logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    weight_lbs NUMERIC(5,2),
    water_intake_oz NUMERIC(5,2) DEFAULT 0,
    sleep_hours NUMERIC(3,1),
    energy_rating INTEGER CHECK (energy_rating BETWEEN 1 AND 5),
    completed_diet BOOLEAN DEFAULT false,
    completed_workout BOOLEAN DEFAULT false,
    logged_meals JSONB DEFAULT '[]'::jsonb,
    logged_exercises JSONB DEFAULT '[]'::jsonb,
    coach_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_client_date UNIQUE (client_id, date)
);

-- Ensure water_intake_oz column supports decimal liters on existing installations
ALTER TABLE public.logs ALTER COLUMN water_intake_oz TYPE NUMERIC(5,2);

-- 7. Automatic Updated At Trigger Function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_diet_plans_updated_at ON public.diet_plans;
CREATE TRIGGER set_diet_plans_updated_at BEFORE UPDATE ON public.diet_plans FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_exercise_plans_updated_at ON public.exercise_plans;
CREATE TRIGGER set_exercise_plans_updated_at BEFORE UPDATE ON public.exercise_plans FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_reminders_updated_at ON public.reminders;
CREATE TRIGGER set_reminders_updated_at BEFORE UPDATE ON public.reminders FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_logs_updated_at ON public.logs;
CREATE TRIGGER set_logs_updated_at BEFORE UPDATE ON public.logs FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 8. Automatic Profile Creation Trigger on OAuth Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url, role, has_set_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url',
        CASE WHEN LOWER(NEW.email) = 'muhammadahsan0812@gmail.com' THEN 'coach' ELSE 'client' END,
        FALSE
    )
    ON CONFLICT (id) DO UPDATE
    SET
        full_name = public.profiles.full_name,
        avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Mandatory Security Layer. UI routing does not replace database security.
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diet_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;

-- Helper function to check if auth.uid() is the Head Coach
CREATE OR REPLACE FUNCTION public.is_coach()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN COALESCE(
        (SELECT (LOWER(email) = 'muhammadahsan0812@gmail.com')
         FROM public.profiles
         WHERE id = auth.uid()),
        FALSE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- PROFILES POLICIES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Profiles insert access" ON public.profiles;
CREATE POLICY "Profiles insert access" ON public.profiles
    FOR INSERT WITH CHECK (
        auth.uid() = id
    );

DROP POLICY IF EXISTS "Profiles read access" ON public.profiles;
CREATE POLICY "Profiles read access" ON public.profiles
    FOR SELECT USING (
        auth.uid() = id OR public.is_coach() OR role = 'coach' OR email = 'muhammadahsan0812@gmail.com' OR assigned_coach_id = auth.uid()
    );

DROP POLICY IF EXISTS "Profiles update access" ON public.profiles;
CREATE POLICY "Profiles update access" ON public.profiles
    FOR UPDATE USING (
        auth.uid() = id OR public.is_coach()
    );

-- ----------------------------------------------------------------------------
-- DIET PLANS POLICIES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Diet plans select" ON public.diet_plans;
CREATE POLICY "Diet plans select" ON public.diet_plans
    FOR SELECT USING (
        client_id = auth.uid() OR public.is_coach()
    );

DROP POLICY IF EXISTS "Diet plans coach insert" ON public.diet_plans;
CREATE POLICY "Diet plans coach insert" ON public.diet_plans
    FOR INSERT WITH CHECK (
        public.is_coach()
    );

DROP POLICY IF EXISTS "Diet plans coach update" ON public.diet_plans;
DROP POLICY IF EXISTS "Diet plans update access" ON public.diet_plans;
CREATE POLICY "Diet plans update access" ON public.diet_plans
    FOR UPDATE USING (
        client_id = auth.uid() OR public.is_coach()
    );

DROP POLICY IF EXISTS "Diet plans coach delete" ON public.diet_plans;
CREATE POLICY "Diet plans coach delete" ON public.diet_plans
    FOR DELETE USING (
        public.is_coach()
    );

-- ----------------------------------------------------------------------------
-- EXERCISE PLANS POLICIES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Exercise plans select" ON public.exercise_plans;
CREATE POLICY "Exercise plans select" ON public.exercise_plans
    FOR SELECT USING (
        client_id = auth.uid() OR public.is_coach()
    );

DROP POLICY IF EXISTS "Exercise plans coach insert" ON public.exercise_plans;
CREATE POLICY "Exercise plans coach insert" ON public.exercise_plans
    FOR INSERT WITH CHECK (
        public.is_coach()
    );

DROP POLICY IF EXISTS "Exercise plans coach update" ON public.exercise_plans;
DROP POLICY IF EXISTS "Exercise plans update access" ON public.exercise_plans;
CREATE POLICY "Exercise plans update access" ON public.exercise_plans
    FOR UPDATE USING (
        client_id = auth.uid() OR public.is_coach()
    );

DROP POLICY IF EXISTS "Exercise plans coach delete" ON public.exercise_plans;
CREATE POLICY "Exercise plans coach delete" ON public.exercise_plans
    FOR DELETE USING (
        public.is_coach()
    );

-- ----------------------------------------------------------------------------
-- REMINDERS POLICIES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Reminders select" ON public.reminders;
CREATE POLICY "Reminders select" ON public.reminders
    FOR SELECT USING (
        client_id = auth.uid() OR public.is_coach()
    );

DROP POLICY IF EXISTS "Reminders coach insert" ON public.reminders;
CREATE POLICY "Reminders coach insert" ON public.reminders
    FOR INSERT WITH CHECK (
        public.is_coach()
    );

DROP POLICY IF EXISTS "Reminders coach update" ON public.reminders;
CREATE POLICY "Reminders coach update" ON public.reminders
    FOR UPDATE USING (
        public.is_coach()
    );

DROP POLICY IF EXISTS "Reminders coach delete" ON public.reminders;
CREATE POLICY "Reminders coach delete" ON public.reminders
    FOR DELETE USING (
        public.is_coach()
    );

-- ----------------------------------------------------------------------------
-- LOGS POLICIES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Logs client select" ON public.logs;
CREATE POLICY "Logs client select" ON public.logs
    FOR SELECT USING (
        client_id = auth.uid() OR public.is_coach()
    );

DROP POLICY IF EXISTS "Logs client insert" ON public.logs;
CREATE POLICY "Logs client insert" ON public.logs
    FOR INSERT WITH CHECK (
        client_id = auth.uid()
    );

DROP POLICY IF EXISTS "Logs client update" ON public.logs;
CREATE POLICY "Logs client update" ON public.logs
    FOR UPDATE USING (
        client_id = auth.uid() OR public.is_coach()
    );

-- ============================================================================
-- COACH TRANSFORMATIONS
-- Before/after transformation photos managed by the coach
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.coach_transformations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    coach_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    before_image_url TEXT,
    after_image_url TEXT,
    is_published BOOLEAN NOT NULL DEFAULT false,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_coach_transformations_coach_id
    ON public.coach_transformations(coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_transformations_published
    ON public.coach_transformations(coach_id, is_published, sort_order);

-- Updated-at trigger
DROP TRIGGER IF EXISTS set_coach_transformations_updated_at ON public.coach_transformations;
CREATE TRIGGER set_coach_transformations_updated_at
    BEFORE UPDATE ON public.coach_transformations
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS
ALTER TABLE public.coach_transformations ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- COACH TRANSFORMATIONS POLICIES
-- ----------------------------------------------------------------------------

-- Coach: full CRUD on own transformations
DROP POLICY IF EXISTS "Transformations coach select" ON public.coach_transformations;
CREATE POLICY "Transformations coach select" ON public.coach_transformations
    FOR SELECT USING (
        public.is_coach() AND coach_id = auth.uid()
    );

DROP POLICY IF EXISTS "Transformations coach insert" ON public.coach_transformations;
CREATE POLICY "Transformations coach insert" ON public.coach_transformations
    FOR INSERT WITH CHECK (
        public.is_coach() AND coach_id = auth.uid()
    );

DROP POLICY IF EXISTS "Transformations coach update" ON public.coach_transformations;
CREATE POLICY "Transformations coach update" ON public.coach_transformations
    FOR UPDATE USING (
        public.is_coach() AND coach_id = auth.uid()
    );

DROP POLICY IF EXISTS "Transformations coach delete" ON public.coach_transformations;
CREATE POLICY "Transformations coach delete" ON public.coach_transformations
    FOR DELETE USING (
        public.is_coach() AND coach_id = auth.uid()
    );

-- Clients: read published transformations from their assigned coach only
DROP POLICY IF EXISTS "Transformations client select published" ON public.coach_transformations;
CREATE POLICY "Transformations client select published" ON public.coach_transformations
    FOR SELECT USING (
        is_published = true
        AND coach_id IN (
            SELECT assigned_coach_id FROM public.profiles WHERE id = auth.uid()
        )
    );

-- ============================================================================
-- SUPABASE STORAGE: Create a 'transformations' bucket (public) via Dashboard
-- or via SQL:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('transformations', 'transformations', true)
-- ON CONFLICT (id) DO NOTHING;
--
-- Storage RLS: allow coach to upload/delete, allow public read
-- ============================================================================
