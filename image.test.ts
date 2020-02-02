import * as Image from './image'

describe("reverseBits", () => {
    test.each
    `toReverse | expected
        ${128} | ${1}
        ${127} | ${254}
        ${255} | ${255}
        ${254} | ${127}
        ${0}   | ${0}
        ${20}  | ${40}
        ${72}  | ${18}
        ${27}  | ${216}
        ${55}  | ${236}`
  ('returns $expected when $toReverse reversed', ({toReverse, expected}) => {
    var image = new Image.Main();
    expect(image.reverseBits(toReverse)).toEqual(expected);
  });
});

describe("EndMarker", () => {
    test.each
    `inText
    ${''}
    ${'1'}
    ${'12'}
    ${'123'}
    ${'12345'}
    ${'123456'}`
  ('$inText returns 0 when result % 3 is tested', ({inText}) => {
    let image = new Image.Main();
    let result = image.EndMarker(inText);
    expect((inText.length + result.length) % 3).toEqual(0);
  });
});

describe("JSON.parse", () => {
  test.each
  `inTextLength
  ${1}
  ${1000}
  ${10000}
  ${100000}
  ${1000000}
  ${10000000}
  ${100000000}`
('$inTextLength length string is parsed correctly by JSON.parse', ({inTextLength}) => {
  let str = 'a';
  let strRepeated = str.repeat(inTextLength);
  let obj = {strRepeated: strRepeated};
  let objStringified = JSON.stringify(obj);
  let objStringifiedParsed = JSON.parse(objStringified);
  expect(objStringifiedParsed).toEqual(obj);
});
});