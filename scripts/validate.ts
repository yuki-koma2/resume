/**
 * YAML を Zod スキーマで検証するだけの軽量スクリプト。
 * 失敗時は exit 1 を返すので CI のゲートに使える。
 *
 * 使い方: npm run validate
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

import {
    ResumeSchema,
    CareerIntentSchema,
} from './schema/resume.schema';

const REPO_ROOT = path.resolve(__dirname, '..');

const validate = (): void => {
    const resume = ResumeSchema.parse(
        yaml.load(fs.readFileSync(path.join(REPO_ROOT, 'data', 'resume.yml'), 'utf8'))
    );
    const intent = CareerIntentSchema.parse(
        yaml.load(
            fs.readFileSync(path.join(REPO_ROOT, 'data', 'career_intent.yml'), 'utf8')
        )
    );

    // eslint-disable-next-line no-console
    console.log(
        `✔ resume.yml: ${resume.experiences.length} experiences, ${resume.strengths.length} strengths, ${resume.weaknesses.length} weaknesses`
    );
    // eslint-disable-next-line no-console
    console.log(`✔ career_intent.yml: ${intent.conditions.length} conditions`);
};

validate();
