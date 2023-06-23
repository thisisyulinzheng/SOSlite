
let pkey = "keykeykey";

function init() {
    document.getElementById('fileInput').addEventListener('change', handleFileSelect, false);
}

function parseBinFromPixel(value) {
    value = Number(value);
    if (value % 2 == 0)
        return "0";
    else
        return "1";
}

function handleFileSelect(event) {
    const reader = new FileReader()
    
    reader.onload = function() {
        // creates a image
        let img = document.createElement('img');
        img.src = reader.result;

        img.onload = function() {
            document.getElementById("startButton").inputResult = img;
            document.getElementById("startButton").addEventListener('click', startDecodeSequence, false);
        }
    };
    reader.readAsDataURL(event.target.files[0])
}

function startDecodeSequence(event) {
    let img = event.currentTarget.inputResult
    let canvas = document.createElement('canvas');
    let ctx = canvas.getContext('2d');
    ctx.canvas.width = img.width;
    ctx.canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    
    let imgData = ctx.getImageData(0, 0, img.width, img.height).data;
    
    //get length of compressed text
    let lengthInBin = "";
    let numPassed = 0;
    let i = 1;
    while (numPassed < 16 * 7) {
        if (i % 4 != 0) {
            lengthInBin += parseBinFromPixel(imgData[i - 1]);
            numPassed++;
            if (numPassed % 16 == 0) {
                lengthInBin += ",";
            }
        }
        i++;
    }
    let extLength = "";
    lengthInBin.split(",").map((numInBin) => {
        if (numInBin != ""){ 
            extLength = String.fromCodePoint(parseInt(numInBin, 2)) + extLength;
        }
    });

    let sigDigit = 0;
    while (extLength[sigDigit] != 0) {
        sigDigit++;
    }
    let binLength = Number(extLength.slice(sigDigit, extLength.length));

    // loop through the pixels of the image
    let compressedEncryptedData = "";
    numPassed = 0;
    while (numPassed < binLength) {
        if (i % 4 != 0) {
            compressedEncryptedData += parseBinFromPixel(imgData[i - 1]);
            numPassed++;
            if (numPassed % 16 == 0) {
                compressedEncryptedData += ",";
            }
        }
        i++;
    }
    let decompressData = decmpFromImage(compressedEncryptedData);
    let pkey = document.getElementById("pwBox").value;
    let decryptedData = decryptCipher(pkey, decompressData);
    document.getElementById("decryptedText").classList.add("p-2");
    document.getElementById("decryptedText").innerHTML = "The secret message: \"" + decryptedData + "\"";
}
//decompresses the ciphertext
function decmpFromImage(cmpBin) {
    let compressedGoo = "";
    cmpBin.split(",").map((charInBin) => {
        if (charInBin != "") { 
            compressedGoo += String.fromCodePoint(parseInt(charInBin, 2));
        }
    });
    return LZString.decompress(compressedGoo);
};

//decompresses the ciphertext
function decryptCipher(plainkey, ciphertext) {
    AES_Init();

    let key = Array(16);
    for(let i = 0; i < 32; i++) 
        key[i] = plainkey[i % plainkey.length].charCodeAt(0);
      
    AES_ExpandKey(key);

    let plaintext = "";
    let blockCounter = 0;

    let cipherArr = ciphertext.split(",");

    for (let i = 0; i < cipherArr.length - 16; i+=16) {
        block = new Array(16);
        
        for (let j = 0; j < 16; j++) {
            block[j] = Number(cipherArr[i+j]);
        }
    
        AES_Decrypt(block, key);
        
        for (let k = 0; k < 16; k++)
            plaintext += String.fromCharCode(block[k]);
    
    }  
    AES_Done();
    return plaintext;
};
