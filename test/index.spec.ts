import {assert} from "chai";

import fs from "fs";
import path from "path";

import JsonProcessor from "../src/index.js";

const processor = new JsonProcessor("test");

function processAndCompare(filename: string) {
  const inDoc = fs.readFileSync(path.join('test', 'fixtures', filename), { encoding: 'utf-8' });

  const doc = processor.parse(inDoc);
  const docStr = JSON.stringify(doc);

  const outDoc = processor.stringify(doc);

  const outDocStructure = processor.parse(outDoc);

  const outDocStructureStr = JSON.stringify(outDocStructure);

  assert.equal(outDocStructureStr, docStr);

  console.log(filename);
}

describe('JsonProcessorTest', function() {
  it('documents should be equal', function() {
    processAndCompare('simple.json');
    processAndCompare('matesics.json');
    processAndCompare('footer.json');
  });
});



