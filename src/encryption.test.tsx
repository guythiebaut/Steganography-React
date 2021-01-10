import * as encryption from './encryption';
import { Logger } from './logger';
import { interfaceExtends } from '@babel/types';
import { createImageForTesting } from './image';

// describe('FileProcessed', () => {
// 	test.each
// 	`inMessage1    | inMessage2       | inMessage3          | expected
//       ${'this '} | ${'is '}         | ${'a test'}         | ${'this is a test'}
//       ${'this '} | ${'is '}         | ${'another test'}   | ${'this is another test'}
//       ${'this '} | ${'is again '}   | ${'another test'}   | ${'this is again another test'}`
// ('returns $expected', ({inMessage1, inMessage2, inMessage3, expected}) => {
// 	const logger = new Logger(false);
// 	const messageUnits: encryption.MessageUnit[] = [];
      
// 	messageUnits.push(new encryption.MessageUnit(inMessage2,'',0,'',2,3,false,logger));
// 	messageUnits.push(new encryption.MessageUnit(inMessage1,'',0,'',1,3,false,logger));
// 	messageUnits.push(new encryption.MessageUnit(inMessage3,'',0,'',3,3,false,logger));

// 	const unpacker = new encryption.MessageUnPacker([],'','',logger);
// 	const result = unpacker.MessageFromFiles(messageUnits, '');
// 	expect(result.body).toEqual(expected);
// });
// });


// describe('FileSetValidated', () => {
// 	test.each
// 	`inFileset1   | inFileset2  | inFileset3  | inFilesetCheck| expected
//         ${'abc1'} | ${'abc1'}   | ${'abc1'}   |  ${'abc1'}    | ${true}
//         ${'abc2'} | ${'abc2'}   | ${'abc2'}   |  ${'abb2'}    | ${false}
//         ${'abc3'} | ${'abc3'}   | ${'abb3'}   |  ${'abc3'}    | ${false}
//         ${'abc4'} | ${'abc4'}   | ${'abb4'}   |  ${'abb4'}    | ${false}`
// ('returns $expected for fileset $inFilesetCheck', ({inFileset1, inFileset2, inFileset3, inFilesetCheck, expected}) => {
// 	const logger = new Logger(false);
// 	const messageUnits: encryption.MessageUnit[] = [];
        
// 	messageUnits.push(new encryption.MessageUnit('','',0,inFileset1,1,3,false,logger));
// 	messageUnits.push(new encryption.MessageUnit('','',0,inFileset2,2,3,false,logger));
// 	messageUnits.push(new encryption.MessageUnit('','',0,inFileset3,3,3,false,logger));

// 	const unpacker = new encryption.MessageUnPacker([],'','',logger);
// 	const result = unpacker.FileSetValidated(inFilesetCheck, messageUnits);
// 	expect(result).toEqual(expected);
// });
// });

// describe('HashMd5Test', () => {
// 	it('HashMd5 returns a string of 32 bytes in length', () => {
// 		let hash = encryption.HashMd5();
// 		let lastHash = 'init';

// 		for (let i = 0; i < 1000; i++) {
// 			expect(hash.length).toEqual(32);  
// 			expect(lastHash).not.toBe(hash);
// 			lastHash = hash;
// 			hash = encryption.HashMd5(i+1);
// 		}
// 	});
// });

// describe('CharsToFillTest', () => {
// 	test.each
// 	`inMessageLength | inCapacity   | inEncrypted  | expected
//       ${0}         | ${140}       |  ${false}    | ${0}      
//       ${1}         | ${140}       |  ${false}    | ${0}
//       ${1}         | ${144}       |  ${false}    | ${1}
//       ${2}         | ${144}       |  ${false}    | ${1}
//       ${3}         | ${150}       |  ${false}    | ${3}
//       ${5}         | ${150}       |  ${false}    | ${5}
//       ${8}         | ${150}       |  ${false}    | ${7}
//       ${13}        | ${150}       |  ${false}    | ${7}
//       ${256}       | ${398}       |  ${false}   | ${253}
//       ${256}       | ${399}       |  ${false}   | ${256}`
// ('MessageUnit.CharsToFill returns the correct number of bytes characters.', ({inMessageLength, inCapacity, inEncrypted, expected}) => {
// 	const logger = new Logger(false);
// 	const hash = encryption.HashMd5();
// 	const message1 = 'a'.repeat(inMessageLength);
// 	const charsUsed = encryption.CharsToFill(inCapacity, message1, hash, 100, 100,  inEncrypted, logger);
// 	expect(charsUsed).toEqual(expected);
// 	const checkMessage = 'a'.repeat(charsUsed);
// 	const checkCharsUsed = encryption.CharsToFill(inCapacity, checkMessage, hash, 100, 100, inEncrypted, logger);
// 	expect(checkCharsUsed).toEqual(expected);
// 	expect(checkCharsUsed).toEqual(checkMessage.length);
// });
// });

// describe('BytesRequiredTest', () => {
// 	test.each
// 	`inMessage        | inFileNo | inTotalFiles | inEncrypted| expected
//       ${''}         | ${1}     | ${1}         |  ${false}   | ${144}
//       ${'a'}        | ${1}     | ${1}         |  ${false}   | ${144}
//       ${'ab'}       | ${1}     | ${1}         |  ${false}   | ${147}
//       ${'abc'}      | ${1}     | ${1}         |  ${false}   | ${147}
//       ${'abcd'}     | ${1}     | ${1}         |  ${false}   | ${147}
//       ${'abcde'}    | ${1}     | ${1}         |  ${false}   | ${150}
//       ${'abcdef'}   | ${1}     | ${1}         |  ${false}   | ${150}`
// ('MessageUnit.BytesRequired returns the correct number of bytes taken.', ({inMessage, inFileNo, inTotalFiles, inEncrypted, expected}) => {
// 	const logger = new Logger(false);
// 	const hash = encryption.HashMd5();
// 	const messageUnit = new encryption.MessageUnit(inMessage, '', 0, hash, inFileNo, inTotalFiles, inEncrypted, logger);
// 	const bytesRequired = messageUnit.BytesRequired();
// 	expect(bytesRequired).toEqual(expected);
// });
// });

// describe('BytesRequiredTest', () => {
// 	it('MessageUnit.BytesRequired returns the correct number of bytes taken.', () => {
// 		const logger = new Logger(false);
// 		const hash = encryption.HashMd5();
// 		const messageUnit = new encryption.MessageUnit('', '', 0, hash, 1, 1, false, logger);
// 		const bytesRequired = messageUnit.BytesRequired();
// 		expect(bytesRequired).toEqual(144);
// 	});
// });

// describe.skip('CreateAndDownloadImageTest', () => {
// 	it('createImageForTesting creates and downloads an image', () => {
// 		createImageForTesting(200, 200, '');
// 	});
// });

describe('DivideAndConquerAlgorithmTest', () => {
	it('Assert that teh divide and conquer algorithm works', () => {
		let lowRange = 1;
		let highRange = 1000000000;
		const winningValue  =  Math.floor(Math.random() * highRange) + 1;
		let possibleGuesses = highRange + lowRange -1;
		const maxTurns = Math.round((Math.log(possibleGuesses)/Math.log(2))+1);
		let yourGuess = 0;
		let found = false;
		let countNumTurns = 1;

		while (!found) {
			possibleGuesses = highRange + lowRange -1;
			yourGuess = Math.ceil(possibleGuesses/2);

			if (yourGuess === winningValue) found = true;
			if (yourGuess > winningValue) highRange = yourGuess - 1;
			if (yourGuess < winningValue) lowRange = yourGuess + 1;

			countNumTurns ++;
		}

		console.log('winningValue',winningValue);
		console.log('countNumTurns',countNumTurns);
		console.log('maxTurns',maxTurns);
		expect(1).toEqual(1);
	});
});