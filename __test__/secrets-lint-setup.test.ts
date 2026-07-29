import * as fs from "fs";
import * as path from "path";

const repoRoot = path.resolve(__dirname, "..");

describe("ローカル限定の機密検知 lint セットアップ（CLAUDE.md「task_memory の機密性ポリシー」参照）", () => {
  describe(".textlintrc.local.json", () => {
    const configPath = path.join(repoRoot, ".textlintrc.local.json");

    it("ファイルが存在する", () => {
      expect(fs.existsSync(configPath)).toBe(true);
    });

    it("有効な JSON で、prh ルールが定義されている", () => {
      const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      expect(config.rules?.prh).toBeDefined();
    });

    it("prh が gitignore された prh_secrets.yml を import している", () => {
      const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      const rulePaths: string[] = config.rules.prh.rulePaths ?? [];
      expect(rulePaths.some((p) => p.includes("prh_secrets.yml"))).toBe(true);
    });
  });

  describe("dictionary/prh_secrets.yml.example", () => {
    const examplePath = path.join(repoRoot, "dictionary/prh_secrets.yml.example");

    it("テンプレートファイルが存在する", () => {
      expect(fs.existsSync(examplePath)).toBe(true);
    });
  });

  describe(".gitignore", () => {
    it("dictionary/prh_secrets.yml が除外されている", () => {
      const content = fs.readFileSync(path.join(repoRoot, ".gitignore"), "utf-8");
      expect(content).toMatch(/dictionary\/prh_secrets\.yml$/m);
    });
  });

  describe("scripts/hooks/pre-commit", () => {
    const hookPath = path.join(repoRoot, "scripts/hooks/pre-commit");

    it("ファイルが存在する", () => {
      expect(fs.existsSync(hookPath)).toBe(true);
    });

    it("実行可能ビットが立っている", () => {
      const stat = fs.statSync(hookPath);
      expect(stat.mode & 0o111).toBeTruthy();
    });

    it("task_memory/ のステージングを拒否する処理を含む", () => {
      const content = fs.readFileSync(hookPath, "utf-8");
      expect(content).toMatch(/task_memory/);
    });

    it("dictionary/prh_secrets.yml が無いとき fail する処理を含む（β: 厳格）", () => {
      const content = fs.readFileSync(hookPath, "utf-8");
      expect(content).toMatch(/prh_secrets\.yml/);
      expect(content).toMatch(/exit\s+1/);
    });
  });

  describe("scripts/install-hooks.sh", () => {
    const installerPath = path.join(repoRoot, "scripts/install-hooks.sh");

    it("ファイルが存在する", () => {
      expect(fs.existsSync(installerPath)).toBe(true);
    });

    it("実行可能ビットが立っている", () => {
      const stat = fs.statSync(installerPath);
      expect(stat.mode & 0o111).toBeTruthy();
    });
  });

  describe("package.json", () => {
    const pkg = JSON.parse(
      fs.readFileSync(path.join(repoRoot, "package.json"), "utf-8")
    );

    it("lint:secrets スクリプトが定義されている", () => {
      expect(pkg.scripts?.["lint:secrets"]).toBeDefined();
    });

    it("lint:secrets が .textlintrc.local.json を参照している", () => {
      expect(pkg.scripts["lint:secrets"]).toMatch(/\.textlintrc\.local\.json/);
    });

    it("lint:secrets が docs/README.md / README_generated.md / README_summary.md を対象にしている", () => {
      const cmd: string = pkg.scripts["lint:secrets"];
      expect(cmd).toMatch(/docs\/README\.md/);
      expect(cmd).toMatch(/docs\/README_generated\.md/);
      expect(cmd).toMatch(/docs\/README_summary\.md/);
    });
  });
});
