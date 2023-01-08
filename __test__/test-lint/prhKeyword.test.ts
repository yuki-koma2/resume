import { TextLintEngine } from "textlint";

describe('text lint test', function () {
    it('should pass', function () {
        const engine = new TextLintEngine({
            rulePaths: ["./"]
        });
        engine.executeOnFiles(["README.md"]).then((results) => {
            console.log(results[0].filePath); // => "README.md"
            // messages are `TextLintMessage` array.
            console.log(results[0].messages);
            /*
            [
                {
                    id: "rule-name",
                    message:"lint message",
                    line: 1, // 1-based columns(TextLintMessage)
                    column:1 // 1-based columns(TextLintMessage)
                }
            ]
             */
            if (engine.isErrorResults(results)) {
                const output = engine.formatResults(results);
                console.log(output);
            }
        });
        expect("a").toBe(3);
    });

});

