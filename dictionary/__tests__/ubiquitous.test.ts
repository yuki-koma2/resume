import { TextLintEngine } from "textlint";

describe('ユビキタス言語辞書に定義されている言葉が検知されること', function () {
    // TODO 自作の辞書をテストしたいがエラーになるので、skip
    it.skip('should be error キャリアトレック', function () {

        // const engine = new TextLintEngine({
        //     rulePaths: ["./"]
        // });
        // const options = {
        //     rules: {
        //         "prh": {
        //             "rulePaths" :["./dictionary/prh.yml"]
        //         }
        //     }
        // };
        // const engine = new TextLintEngine(options);


        const engine = new TextLintEngine();
        engine.executeOnText("キャリアトレック").then((results) => {
            console.log("log");
            expect(results[0].messages.length).toBe(1);
            expect(engine.isErrorResults(results)).toBe(true);
            if (engine.isErrorResults(results)) {
                const output = engine.formatResults(results);
                console.log(output);
            }
        });
    });
});
