// パラメータ
let version = 1012;
const limit_length = parseInt(1000000);
let mainUrl = 'https://shellgei-online-judge.com/';
let is_enable_button = true;

// 使用データ変数
let problemNum = 'GENERAL-00000001';
let shellgeiResult = 'NULL';
let shellgeiID = '0';
let shellgeiDate = '0';
let shellgeiImage = '';

// タイムアウト処理用関数
function timeout() {
    clearInterval(timerId);
    shellgeiResult = 'timeout:3000ms\n';
    let timeoutTxt = shellgeiResult;
    let userOutput = document.getElementById('userOutputText');
    userOutput.innerHTML = timeoutTxt;
    let resultText = document.getElementById('resultText');
    resultText.innerHTML = timeoutTxt;
    let st = document.getElementById('shellgeiText');
    st.innerHTML = timeoutTxt;
}

// 問題データ取得関数
// reference: https://munibus.hatenablog.com/entry/2022/09/30/225938
function getText(objectId, fileName) {
    let result = document.getElementById(objectId);
    let xhr = new XMLHttpRequest();
    xhr.open('GET', fileName, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                result.textContent = '';
                let lines = xhr.responseText.split('\n');
                let line = '';
                for(i = 0; i < lines.length; i++) {
                    if(i != lines.length-1) line += lines[i] + '\n';
                }
		        line = line.replace(/</g, '&lt;');
		        line = line.replace(/>/g, '&gt;');
                result.insertAdjacentHTML('afterbegin', line);
            } else {
                result.textContent = 'Error: Could not get problem files!!';
            }
        } else {
            result.textContent = 'LOADING......';
        }
    }
    xhr.send(null);
}

// 問題選択処理用関数
function selectClickFunc(problemNum) {
    if(is_jp) {
        getText('problemText', mainUrl+'problem_jp/'+problemNum+'.txt?version='+version);
    } else {
        getText('problemText', mainUrl+'problem_en/'+problemNum+'.txt?version='+version);
    }
    getText('inputText', mainUrl+'input/'+problemNum+'.txt?version='+version);
    getText('outputText', mainUrl+'output/'+problemNum+'.txt?version='+version);
    // document.getElementById("outputImage").src = mainUrl+'problem_images/'+problemNum+'.jpg?version='+version;
    let outputImageParent = document.getElementById('outputImage');
    while (outputImageParent.firstChild) {
        outputImageParent.removeChild(outputImageParent.firstChild);
    }
    let img_outputImage = document.createElement('img');
    img_outputImage.src = mainUrl+'problem_images/'+problemNum+'.jpg?version='+version;
    img_outputImage.alt = 'output image';
    img_outputImage.width = 200;
    img_outputImage.height = 200;
    outputImageParent.appendChild(img_outputImage);

    let selected = document.getElementById('selectedText');
    selected.innerHTML = problemNum;
}
function selectClick1() {
    let problem = document.getElementById('selectForm1');
    selectClickFunc(problem.value);
}
function selectClick2() {
    let problem = document.getElementById('selectForm2');
    selectClickFunc(problem.value);
}
function selectClick3() {
    let problem = document.getElementById('selectForm3');
    selectClickFunc(problem.value);
}
let selectButton1 = document.getElementById('selectButton1');
selectButton1.addEventListener('click', selectClick1);
let selectButton2 = document.getElementById('selectButton2');
selectButton2.addEventListener('click', selectClick2);
let selectButton3 = document.getElementById('selectButton3');
selectButton3.addEventListener('click', selectClick3);

// 入力されたシェル芸をサーバに送って実行結果をもらう関数
// reference: https://brainlog.jp/programming/javascript/post-3129/
function postSend(shellgei) {
    return new Promise((resolve, reject) => {
        const formData = new FormData();
        formData.append('shellgei', shellgei);
        formData.append('problemNum', problemNum);
        fetch(mainUrl+'connection.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(res => {
            if (res.shellgei != null) {
                shellgeiResult = res.shellgei.toString();
                shellgeiID = res.shellgei_id.toString();
                shellgeiDate = res.shellgei_date.toString();
                shellgeiImage = res.shellgei_image.toString();
                resolve("resolve");
            } else {
                throw new Error("response error : null");
            }
        })
        .catch(error => {
            console.log(error);
            reject("reject");
        });
    });
}

// reference: https://qiita.com/yasumodev/items/e1708f01ff87692185cd
function ImageToBase64(img, mime_type) {
    var canvas = document.createElement('canvas');
    canvas.width  = img.width;
    canvas.height = img.height;
    return canvas.toDataURL(mime_type);
}

// シェル芸の実行処理用関数
async function submitClick() {
    // ボタンの連打防止
    if(is_enable_button == false) {
        let userOutput = document.getElementById('userOutputText');
        userOutput.innerHTML = "No buttons can be pressed in succession";
        let resultText = document.getElementById('resultText');
        resultText.innerHTML = "No buttons can be pressed in succession.";
        let st = document.getElementById('shellgeiText');
        st.innerHTML = "No buttons can be pressed in succession.";
        return;
    }

    // 実行を開始したらボタンを無効にする
    // 3秒後に有効にする
    is_enable_button = false;
    var fn = function() {
        is_enable_button = true;
    };
    setTimeout(fn, 3000);

    // 実行中に表示を切り替え
    let userOutput = document.getElementById('userOutputText');
    userOutput.innerHTML = "Running...";
    let resultText = document.getElementById('resultText');
    resultText.innerHTML = "Running...";
    let st = document.getElementById('shellgeiText');
    st.innerHTML = "Running...";

    // 入力されたシェル芸の前処理
    let cmdline = document.getElementById('cmdline');
    cmdline.value = cmdline.value.replace(/\r/g, '');
    cmdline.value = cmdline.value.trim();
    cmdline.value = cmdline.value.replace(/\n$/g,'');
    
    // 入力されたシェル芸が1文字以上1000文字未満であれば実行
    if(cmdline.value.length > limit_length) {
        userOutput.innerHTML = "Exceeded character limit: 1000000";
        resultText.innerHTML = "Exceeded character limit: 1000000";
        st.innerHTML = "Exceeded character limit: 1000000";
    } else if(cmdline.value.length == 0) {
        userOutput.innerHTML = "Error: No input";
        resultText.innerHTML = "Error: No input";
        st.innerHTML = "Error: No input";
    } else {
        // タイムアウトを設定して実行
        timerId = setInterval('timeout()', 5000);
        const txt = await postSend(cmdline.value + ' | head -n1000000');
        clearInterval(timerId);

        // 実行したシェル芸の文字列の処理
        let replacedCmdline = cmdline.value;
        replacedCmdline = replacedCmdline.replace(/</g, '&lt;');
        replacedCmdline = replacedCmdline.replace(/>/g, '&gt;');
        st.innerHTML = 'SHELLGEI ID : ' + shellgeiID + '\nDATE : ' + shellgeiDate + ' (JST)\n' + 'COMMAND : ' + replacedCmdline;

        // 実行結果の確認
        if(shellgeiResult.length != 0 || shellgeiResult != null) {
            shellgeiResult = shellgeiResult.replace(/</g, '&lt;');
            shellgeiResult = shellgeiResult.replace(/>/g, '&gt;');
            userOutput.innerHTML = shellgeiResult;
        } else {
            userOutput.innerHTML = "ERROR : NULL";
        }

        // 想定出力と実行結果を比較
        let outputText = document.getElementById('outputText');
        let replacedOutput = outputText.innerHTML.toString();

        // 前処理
        shellgeiResult = shellgeiResult.replace(/\r/g, '');
        shellgeiResult = shellgeiResult.replace(/\n$/g, '');
        shellgeiResult = shellgeiResult.replace(/ $/g, '');
        replacedOutput = replacedOutput.replace(/\r/g, '');
        replacedOutput = replacedOutput.replace(/\n$/g, '');
        replacedOutput = replacedOutput.replace(/ $/g, '');

        // 先頭の改行と空白を除去
        // reference: https://kinocolog.com/javascript_first_last_slice/
        for(let i = 0; i < shellgeiResult.length; i++) {
            if(shellgeiResult.charAt(i) == '\n' || shellgeiResult.charAt(i) == ' ') {
                shellgeiResult = shellgeiResult.slice(1);
                i--;
            } else {
                break;
	        }
        }
        for(let i = 0; i < replacedOutput.length; i++) {
            if(replacedOutput.charAt(i) == '\n' || replacedOutput.charAt(i) == ' ') {
                replacedOutput = replacedOutput.slice(1);
                i--;
            } else {
                break;
	        }
        }
        // 末尾の改行と空白を除去
        for(let i = shellgeiResult.length-1; i >= 0; i--) {
            if(shellgeiResult.charAt(i) == '\n' || shellgeiResult.charAt(i) == ' ') {
                shellgeiResult = shellgeiResult.slice(0, -1);
            } else {
                break;
	        }
        }
        for(let i = replacedOutput.length-1; i >= 0; i--) {
            if(replacedOutput.charAt(i) == '\n' || replacedOutput.charAt(i) == ' ') {
                replacedOutput = replacedOutput.slice(0, -1);
            } else {
                break;
	        }
        }
        
        // 出力結果の処理
        if(shellgeiResult == '\n') shellgeiResult = 'NULL';
        if(shellgeiResult == '\r') shellgeiResult = 'NULL';
        if(shellgeiResult == ' ') shellgeiResult = 'NULL';

        // 想定出力画像をbase64に変換
        var output_img = document.getElementById('outputImage');
        const firstChild_outputImage = output_img.firstElementChild;
        var output_img_b64 = ImageToBase64(firstChild_outputImage, "image/jpeg")

        // 出力結果の画像を表示
        let resultImageParent = document.getElementById('resultImage');
        while (resultImageParent.firstChild) {
            resultImageParent.removeChild(resultImageParent.firstChild);
        }
        let img_resultImage = document.createElement('img');
        shellgeiImage = 'data:image/jpeg;base64,'+shellgeiImage;
        img_resultImage.src = shellgeiImage;
        img_resultImage.alt = 'result image';
        img_resultImage.width = 200;
        img_resultImage.height = 200;
        resultImageParent.appendChild(img_resultImage);

        // 出力結果の画像をbase64で再び取得
        var result_img = document.getElementById('resultImage');
        const firstChild_resultImage = result_img.firstElementChild;
        var result_img_b64 = ImageToBase64(firstChild_resultImage, "image/jpeg")

        // base64 image log
        console.log("Shellgei Output: "+shellgeiImage);
        console.log("Expected: "+output_img_b64);
        console.log("Result: "+result_img_b64);

        // 正誤判定
        if(shellgeiResult == replacedOutput) {
            if(is_jp) {
                resultText.innerHTML = "テキスト：正解 !!😄!!";
	    } else {
                resultText.innerHTML = "Text: Correct !!😄!!";
	    }
        } else {
            if(is_jp) {
                resultText.innerHTML = "テキスト：不正解 ...😭...";
	    } else {
                resultText.innerHTML = "Text: Incorrect ...😭...";
	    }
        }
        if(output_img_b64 == result_img_b64) {
            if(is_jp) {
                resultText.innerHTML += "\n画像：正解 !!😄!!";
	    } else {
                resultText.innerHTML += "\nImage: Correct !!😄!!";
	    }
        } else {
            if(is_jp) {
                resultText.innerHTML += "\n画像：不正解 ...😭...";
	    } else {
                resultText.innerHTML += "\nImage: Incorrect ...😭...";
	    }
        }
    }
}

// 実行ボタンの設定
let submitButton = document.getElementById('submitButton');
submitButton.addEventListener('click', submitClick);
