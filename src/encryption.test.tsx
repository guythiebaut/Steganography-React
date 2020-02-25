import * as encryption from './encryption'



describe("FileProcessed", () => {
  test.each
  `inMessage1  | inMessage2 | inMessage3 | expected
      ${'this '} | ${'is '}   | ${'a test'}   | ${'this is a test'}
      ${'this '} | ${'is '}   | ${'another test'}   | ${'this is another test'}`
('returns $expected', ({inMessage1, inMessage2, inMessage3, expected}) => {
  var messageUnits: encryption.MessageUnit[] = [];
      
  messageUnits.push(new encryption.MessageUnit(inMessage2,'','',2,3,false));
  messageUnits.push(new encryption.MessageUnit(inMessage1,'','',1,3,false));
  messageUnits.push(new encryption.MessageUnit(inMessage3,'','',3,3,false));

  let unpacker = new encryption.MessageUnPacker([],'','');
  let result = unpacker.MessageFromFiles(messageUnits);
  expect(result).toEqual(expected);
  });
});


describe("FileSetValidated", () => {
    test.each
    `inFileset1  | inFileset2 | inFileset3 | inFilesetCheck| expected
        ${'abc1'} | ${'abc1'}   | ${'abc1'}   |  ${'abc1'}   | ${true}
        ${'abc2'} | ${'abc2'}   | ${'abc2'}   |  ${'abb2'}   | ${false}
        ${'abc3'} | ${'abc3'}   | ${'abb3'}   |  ${'abc3'}   | ${false}
        ${'abc4'} | ${'abc4'}   | ${'abb4'}   |  ${'abb4'}   | ${false}`
  ('returns $expected for fileset $inFilesetCheck', ({inFileset1, inFileset2, inFileset3, inFilesetCheck, expected}) => {
    var messageUnits: encryption.MessageUnit[] = [];
        
    messageUnits.push(new encryption.MessageUnit('','',inFileset1,1,3,false));
    messageUnits.push(new encryption.MessageUnit('','',inFileset2,2,3,false));
    messageUnits.push(new encryption.MessageUnit('','',inFileset3,3,3,false));

    let unpacker = new encryption.MessageUnPacker([],'','');
    let result = unpacker.FileSetValidated(inFilesetCheck, messageUnits);
    expect(result).toEqual(expected);
  });
});
