
function init() {
    document.getElementById('fileInput').addEventListener('change', handleFileSelect, false);
}

function handleFileSelect(event) {
    const reader = new FileReader();
    
    reader.onload = function() {
        document.getElementById("startButton").inputResult = reader.result;
        document.getElementById("startButton").addEventListener('click', startEncodeSequence, false);
    };

    reader.readAsDataURL(event.target.files[0]);
}

function startEncodeSequence(event) {
    // this takes the data of the image
    let img = document.createElement('img');
    img.src = event.currentTarget.inputResult;
    
    // creates a canvas to hold the image
    img.onload = function() {
        let canvas = document.createElement('canvas');
        let ctx = canvas.getContext('2d');
        ctx.canvas.width = img.width;
        ctx.canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        let imgData = ctx.getImageData(0, 0, img.width, img.height).data;
        imgArray = [];
        // loop through the pixels of the image
        for (let i = 0; i < imgData.length; i += 4) {
            imgArray.push(imgData[i]);
            imgArray.push(imgData[i + 1]);
            imgArray.push(imgData[i + 2]);
            imgArray.push(imgData[i + 3]);
        }
        let ptext = document.getElementById("ptextArea").value;
        let pkey = document.getElementById("pwBox").value;
        embedAndDownload(imgArray, img.width, img.height, pkey, ptext);
    }         
}

function lsbEncode(value, rgb) {
    if (value == "0")
        if (rgb % 2 == 0)
            return rgb;
        else if (rgb == 255)
            return (rgb - 1);
        else
            return (rgb + 1);
    else
        if (rgb % 2 != 0) 
            return rgb;
        else
            return (rgb + 1);
} 

function embedAndDownload(imgArray, width, height, pkey, ptext) {
    let canvas = document.createElement("canvas"); 
    let ctx = canvas.getContext("2d");
    ctx.canvas.width  = width;
    ctx.canvas.height = height;

    let encryptData = encryptUserData(pkey, ptext);
    let compressEncryptedData = compFromCipher(encryptData);
    let r,g,b,a;
    let arrPos = 0;
    let binCount = 0;
    for(let i = 0; i < height; i++) { 
        for (let j = 0; j < width; j++) {
            if (binCount > compressEncryptedData.length) {
                r = imgArray[arrPos]; 
                g = imgArray[arrPos + 1];	 
                b = imgArray[arrPos + 2];  
            }
            else {
                r = lsbEncode(compressEncryptedData[binCount], Number(imgArray[arrPos]));
                g = lsbEncode(compressEncryptedData[binCount + 1], Number(imgArray[arrPos + 1]));
                b = lsbEncode(compressEncryptedData[binCount + 2], Number(imgArray[arrPos + 2]));
                binCount += 3;
            }
            a = imgArray[arrPos + 3];
            arrPos += 4;
            ctx.fillStyle = "rgba("+r+","+g+","+b+","+a+")"; 
            ctx.fillRect(j, i, 1, 1); 
        }
    }

    let dataURL = canvas.toDataURL("image/png");
    let dlElement = document.createElement('a');
    dlElement.href = dataURL
    dlElement.download = 'output.png';
    dlElement.click();
}

//encrypts the user's plaintext
function encryptUserData(plainkey, plaintext) {
    AES_Init();
    let key = Array(16);
    for(let i = 0; i < 32; i++) {
        key[i] = plainkey[i % plainkey.length].charCodeAt(0);
        
    }
    AES_ExpandKey(key);

    let ciphertext = "";
    let blockCounter = 0;
    for (let i = 0; i < plaintext.length; i+=16) {
        blockStr = "";
        block = new Array(16);
        if (i + 16 > plaintext.length) {
            blockStr = plaintext.substring(i, plaintext.length);
            let space = " ";
            blockStr += space.repeat(16 - (plaintext.length - i));
        }
        else {
            blockStr = plaintext.substring(i, i+16);
        }
        
        for (let j = 0; j < 16; j++)
            block[j] = (blockStr[j]).charCodeAt();

        AES_Encrypt(block, key);
        
        for (let k = 0; k < 16; k++)
            ciphertext += (block[k] + ",");
            
    }  
    AES_Done();
    return ciphertext;
}

// compresses the ciphertext
function compFromCipher(ciphertext) {
    let compressed = LZString.compress(ciphertext);
    let cmpBin = "";
    let signext = "0";
    compressed.split('').map(c => {
        let binstr = c.charCodeAt().toString(2);
        binstr = signext.repeat(16 - binstr.length) + binstr;
        cmpBin += binstr;
    });
    //we keep track of how long our compressed string is here
    //so when we parse the image we know when to stop
    let digits = Math.floor(Math.log10(cmpBin.length));
    let binLength = (cmpBin.length).toString();
    binLength = signext.repeat(7 - binLength.length) + binLength;
    binLength.split('').map(c => { 
        let binstr = c.charCodeAt().toString(2);
        binstr = signext.repeat(16 - binstr.length) + binstr;
        cmpBin = binstr + cmpBin;
    });
    return cmpBin;
}
