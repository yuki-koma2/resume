/**
 * 単一ソース YAML（data/resume.yml, data/career_intent.yml）の構造定義。
 *
 * 設計詳細: task_memory/20260428/resume_update/single_source_design.md §3
 *
 * variants 切り分けは A. 明示タグ式（決定 #2）。
 * 各エントリは variants: ["long"] | ["long","short"] | ["long","short","en"] のいずれかを持つ。
 * 省略時は ["long"] を既定値とする。
 */

import { z } from 'zod';

const Variant = z.enum(['long', 'short', 'en']);
const variantsField = z.array(Variant).default(['long']);

const YearMonth = z.string().regex(/^\d{4}-\d{2}$/, {
  message: 'YYYY-MM の形式で指定してください（例: "2023-04"）',
});

const Period = z.object({
  start: YearMonth,
  end: YearMonth.nullable(),
});

const EmploymentPhase = z.object({
  from: YearMonth,
  to: YearMonth.nullable(),
  form: z.string(),
});

const SubItem = z.object({
  name: z.string(),
  period: z.string(),
  body: z.string().optional(),
});

const Achievement = z.object({
  id: z.string().optional(),
  body: z.string(),
  tags: z.array(z.string()).optional(),
});

const Role = z.object({
  id: z.string(),
  title: z.string(),
  period: Period,
  domains: z.array(z.string()).optional(),
  team_size: z.union([z.string(), z.record(z.string(), z.unknown())]).optional(),
  description: z.string().optional(),
  achievements: z.array(Achievement).optional(),
  tech: z.array(z.string()).optional(),
  concurrent_with: z.array(z.string()).optional(),
  sub_items: z.array(SubItem).optional(),
  variants: variantsField,
});

const ExperienceType = z.enum([
  'own_company',
  'full_time',
  'side_job',
  'internship',
  'volunteer',
  'short_project',
]);

const Experience = z.object({
  id: z.string(),
  type: ExperienceType,
  company: z.string(),
  role_label: z.string().optional(),
  period: Period,
  employment_phases: z.array(EmploymentPhase).optional(),
  parallel_with: z.array(z.string()).optional(),
  summary: z.string().optional(),
  summary_public: z.string().optional(),
  description: z.string().optional(),
  tech: z.array(z.string()).optional(),
  roles: z.array(Role).optional(),
  variants: variantsField,
});

const Account = z.object({
  type: z.string(),
  url: z.string().url(),
  label: z.string(),
});

const TechProficiency = z.object({
  name: z.string(),
  years: z.string(),
});

const TechStack = z.object({
  languages: z.array(z.string()),
  frameworks: z.array(z.string()),
  tools: z.array(z.string()),
});

const BasicInfo = z.object({
  name: z.string(),
  birth_date: z.string(),
  location: z.string(),
  education: z.string(),
});

const StrengthOrWeakness = z.object({
  id: z.string(),
  label: z.string(),
  body: z.string(),
  source: z.string().optional(),
  variants: variantsField,
});

export const ResumeSchema = z.object({
  schema_version: z.string(),
  last_synced_with_lapras: z.string().optional(),
  basic: BasicInfo,
  accounts: z.array(Account),
  skills_summary: z.array(z.string()),
  tech_stack: TechStack,
  tech_proficiency: z.array(TechProficiency),
  experiences: z.array(Experience),
  strengths: z.array(StrengthOrWeakness),
  weaknesses: z.array(StrengthOrWeakness),
});

export type Resume = z.infer<typeof ResumeSchema>;

export const CareerIntentSchema = z.object({
  schema_version: z.string(),
  current_phase: z.string(),
  motivation: z.string(),
  conditions: z.array(z.string()),
  variants: variantsField,
});

export type CareerIntent = z.infer<typeof CareerIntentSchema>;
