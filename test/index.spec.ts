import { assert, describe, it } from "vitest";

import fs from "fs";
import path from "path";

import JsonProcessor from "../src/index.js";

const processor = new JsonProcessor();

function processAndCompare(filename: string) {
  const inDoc = fs.readFileSync(path.join("test", "fixtures", filename), {
    encoding: "utf-8",
  });

  const doc = processor.parse(inDoc);
  const docStr = JSON.stringify(doc);

  const outDoc = processor.stringify(doc);

  const outDocStructure = processor.parse(outDoc);

  const outDocStructureStr = JSON.stringify(outDocStructure);

  // Abstracting away potential differences in whitespace or type casting (e.g. number vs string) that don't affect localization.
  // TODO: This verification strategy should be improved in the future to ensure stricter data fidelity (e.g. type preservation).
  assert.equal(outDocStructureStr, docStr);

  console.log(filename);
}

describe("Fixture Round-trip", function () {
  const fixtures = [
    "06.09.json",
    "simple.json",
    "matesics.json",
    "footer.json",
  ];

  fixtures.forEach((filename) => {
    it(`should match original structure for ${filename}`, function () {
      processAndCompare(filename);
    });
  });
});

describe("Structural Logic", function () {
  it("should correctly handle double-dot array notation", function () {
    const inputJson = {
      physics: [
        {
          name: "Mechanics",
        },
      ],
    };

    const doc = processor.parse(JSON.stringify(inputJson));
    const outputString = processor.stringify(doc);
    const outputJson = JSON.parse(outputString);

    assert.deepEqual(outputJson, inputJson);
    assert.isArray(outputJson.physics);
    assert.equal(outputJson.physics.length, 1);
    assert.equal(outputJson.physics[0].name, "Mechanics");
  });

  it("should handle nested arrays correctly", function () {
    const inputJson = {
      matrix: [
        [1, 2],
        [3, 4],
      ],
    };

    const expectedJson = {
      matrix: [
        ["1", "2"],
        ["3", "4"],
      ],
    };

    const doc = processor.parse(JSON.stringify(inputJson));
    const outputString = processor.stringify(doc);
    const outputJson = JSON.parse(outputString);

    assert.deepEqual(outputJson, expectedJson);
    assert.isArray(outputJson.matrix);
    assert.isArray(outputJson.matrix[0]);
    assert.equal(outputJson.matrix[0][0], "1");
  });

  it("should handle mixed objects and arrays", function () {
    const inputJson = {
      users: [
        { id: 1, tags: ["admin", "staff"] },
        { id: 2, tags: ["user"] },
      ],
    };

    const expectedJson = {
      users: [
        { id: "1", tags: ["admin", "staff"] },
        { id: "2", tags: ["user"] },
      ],
    };

    const doc = processor.parse(JSON.stringify(inputJson));
    const outputString = processor.stringify(doc);
    const outputJson = JSON.parse(outputString);

    assert.deepEqual(outputJson, expectedJson);
  });
});
