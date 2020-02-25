import  React, { useState } from 'react';
import "bootstrap/dist/css/bootstrap.min.css";
import Modal from "react-bootstrap/Modal";
import Row from "react-bootstrap/Row";
import Container from "react-bootstrap/Container";
import Tabs from "react-bootstrap/Tabs";
import Tab from "react-bootstrap/Tab";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import Accordion from "react-bootstrap/Accordion";
import Card from "react-bootstrap/Card";
import InputGroup from "react-bootstrap/InputGroup";
import FormControl from "react-bootstrap/FormControl";
import * as Image from './image'
import { ImageInfo } from './image'
import * as Controller from './controller';
import "./Steganography.css"
import { DecryptAES, DecryptionErrorMessage, EncryptObject, MessagePacker, MessageUnPacker } from './encryption';
import { resolve } from 'url';

var controller = new Controller.Main();
var image = new Image.Main();

const Encrypt = ((files: any[], text: string, secret: string, encryptingCallback: any, showEncryptAlert: any, setEncryptAlertMessage: any)  => {
    //const file = e.target.files[0];
    //console.log('files', files);
    let messagePackage = new MessagePacker(files, text, secret);
    console.log('messagePackage', messagePackage);
    EncryptPackage(messagePackage, encryptingCallback, showEncryptAlert, setEncryptAlertMessage);
    ClearFiles('fileEncryptUpload');
    //FileEncryption(file, text, secret, encryptingCallback, showEncryptAlert, setEncryptAlertMessage);
});

const Decrypt = ((files: any, secret: string, resultCallback: any, showDecryptAlert: any, setDecryptAlertMessage: any) => {
    //const files = e.target.files;
    var endMarker = image.EndMarker('', true);
    let messagePackage = new MessageUnPacker(files, endMarker, secret);
    messagePackage.processFiles()
    .then((result: any) => {
        console.log('result', result);

        if (result.success) {
            showDecryptAlert(false);
            resultCallback(result.body);
            ClearFiles('fileDecryptUpload');
        } else {
            console.log('result',result);
            setDecryptAlertMessage(DecryptionErrorMessage(result.error))
            showDecryptAlert(true);
        }
    });
    //FileDecryption(file, secret, resultCallback, showDecryptAlert, setDecryptAlertMessage);
});

// const DecryptResult = ((result: any) => {
//     if (result.success) {
//         setTextDecrypted(result.body);
//     }
// });

const ClearFiles = ((id: string) =>{
    if (document){(document.getElementById(id) as HTMLInputElement).value = ''};
});


const EncryptPackage =((messagePackage: MessagePacker, encryptingCallback: any, showEncryptAlert: any, setEncryptAlertMessage: any) => {
    let invalidFiles =  messagePackage.GetFilesToProcess().filter((a) => {return !image.IsImagFile(a)});
    console.log('invalidFiles', invalidFiles);

    if (invalidFiles.length > 0) {
        setEncryptAlertMessage('Only image files can be used - bmp, jpg, png etc. xxx');
        showEncryptAlert(true);
        return;
    }
    else {
        showEncryptAlert(false);
    }

    ClearFiles('fileEncryptUpload');
    let messageUnits = messagePackage.GetMessageUnits();

    for (let i = 0; i < messageUnits.length; i++) {
        let file = messageUnits[i].file;
        let textForImage = messageUnits[i].ForImage();
        console.log('textForImage',textForImage);
        image.ImageFileDimensions(file)
        .then((dimensions: any) => {
            let capacity = image.ImageFileByteCapacity(dimensions);
            // let enoughSpace = controller.EnoughSpace(capacity, toEncrypt);
            // if (!enoughSpace) { 
            //     showEncryptAlert(true);
            //     setEncryptAlertMessage(`The selected file is too small for the text provided. The selected image file capacity is ${capacity - endMarker.length} characters. Your text requires a file that is  able to accomodate ${toEncrypt.length} characters. Please note that adding a secret increases the space required.`);
            //     return;
            // }
            controller.EncryptIntoFile(file, dimensions.width, dimensions.height, textForImage, encryptingCallback);
            encryptingCallback(`Downloading complete.`);
        });
    };
});


const DecryptPackage =((file: any, secret: string, resultCallback: any, showDecryptAlert: any, setDecryptAlertMessage: any) => {
    var endMarker = image.EndMarker('', true);
});


const FileEncryption =((file: any, text:string, secret: string, encryptingCallback: any, showEncryptAlert: any, setEncryptAlertMessage: any) => {
    if (!image.IsImagFile(file)) {
        setEncryptAlertMessage('Only image files can be used - bmp, jpg, png etc.');
        showEncryptAlert(true);
    }
    else {
        showEncryptAlert(false);
    }

    ClearFiles('fileEncryptUpload');
    let encryptMe = text;
    let textToEncrypt = image.StringToNumberArray(encryptMe);
    let textToEncryptObj = {textToEncrypt};
    let encryptedStr = JSON.stringify(textToEncryptObj);
    //we are encrypting the object becasue it only contains UTF-8 data
    //encrypting original text may throw an exception due to non UTF-8 characters
    if (secret.length !== 0) { 
        encryptedStr = EncryptObject(secret, textToEncryptObj);
        // let simpleCrypto = new SimpleCrypto(secret);
        // encryptedStr = simpleCrypto.encryptObject(textToEncryptObj);
    }
    // let simpleCrypto2 = new SimpleCrypto(secret);
    // let enc = simpleCrypto2;
    let info = new Image.ImageInfo(1, 1, secret.length !== 0, encryptedStr, null);
    console.log('info',info);
    //info.encrypted =  secret.length !== 0;
    //info.text = encryptedStr;
    let encryptMeObj = info;
    //let encryptMeObj = {encrypted: secret.length !== 0, text: encryptedStr};
    let encryptMeObjStr = JSON.stringify(encryptMeObj);
    let endMarker = image.EndMarker(encryptMeObjStr);
    let toEncrypt  = encryptMeObjStr + endMarker;
    let textIntArray = image.StringToNumberArray(toEncrypt);

    image.ImageFileDimensions(file)
    .then((dimensions: any) => {
        let capacity = image.ImageFileByteCapacity(dimensions);
        let enoughSpace = image.EnoughSpace(capacity, toEncrypt);
        if (!enoughSpace) { 
            showEncryptAlert(true);
            setEncryptAlertMessage(`The selected file is too small for the text provided. The selected image file capacity is ${capacity - endMarker.length} characters. Your text requires a file that is  able to accomodate ${toEncrypt.length} characters. Please note that adding a secret increases the space required.`);
            return;
        }
        controller.EncryptIntoFile(file, dimensions.width, dimensions.height, textIntArray, encryptingCallback);
        encryptingCallback(`Downloading complete.`);
    });
});

const EncryptingCalllback = ((result: any) => {
console.log(result);
});

const FileDecryption =((file: any, secret: string, resultCallback: any, showDecryptAlert: any, setDecryptAlertMessage: any) => {
    
    if (!image.IsImagFile(file)) {
        setDecryptAlertMessage('Only image files can be used - bmp, jpg, png etc.');
        showDecryptAlert(true);
    } else {
        showDecryptAlert(false);
    }
    
    ClearFiles('fileDecryptUpload');
    var endMarker = image.EndMarker('', true);

    image.ImageFileDimensions(file)
    .then((dimensions: any) => {
        controller.DecryptFromFile(file, dimensions.width, dimensions.height, endMarker, secret, DecryptAES, DecryptingCalllback, resultCallback, showDecryptAlert, setDecryptAlertMessage)
    });
});

const SetClassName = ((id: string, cls: string) => {
    if (document){(document.getElementById(id) as HTMLElement).className = cls};    
});





const DecryptingCalllback = ((result: any) => {

});

var ImgElement = ((props: any) =>{
    return <img src={props.src} alt='Uploaded Image'></img>;
});

export function View() {

    const[textToEncrypt, setTextToEncrypt] = useState('Paste your text to be encrypted here...');
    const[useSecretForEncryption, setUseSecretForEncryption] = useState(false);
    const[useSecretForDecryption, setUseSecretForDecryption] = useState(false);
    const[encryptionSecret, setEncryptionSecret] = useState('Encryption secret...');
    const[decryptionSecret, setDecryptionSecret] = useState('Decryption secret...');
    const[textDecrypted, setTextDecrypted] = useState('Decrypted text will appear here...');
    const[textEncrypted, setTextEncrypted] = useState('Encryption process updates will appear here...');
    const [showEncryptAlert, setEncryptAlert] = useState(false);
    const [showDecryptAlert, setDecryptAlert] = useState(false);
    const [encryptAlertMessage, setEncryptAlertMessage] = useState('');
    const [decryptAlertMessage, setDecryptAlertMessage] = useState('');
    const [filesSelected, setfilesSelected] = useState([FileList]);
    
    return (
        <div className="App">
            <Container className="p-3 p3-padding">
                <Tabs defaultActiveKey="instructions" transition={false} id="noanim-tab-example">
                    <Tab eventKey="instructions" title="Instructions" tabClassName='tab-header'>
                        <div className="card card-margin card-intro">
                            <div className="card-header">Welcome to the Teboweb Steganography page</div>
                            <div className="card-body">
                                <p className="card-text">
                                    From here you can encrypt and decrypt text messages within images.<br/>
                                    <br/>
                                    Click on the <b>Encrypt</b> tab above to encrypt text to an image file.<br/>
                                    To encrypt text enter ASCII compliant text into the <i>"Paste your text to be encrypted here..."</i> text box.<br/>
                                    Then click on the <i>"Choose file"</i> button and select an image file<br/>
                                    Your file with the text within it will then be downloaded and should be available fronm the bottom of the browser.<br/>
                                    If you want a more secure encryption then tick the box to the right of <i>Use encryption secret</i> and enter a secret/password 
                                    into the text box, to the right, before selecting your file.<br/>
                                    <br/>
                                    Click on the <b>Decrypt</b> tab above to extract text from an image file that has text encrypted into it.<br/>
                                    To extract text from an image file, that has had text encrypted into it, click on the <i>"Choose file"</i> button 
                                    and select the image file containing the text.<br/>
                                    The text will be extracted and displayed in the <i>Decryption result</i> box.<br/>
                                    If the file has been encrypted with a secret/password you will need to provide the correct secret/password by ticking 
                                    the box to the right of <i>Use decryption secret</i> and entering the correct secret/password 
                                    into the text box, to the right, before selecting your file.<br/>
                                </p>
                            </div>
                            <Accordion defaultActiveKey="1">
                                <Card>
                                    <Card.Header>
                                        <Accordion.Toggle as={Card.Header} variant="link" eventKey="0">
                                            Click here to show further information below
                                        </Accordion.Toggle>
                                    </Card.Header>
                                    <Accordion.Collapse eventKey="0">
                                        <Card.Body>
                                            <u>Supplemental information</u><br></br>
                                            All of the processing takes place locally in your browser.<br></br>
                                            The text you encrypt is not processed online or in 'the cloud.'<br></br>
                                            This ensures that the encryption you apply is completely private to you.<br></br>
                                            <Card.Link href="https://github.com/guythiebaut/Steganography-React">You can access the source code from GitHub - click here</Card.Link>
                                        </Card.Body>
                                    </Accordion.Collapse>
                                </Card>                
                            </Accordion>
                        </div> 
                      </Tab> 
                    {/* <Tab eventKey="profile" title="Encrypt" tabClassName='tab-header'> */} 
                    <Tab eventKey="encrypt" title="Encrypt" tabClassName='tab-header'>                        
                        <Container className="p-3 p3-padding">
                            <Modal.Dialog>
                                <h2 id='message'/>
                                <textarea className='textBox'value={textToEncrypt} onChange={(e) => {setTextToEncrypt(e.target.value)}   } />
                                <div className='col-12'>
                                    <input type="file" multiple id="fileEncryptUpload" onChange={(e) => setfilesSelected([...filesSelected,...e.target.files as any])}/>
                                                <Button variant="light" onClick={() => {
                                                                                        ClearFiles('fileEncryptUpload');
                                                                                        setfilesSelected([]);
                                                                                    }}>Clear files </Button>
                                </div>
                                <div className='col-12'>
                                <InputGroup className="mb-3" >
                                <InputGroup.Prepend>
                                    <InputGroup.Text id="enc-secret">Use encryption secret</InputGroup.Text>
                                </InputGroup.Prepend>
                                <InputGroup.Prepend>
                                    <InputGroup.Checkbox onChange={(e) => {setUseSecretForEncryption(e.target.checked)}} />
                                </InputGroup.Prepend>                                
                                <FormControl
                                    placeholder={encryptionSecret}
                                    aria-describedby="enc-secret"
                                    onChange={(e: any) => {setEncryptionSecret(e.target.value)}}
                                    readOnly={!useSecretForEncryption}
                                />
                            </InputGroup>                                    
                            </div>
                            <Button variant="primary" size="lg" onClick={() => Encrypt(filesSelected, textToEncrypt, useSecretForEncryption ? encryptionSecret : '', setTextEncrypted, setEncryptAlert, setEncryptAlertMessage)}>Encrypt to files </Button>
                            </Modal.Dialog>
                        </Container>            
                        <Modal.Dialog className='modalDialog-top'>
                            <Alert className={showEncryptAlert ? '' : 'alert-hide'}  id='EncryptAlert' variant="danger" onClose={() => setEncryptAlert(false)}  dismissible>
                                <Alert.Heading>Error!</Alert.Heading>
                                <p className='alert-text'>  
                                    {encryptAlertMessage}
                                </p>
                            </Alert>                        
                            {/* <InputGroup className="mb-3" >
                                <InputGroup.Prepend>
                                    <InputGroup.Text id="enc-secret">Use encryption secret</InputGroup.Text>
                                </InputGroup.Prepend>
                                <InputGroup.Prepend>
                                    <InputGroup.Checkbox onChange={(e) => {setUseSecretForEncryption(e.target.checked)}} />
                                </InputGroup.Prepend>                                
                                <FormControl
                                    placeholder={encryptionSecret}
                                    aria-label="Enter your encryption secret here..."
                                    aria-describedby="enc-secret"
                                    onChange={(e: any) => {setEncryptionSecret(e.target.value)}}
                                    readOnly={!useSecretForEncryption}
                                />
                            </InputGroup>                             */}
                        </Modal.Dialog>      
                    </Tab>
                    <Tab eventKey="decrypt" title="Decrypt" tabClassName='tab-header'>
                        <Modal.Dialog>
                            <Alert className={showDecryptAlert ? '' : 'alert-hide'}  id='DecryptAlert' variant="danger" onClose={() => setDecryptAlert(false)}  dismissible>
                            <Alert.Heading>Error!</Alert.Heading>
                                <p className='alert-text'>  
                                    {decryptAlertMessage}
                                </p>
                            </Alert>                        
                            <InputGroup className="mb-3" >
                                <InputGroup.Prepend>
                                    <InputGroup.Text id="enc-secret">Use decryption secret</InputGroup.Text>
                                </InputGroup.Prepend>
                                <InputGroup.Prepend>
                                    <InputGroup.Checkbox onChange={(e) => {setUseSecretForDecryption(e.target.checked)}}/>
                                </InputGroup.Prepend>                                
                                <FormControl
                                    placeholder={decryptionSecret}
                                    aria-label="Enter your decryption secret here..."
                                    aria-describedby="dec-secret"
                                    onChange={(e: any) => {setDecryptionSecret(e.target.value)}}
                                    readOnly={!useSecretForDecryption}
                                />
                            </InputGroup>                                            
                            <Modal.Body>
                                <Container>
                                    <div>
                                        <Row className="show-grid">
                                            <div className='col-12'>
                                                <input type="file" multiple id="fileDecryptUpload" onChange={(e) => setfilesSelected([...filesSelected,...e.target.files as any])}/>
                                                <Button variant="light" onClick={() => {
                                                                                    ClearFiles('fileDecryptUpload');
                                                                                    setfilesSelected([]);
                                                                                   }}>Clear files </Button>                                                
                                                {/* <input type="file" id="fileDecryptUpload" onChange={(e) => Decrypt(e, useSecretForDecryption ? decryptionSecret : '', setTextDecrypted, setDecryptAlert, setDecryptAlertMessage)}/> */}
                                            </div>
                                        </Row>
                                        <Button variant="primary" size="lg" onClick={() => Decrypt(filesSelected, useSecretForDecryption ? decryptionSecret : '', setTextDecrypted, setDecryptAlert, setDecryptAlertMessage)}>Decrypt from files </Button>
                                    </div>
                                        <div className="card card-margin">
                                            <div className="card-body">
                                                <h5 className="card-title">Decryption result</h5>
                                                <p className="card-text">{textDecrypted}</p>
                                            </div>
                                        </div>     
                                </Container>
                            </Modal.Body>
                        </Modal.Dialog>
                    </Tab>
                </Tabs>
            </Container>
        </div>
    );
};