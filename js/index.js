// パラメータ
var version = 1032;
const limit_length = parseInt(1000000);
var mainUrl = 'https://shellgei-online-judge.com/';
var is_enable_button = true;

// 使用データ変数
var problemNum = 'GENERAL-00000001';
var shellgeiResult = 'NULL';
var shellgeiID = '0';
var shellgeiDate = '0';
var shellgeiImage = '';

// HTMLの要素を編集
var userOutput = document.getElementById('userOutputText');
var resultText = document.getElementById('resultText');
var st = document.getElementById('shellgeiText');
var selected = document.getElementById('selectedText');
var outputImageParent = document.getElementById('outputImage');
var resultImageParent = document.getElementById('resultImage');

// タイムアウト処理用関数
function timeout() {
    clearInterval(timerId);
    shellgeiResult = 'timeout: 5000ms\n';
    let timeoutTxt = shellgeiResult;
    userOutput.innerHTML = timeoutTxt;
    resultText.innerHTML = timeoutTxt;
    st.innerHTML = timeoutTxt;
}

// reference: https://kinocolog.com/javascript_first_last_slice/
function deleteNewline(text_strings) {
    // 先頭の改行と空白を除去
    for(let i = 0; i < text_strings.length; i++) {
        if(text_strings.charAt(i) == '\n' || text_strings.charAt(i) == ' ') {
            text_strings = text_strings.slice(1);
            i--;
        } else {
            break;
        }
    }
    // 末尾の改行と空白を除去
    for(let i = text_strings.length-1; i >= 0; i--) {
        if(text_strings.charAt(i) == '\n' || text_strings.charAt(i) == ' ') {
            text_strings = text_strings.slice(0, -1);
        } else {
            break;
        }
    }
    return text_strings;
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
    // テキスト更新
    if(is_jp) {
        getText('problemText', mainUrl+'problem_jp/'+problemNum+'.txt?version='+version);
    } else {
        getText('problemText', mainUrl+'problem_en/'+problemNum+'.txt?version='+version);
    }
    getText('inputText', mainUrl+'input/'+problemNum+'.txt?version='+version);
    getText('outputText', mainUrl+'output/'+problemNum+'.txt?version='+version);
    // 想定画像を更新
    while (outputImageParent.firstChild) {
        outputImageParent.removeChild(outputImageParent.firstChild);
    }
    let img_outputImage = document.createElement('img');
    img_outputImage.src = mainUrl+'problem_images/'+problemNum+'.jpg?version='+version;
    img_outputImage.alt = 'output image';
    img_outputImage.id = 'output_image_child';
    outputImageParent.appendChild(img_outputImage);
    // 選択した問題IDを更新
    selected.innerHTML = problemNum;
    // 余計な空白と改行を削除
    userOutput.innerHTML = deleteNewline(userOutput.innerHTML);
    resultText.innerHTML = deleteNewline(resultText.innerHTML);
    st.innerHTML = deleteNewline(st.innerHTML);
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
var selectButton1 = document.getElementById('selectButton1');
selectButton1.addEventListener('click', selectClick1);
var selectButton2 = document.getElementById('selectButton2');
selectButton2.addEventListener('click', selectClick2);
var selectButton3 = document.getElementById('selectButton3');
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
function ImageToBase64(img, mime_type, id_name) {
    let canvasElement = document.getElementById(id_name); 
    if(canvasElement) canvasElement.remove();
    let canvas = document.createElement('canvas');
    canvas.id = id_name;
    canvas.width  = img.width;
    canvas.height = img.height;
    var ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    return canvas.toDataURL(mime_type);
}

// シェル芸の実行処理用関数
async function submitClick() {
    // ボタンの連打防止
    if(is_enable_button == false) {
        userOutput.innerHTML = "No buttons can be pressed in succession";
        resultText.innerHTML = "No buttons can be pressed in succession.";
        st.innerHTML = "No buttons can be pressed in succession.";
        return;
    }

    // 実行を開始したらボタンを無効にする
    // 5秒後に有効にする
    is_enable_button = false;
    let fn = function() {
        is_enable_button = true;
    };
    setTimeout(fn, 5000);

    // 実行中に表示を切り替え
    userOutput.innerHTML = "Running...";
    resultText.innerHTML = "Running...";
    st.innerHTML = "Running...";

    // 入力されたシェル芸の前処理
    var cmdline = document.getElementById('cmdline');
    cmdline.value = cmdline.value.replace(/\r/g, '');
    cmdline.value = cmdline.value.trim();
    cmdline.value = cmdline.value.replace(/\n$/g,'');
    
    // 入力されたシェル芸が1文字以上1000文字未満であれば実行
    if(cmdline.value.length > limit_length) {
        userOutput.innerHTML = "Exceeded character limit: 1000000";
        resultText.innerHTML = "Exceeded character limit: 1000000";
        st.innerHTML = "Exceeded character limit: 1000000";
    } else if(cmdline.value.length == 0 || cmdline.value == '\n' || cmdline.value == '\r' || cmdline.value == ' ') {
        userOutput.innerHTML = "Error: No input";
        resultText.innerHTML = "Error: No input";
        st.innerHTML = "Error: No input";
    } else {
        // タイムアウトを設定して実行
        timerId = setInterval('timeout()', 5000);
        const txt = await postSend(cmdline.value + ' | head -n1000000');
        clearInterval(timerId);

        // 実行したシェル芸の文字列の処理
        var replacedCmdline = cmdline.value;
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
        let replacedOutput = outputText.innerHTML.toString();

        // 前処理
        shellgeiResult = shellgeiResult.replace(/\r/g, '');
        shellgeiResult = shellgeiResult.replace(/\n$/g, '');
        shellgeiResult = shellgeiResult.replace(/ $/g, '');
        replacedOutput = replacedOutput.replace(/\r/g, '');
        replacedOutput = replacedOutput.replace(/\n$/g, '');
        replacedOutput = replacedOutput.replace(/ $/g, '');

        shellgeiResult = deleteNewline(shellgeiResult);
        replacedOutput = deleteNewline(replacedOutput);
        
        // 出力結果の処理
        if(shellgeiResult == '\n') shellgeiResult = 'NULL';
        if(shellgeiResult == '\r') shellgeiResult = 'NULL';
        if(shellgeiResult == ' ') shellgeiResult = 'NULL';

        // 出力結果の画像を表示
        while (resultImageParent.firstChild) {
            resultImageParent.removeChild(resultImageParent.firstChild);
        }
        let img_resultImage = document.createElement('img');
        shellgeiImage = 'data:image/jpeg;base64,'+shellgeiImage;
        img_resultImage.src = shellgeiImage;
        img_resultImage.alt = 'result image';
        img_resultImage.id = 'result_img_child';
        resultImageParent.appendChild(img_resultImage);

        setTimeout(() => {
            // 想定出力画像をbase64に変換
            var outputImageChild = outputImageParent.lastElementChild;
            var output_img_b64 = ImageToBase64(outputImageChild, "image/jpeg", "output_img_tmp")

            // 出力結果の画像をbase64で再び取得
            var resultImageChild = resultImageParent.lastElementChild;
            var result_img_b64 = ImageToBase64(resultImageChild, "image/jpeg", "result_img_tmp")

            // log
            // console.log("text Expected: "+replacedOutput);
            // console.log("text Result: "+shellgeiResult);
            // console.log("Shellgei Image Output: "+shellgeiImage);
            // console.log("Image Expected: "+output_img_b64);
            // console.log("Image Result: "+result_img_b64);

            // 正誤判定
            if(shellgeiResult == replacedOutput && output_img_b64 == result_img_b64) {
                if(is_jp) {
                    resultText.innerHTML = "正解 !!😄!!";
                } else {
                    resultText.innerHTML = "Correct !!😄!!";
                }
            } else {
                if(is_jp) {
                    resultText.innerHTML = "不正解 ...😭...";
                } else {
                    resultText.innerHTML = "Incorrect ...😭...";
                }
            }
        }, 500);
    }
}

// Ctrl+Enterで投稿
document.body.addEventListener('keydown',
    event => {
        if (event.key === 'v' && event.key === 'Enter') {
            submitClick();
        }
    });

// 実行ボタンの設定
var submitButton = document.getElementById('submitButton');
submitButton.addEventListener('click', submitClick);
