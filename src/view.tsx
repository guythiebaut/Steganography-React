import  React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import Container from 'react-bootstrap/Container';
import Tabs from 'react-bootstrap/Tabs';

import './Steganography.css';

import { InstructionsView } from './InstructionsView';
import { EncryptView } from './EncryptView';
import { DecryptView } from './DecryptView';
import { TestingView } from './TestingView';
import { GoogleAd } from './GoogleAd';
import { BackgroundInformationView } from './backgroundInformationView';

const ShowTestView = () => {
	if (process.env.NODE_ENV === 'development') {
		return TestingView();
	} else {
		return null;
	}
};

export function View() {
	return (
		<div className="App">
			<Container className="p-3 p3-padding">
				{/* <Tabs defaultActiveKey="backgroundInformation" transition={false} id="steganography-tabs"> */}
				<Tabs defaultActiveKey="encrypt" transition={false} id="steganography-tabs">
					{ BackgroundInformationView() }
					{ InstructionsView() }
					{ EncryptView() }
					{ DecryptView() }
					{ ShowTestView() }
				</Tabs>
			</Container>
			<GoogleAd></GoogleAd>
		</div>
	);
}