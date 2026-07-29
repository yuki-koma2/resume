/**
 * ResumeSchema / CareerIntentSchema のスキーマ検証テスト。
 *
 * t-wada 流 TDD で進める：
 *   1. 失敗するテストを書く (Red)
 *   2. 最小実装で通す (Green)
 *   3. リファクタ (Refactor)
 *
 * ここでは「単一ソース YAML が schema を満たすこと」が一次目標。
 * 詳細仕様は task_memory/20260428/resume_update/single_source_design.md を参照。
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

import {
  ResumeSchema,
  CareerIntentSchema,
} from '../scripts/schema/resume.schema';

const REPO_ROOT = path.resolve(__dirname, '..');
const RESUME_YML_PATH = path.join(REPO_ROOT, 'data', 'resume.yml');
const CAREER_INTENT_YML_PATH = path.join(REPO_ROOT, 'data', 'career_intent.yml');

const loadYaml = (p: string): unknown =>
  yaml.load(fs.readFileSync(p, 'utf8'));

describe('ResumeSchema', () => {
  describe('shape', () => {
    test('accepts a minimal valid resume object', () => {
      const minimal = {
        schema_version: '1.0',
        basic: {
          name: 'Test User',
          birth_date: '2000-01-01',
          location: '東京都',
          education: 'Test University',
        },
        accounts: [],
        skills_summary: [],
        tech_stack: { languages: [], frameworks: [], tools: [] },
        tech_proficiency: [],
        experiences: [],
        strengths: [],
        weaknesses: [],
      };
      expect(() => ResumeSchema.parse(minimal)).not.toThrow();
    });

    test('rejects an object missing schema_version', () => {
      const invalid = {
        basic: {
          name: 'Test',
          birth_date: '2000-01-01',
          location: '東京都',
          education: 'Test University',
        },
        accounts: [],
        skills_summary: [],
        tech_stack: { languages: [], frameworks: [], tools: [] },
        tech_proficiency: [],
        experiences: [],
        strengths: [],
        weaknesses: [],
      };
      expect(() => ResumeSchema.parse(invalid)).toThrow();
    });
  });

  describe('experience.parallel_with', () => {
    test('accepts an experience with parallel_with referencing other ids', () => {
      const data = {
        schema_version: '1.0',
        basic: {
          name: 'Test',
          birth_date: '2000-01-01',
          location: '東京都',
          education: 'X',
        },
        accounts: [],
        skills_summary: [],
        tech_stack: { languages: [], frameworks: [], tools: [] },
        tech_proficiency: [],
        experiences: [
          {
            id: 'a',
            type: 'full_time',
            company: 'A',
            period: { start: '2023-04', end: null },
          },
          {
            id: 'b',
            type: 'own_company',
            company: 'B',
            period: { start: '2026-05', end: null },
            parallel_with: ['a'],
          },
        ],
        strengths: [],
        weaknesses: [],
      };
      const parsed = ResumeSchema.parse(data);
      const ownCo = parsed.experiences.find((e) => e.id === 'b');
      expect(ownCo?.parallel_with).toEqual(['a']);
    });
  });

  describe('variants', () => {
    test('defaults item.variants to ["long"] when omitted', () => {
      const data = {
        schema_version: '1.0',
        basic: {
          name: 'Test',
          birth_date: '2000-01-01',
          location: '東京都',
          education: 'X',
        },
        accounts: [],
        skills_summary: [],
        tech_stack: { languages: [], frameworks: [], tools: [] },
        tech_proficiency: [],
        experiences: [
          {
            id: 'a',
            type: 'full_time',
            company: 'A',
            period: { start: '2023-04', end: null },
          },
        ],
        strengths: [],
        weaknesses: [],
      };
      const parsed = ResumeSchema.parse(data);
      expect(parsed.experiences[0].variants).toEqual(['long']);
    });

    test('rejects unknown variant labels', () => {
      const data = {
        schema_version: '1.0',
        basic: {
          name: 'Test',
          birth_date: '2000-01-01',
          location: '東京都',
          education: 'X',
        },
        accounts: [],
        skills_summary: [],
        tech_stack: { languages: [], frameworks: [], tools: [] },
        tech_proficiency: [],
        experiences: [
          {
            id: 'a',
            type: 'full_time',
            company: 'A',
            period: { start: '2023-04', end: null },
            variants: ['mega'],
          },
        ],
        strengths: [],
        weaknesses: [],
      };
      expect(() => ResumeSchema.parse(data)).toThrow();
    });
  });
});

describe('CareerIntentSchema', () => {
  test('accepts a minimal valid career intent', () => {
    const minimal = {
      schema_version: '1.0',
      current_phase: 'placeholder',
      motivation: 'placeholder',
      conditions: [],
    };
    expect(() => CareerIntentSchema.parse(minimal)).not.toThrow();
  });
});

describe('YAML data files', () => {
  test('data/resume.yml loads and validates against ResumeSchema', () => {
    const raw = loadYaml(RESUME_YML_PATH);
    expect(() => ResumeSchema.parse(raw)).not.toThrow();
  });

  test('data/career_intent.yml loads and validates against CareerIntentSchema', () => {
    const raw = loadYaml(CAREER_INTENT_YML_PATH);
    expect(() => CareerIntentSchema.parse(raw)).not.toThrow();
  });

  test('data/resume.yml has unique experience ids', () => {
    const raw = loadYaml(RESUME_YML_PATH);
    const data = ResumeSchema.parse(raw);
    const ids = data.experiences.map((e) => e.id);
    const uniq = new Set(ids);
    expect(ids.length).toBe(uniq.size);
  });

  test('data/resume.yml: every parallel_with reference points to an existing experience', () => {
    const raw = loadYaml(RESUME_YML_PATH);
    const data = ResumeSchema.parse(raw);
    const ids = new Set(data.experiences.map((e) => e.id));
    for (const exp of data.experiences) {
      for (const ref of exp.parallel_with ?? []) {
        expect(ids.has(ref)).toBe(true);
      }
    }
  });
});
