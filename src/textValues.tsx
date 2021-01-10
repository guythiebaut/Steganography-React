import React from 'react';


export const backgroundInformationText = (() => {
	return (
		<div>
			<b>Steganography</b> is the embedding of information within an image.<br/>
			<br/>
                        Through TeboSteg you can conceal text or files within one or more image files.<br/>
                        You can also add extra security by encrypting the information with a password.<br/>
			<br/>
						There are two main uses for steganography:<br/><br/>
						(1) To embed certificate information in an image so that a photographer can protect and keep the 
						copyright on their original image.<br/><br/>
						(2) To enable individuals to send information in a concealed manner that does not alert anyone intercepting
						the image that there is information embedded inside the image.<br/>
			<br/>
						Tebosteg was created chiefly for the second reason, for individuals living in countries/jurisdictions
						where freedom of speech and communicaiton is not a given.<br/>
			<br/>
                        Tebosteg runs locally in your browser, no information is uploaded or downloaded in order to embed or extract text or files<br/>
                        You can verify this by running TeboSteg in your browser while disconnected from the internet<br/>
			<br/>
		</div>
	);
});

// You can also download the source files from here and build TeboSteg locally using npm if you want complete control of the 
// source code. 

export const instructions = (() => {
	return (
		<div>
                        Click on the <b>Generate file(s)</b> tab above to embed text, or files, into an image file.<br/>
			<br/>
                        To embed text - select the <b>Text</b> tab and enter text into the <i>"Paste, or type, your text to be inserted here..."</i> text box.<br/>
                        To embed a file - select the <b>File</b> tab and drag and drop, or select, the files you wish to embed .<br/>
			<br/>
                        You can then allow TeboSteg to generate files for you by selecting the <b>Auto-generate container file options</b> tab and select the maximum width, height 
                        and the file name prexix for those auto-generated image files.<br/>
                        Alternatively click on the <b>Select container files</b> tab and drag and drop, or select, the image files you want to embed into.<br/>
			<br/>
                        If you want a more secure encryption then tick the box to the right of <i>Use encryption password</i> and enter a password 
                        into the text box.<br/>
			<br/>
                        Then click on the <b>Generate file(s)</b> button and the image files, with either the text or files you have selected, will be
                        generated and downloaded to your download folder.<br/>
			<br/>                        
			<br/>
                        Click on the <b>Extract from file(s)</b> tab above to extract text, or file(s), from an image file that has text, or files, embedded within it.<br/>
			<br/>
                        Drag and drop or select image files that have text or file(s) embedded within them.<br/>
                        
                        Then click on the <b>Extract from file(s)</b> button and the embedded files, or text, will be
                        extracted.<br/> 
						Extracted files will downloaded to your download folder, embedded text will be extracted and displayed within the text box that will appear on successful extraction.<br/>
			<br/>
                        If the file has been encrypted with a password you will need to provide the correct password 
                        in the <i>Decryption password</i> text box before clicking on the extract button.<br/>
		</div>
	);
});

export const supplementalInformation = (() => {
	return (
		<div>
			<u>Supplemental information</u><br></br>
                        All of the processing takes place locally in your browser.<br></br>
                        The files, or text, that you embed are not processed online or in 'the cloud'.<br></br>
                        This ensures that the embeded data is completely private to you.<br></br>
		</div>
	);
});