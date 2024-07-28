

const svgShow = document.getElementById('svgShow');
const txtInput = document.getElementById('txtInput');
const aDownload = document.getElementById('aDownload');
const btnDownload = document.getElementById('btnDownload');
const selLanguage = document.getElementById('selLanguage');
const selRotation = document.getElementById('selRotation');
const selErrorCorrectLevel = document.getElementById('selErrorCorrectLevel');
const chkMini = document.getElementById('chkMini');
const chkLogo = document.getElementById('chkLogo');
const iptLogo = document.getElementById('iptLogo');
const svgLogo = document.getElementById('svgLogo');
const liEncode = document.getElementById('liEncode');
const liDesign = document.getElementById('liDesign');
const liLogo = document.getElementById('liLogo');
const chkUrlEncode = document.getElementById('chkUrlEncode');
const selMask = document.getElementById('selMask');
const chkBgRotate = document.getElementById('chkBgRotate');
const chkBgRadius = document.getElementById('chkBgRadius');
const iptFgColorHex = document.getElementById('iptFgColorHex');
const iptFgColor = document.getElementById('iptFgColor');
const iptBgColorHex = document.getElementById('iptBgColorHex');
const iptBgColor = document.getElementById('iptBgColor');
const selVersion = document.getElementById('selVersion');
const chkBackground = document.getElementById('chkBackground');
const selPadding = document.getElementById('selPadding');
const selFinderPatternType = document.getElementById('selFinderPatternType');
const selModuleStyle = document.getElementById('selModuleStyle');


const xmls = 'http://www.w3.org/2000/svg';
const svgWidth = 10000;
const logoWidth = 2000;
const logoBgRadius0 = logoWidth / Math.sqrt(2);
const logoBgRadius45 = logoWidth / 2;
const logoStartPosition0 = svgWidth / 2 - logoBgRadius0 / Math.sqrt(2);
const logoStartPosition45 = svgWidth / 2 - logoBgRadius45 / Math.sqrt(2);

var matrixTemp;
var transparentPath = '';
const grayRectangle = document.createElementNS(xmls, 'rect');
const whitePath = document.createElementNS(xmls, 'path');
const logoBackground0 = document.createElementNS(xmls, 'circle');
const logoBackground45 = document.createElementNS(xmls, 'circle');

window.addEventListener('load', BodyInit);

/**
 * 頁面載入完成後的事件
 */
function BodyInit(){
    btnDownload.addEventListener('click', BtnDownloadClick);
    chkMini.checked = true;
    chkMini.addEventListener('change', ChkMiniChange);
    selErrorCorrectLevel.setAttribute('disabled', true);
    selErrorCorrectLevel.addEventListener('change', GenerateQRcode);
    selErrorCorrectLevel.value = '0';
    chkLogo.addEventListener('change', ChkLogoChange);
    iptLogo.classList.add('hidden');
    iptLogo.addEventListener('change', IptLogoChange);
    RenderLanguageList();
    selLanguage.addEventListener('change', RenderLanguage);
    selLanguage.value = 'zh';
    txtInput.addEventListener('keyup', GenerateQRcode);
    selRotation.addEventListener('change', SelRotationChange);
    RenderLanguage();
    liDesign.classList.add('hover');
    tabDesign.classList.add('hidden');
    liLogo.classList.add('hover');
    tabLogo.classList.add('hidden');
    liEncode.addEventListener('click', ListClick);
    liDesign.addEventListener('click', ListClick);
    liLogo.addEventListener('click', ListClick);
    
    chkUrlEncode.setAttribute('checked', true);
    chkUrlEncode.setAttribute('disabled', true);
    chkUrlEncode.addEventListener('change', GenerateQRcode);
    
    selMask.addEventListener('change', GenerateQRcode);
    selMask.setAttribute('disabled', true);
    iptFgColor.value = '#000000';
    iptFgColor.addEventListener('change', function(){
        iptFgColorHex.value = iptFgColor.value.substr(1).toUpperCase();
        RenderSvg();
    });
    iptFgColorHex.value = '000000';
    iptFgColorHex.addEventListener('change', function(){
        const hexText = FormatHexColor(iptFgColorHex.value);
        if (hexText.length === 0){
            console.error('不合格的 RGB 編碼：' + iptFgColorHex.value);
        }
        else{
            iptFgColor.value = '#' + hexText;
            iptFgColorHex.value = hexText;
            RenderSvg();
        }
    });
    iptBgColor.value = '#FFFFFF';
    iptBgColor.addEventListener('change', function(){
        iptBgColorHex.value = iptBgColor.value.substr(1).toUpperCase();
        RenderSvg();
    });
    iptBgColorHex.value = 'FFFFFF';
    iptBgColorHex.addEventListener('change', function(){
        const hexText = FormatHexColor(iptBgColorHex.value);
        if (hexText.length === 0){
            console.error('不合格的 RGB 編碼：' + iptBgColorHex.value);
        }
        else{
            iptBgColor.value = '#' + hexText;
            iptBgColorHex.value = hexText;
            RenderSvg();
        }
    });
    selVersion.addEventListener('change', GenerateQRcode);
    selVersion.setAttribute('disabled', true);
    chkBackground.checked = true;
    chkBackground.addEventListener('change', ChkBackgroundChange);
    InitSvgShareDom();

    chkBgRadius.addEventListener('change', RenderSvg);
    chkBgRotate.setAttribute('disabled', true);
    selPadding.value = '4';
    selPadding.addEventListener('change', RenderSvg);
    selFinderPatternType.addEventListener('change', RenderSvg);
    selFinderPatternType.value = 'normal';
    selModuleStyle.value = 'rectangle';
    selModuleStyle.addEventListener('change', RenderSvg);
    chkBgRotate.addEventListener('change', RenderSvg);

    RenderLogo();
    GenerateQRcode();
}

/**
 * 自動編碼的勾選框的改變事件
 */
function ChkMiniChange(){
    // 點選完是勾選，也就是從未勾選變成勾選
    if (chkMini.checked){
        // 將各個細項設定加 disabled，不給使用，版本與遮罩使用最佳設定，有上傳自訂圖示或是有選擇圖示時，錯誤修正等級使用 H，不然用 M
        selErrorCorrectLevel.setAttribute('disabled', true);
        chkUrlEncode.setAttribute('disabled', true);
        selMask.setAttribute('disabled', true);
        selMask.value = '-1';
        selErrorCorrectLevel.value = (iptLogo.files.length > 0 || document.querySelector('#divLogoList>svg.selected')) ? '2' : '0';
        selVersion.setAttribute('disabled', true);
        selVersion.value = '-1';
    }
    // 取消勾選
    else{
        // 開放各細項設定
        selErrorCorrectLevel.removeAttribute('disabled');
        CheckChkUrlEncode();
        selMask.removeAttribute('disabled');
        selVersion.removeAttribute('disabled');
    }
    GenerateQRcode();
}

/**
 * 依要編碼文字判斷是否 disable 網址編碼的勾選框
 */
function CheckChkUrlEncode(){
    if (chkMini.checked) return;
    const content = txtInput.value;
    if (content.length > 0){
        // 字元以 http:// 或是 https:// 開頭的文字，則開放可勾選
        if (content.indexOf('http://') === 0 || content.indexOf('https://') === 0){
            chkUrlEncode.removeAttribute('disabled');
        }
        else{
            chkUrlEncode.setAttribute('disabled', true);
        }
    }
    else{
        chkUrlEncode.setAttribute('disabled', true);
    }
}

/**
 * 取得下載檔名，使用日期時間戳
 * @returns {string} qrcode_yyyymmdd_hhMMss.svg
 */
function GetDownloadFileName(){
    let dtNow = new Date();
    let year = dtNow.getFullYear();
    let month = FormatDate(dtNow.getMonth() + 1)
    let date = FormatDate(dtNow.getDate());
    let hour = FormatDate(dtNow.getHours());
    let minute = FormatDate(dtNow.getMinutes());
    let second = FormatDate(dtNow.getSeconds());
    return 'qrcode_' + year + month + date + '_' + hour + minute + second;
}

/**
 * 日期時間是否補 0
 * @param {number} number 年月日時分秒的數字
 * @returns {string} 年月日時分秒的文字
 */
function FormatDate(number){
    if (number < 10) {
        return '0' + number;
    }
    else{
        return number.toString();
    }
}

/**
 * 下載按鈕的點擊事件，下載 svg 檔案
 */
function BtnDownloadClick(){
    // 透明背景先刪除
    const gTransparent = document.getElementById('group_transparent');
    gTransparent.remove();
    const content = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n' + svgShow.outerHTML;
    // 產生完再重建透明背景
    CreateTransparent();

    const blob = new Blob([content], { type: 'image/svg+xml'});
    // 從 Blob 物件建立生命週期與 document 綁在一起的 URL 字串
    const url = URL.createObjectURL(blob);
    aDownload.setAttribute('href', url);

    const fileName = GetDownloadFileName();
    aDownload.setAttribute('download', fileName);

    aDownload.click();
    // 釋放瀏覽器對此 URL 的引用
    URL.revokeObjectURL(url);
}

/**
 * 產生語言的下拉選單
 */
function RenderLanguageList(){
    for(let id in lang){
        let item = lang[id];
        if (item.enable){
            let option = new Option(item.name, id);
            selLanguage.appendChild(option);
        }
    }
}

/**
 * 頁籤的點擊事件
 * @param {object} e 事件
 */
function ListClick(e){
    const dom = e.target;
    // 點擊的是自己則結束
    if (!dom.classList.contains('hover')){
        return;
    }
    // 將點擊的頁籤樣式調整為顯示，隱藏其他分頁
    if (dom.id === 'liEncode'){
        liEncode.classList.remove('hover');
        tabEncode.classList.remove('hidden');
        liDesign.classList.add('hover');
        tabDesign.classList.add('hidden');
        liLogo.classList.add('hover');
        tabLogo.classList.add('hidden');
    }
    else if (dom.id === 'liDesign'){
        liEncode.classList.add('hover');
        tabEncode.classList.add('hidden');
        liDesign.classList.remove('hover');
        tabDesign.classList.remove('hidden');
        liLogo.classList.add('hover');
        tabLogo.classList.add('hidden');
    }
    else if (dom.id === 'liLogo'){
        liEncode.classList.add('hover');
        tabEncode.classList.add('hidden');
        liDesign.classList.add('hover');
        tabDesign.classList.add('hidden');
        liLogo.classList.remove('hover');
        tabLogo.classList.remove('hidden');
    }
}

/**
 * 依下拉選單的選項更新語言
 */
function RenderLanguage(){
    const id = selLanguage.value;
    if (!lang[id] || !lang[id]['enable']){
        console.error('不存在或無設定開啟的語言');
        return;
    }
    const item = lang[id];

    chkMini.setAttribute('title', item['label_mini_hover']);
    document.getElementById('lblMini').textContent = item['label_mini'];
    document.getElementById('lblMini').setAttribute('title', item['label_mini_hover']);
    chkLogo.setAttribute('title', item['label_logo_hover']);
    document.getElementById('lblLogo').textContent = item['label_logo']
    document.getElementById('lblLogo').setAttribute('title', item['label_logo_hover']);
    btnDownload.textContent = item['button_download'];
    document.getElementById('lblErrorCorrectLevel').textContent = item['label_error_correct_level'];
    document.getElementById('lblErrorCorrectLevel').setAttribute('title', item['label_error_correct_level_hover']);
    document.getElementById('lblRotation').textContent = item['label_rotation'];
    for(let i = 0; i < 3; i++){
        selRotation.children[i].textContent = item['option_rotation'][i];
    }
    const lists = document.getElementById('tabList').querySelectorAll('ul li');
    for(let i = 0; i < 3; i++){
        lists[i].textContent = item['tab_list'][i];
    }

    document.getElementById('lblUrlEncode').textContent = item['label_urlencode'];
    document.getElementById('lblUrlEncode').setAttribute('title', item['label_urlencode_hover']);
    chkUrlEncode.setAttribute('title', item['label_urlencode_hover']);
    document.getElementById('lblMask').textContent = item['label_custom_mask'];
    document.getElementById('lblMask').setAttribute('title', item['label_custom_mask_hover']);
    selMask.children[0].textContent = item['option_best_mask'];
    document.getElementById('lblBgRotate').textContent = item['label_background_rotation'];
    document.getElementById('lblBgRadius').textContent = item['label_background_rounded'];
    document.getElementById('lblFgColor').textContent = item['label_foreground_color'];
    iptFgColorHex.setAttribute('title', item['label_foreground_color_hex_hover']);
    document.getElementById('lblBgColor').textContent = item['label_background_color'];
    iptBgColorHex.setAttribute('title', item['label_background_color_hex_hover']);
    document.getElementById('lblVersion').textContent = item['label_version'];
    document.getElementById('lblVersion').setAttribute('title', item['label_version_hover']);
    selVersion.children[0].textContent = item['option_min_version'];
    document.getElementById('lblPadding').textContent = item['label_padding'];
    document.getElementById('lblPadding').setAttribute('title', item['label_padding_hover']);
    document.getElementById('lblFinderPatternType').textContent = item['label_finder_pattern_type'];
    for(let i = 0; i < 4; i++){
        selFinderPatternType.children[i].textContent = item['option_finder_pattern_type'][i];
    }
    document.getElementById('lblModuleStyle').textContent = item['label_module_style'];
    for(let i = 0; i < 3; i++){
        selModuleStyle.children[i].textContent = item['option_module_style'][i];
    }
    document.getElementById('setInfo').querySelector('legend').textContent = item['field_info'];
    document.getElementById('divFg').querySelector('label').textContent = item['field_fg'];
    document.getElementById('divBg').querySelector('label').textContent = item['field_bg'];
    document.getElementById('divBg').querySelector('label').setAttribute('title', item['label_background_hover']);
    chkBackground.setAttribute('title', item['label_background_hover']);

    document.getElementById('ifoCharacterLength').textContent = item['info_character_length'];
    document.getElementById('ifoEncodingMode').textContent = item['info_encoding_mode'];
    document.getElementById('ifoErrorCorrectLevel').textContent = item['info_error_correct_level'];
    document.getElementById('ifoVersion').textContent = item['info_version'];
    document.getElementById('ifoDataCodewordNumber').textContent = item['info_data_codeword_number'];
    document.getElementById('ifoErrorCorrectCodewordNumber').textContent = item['info_error_correct_codeword_number'];
    document.getElementById('ifoMaskIndex').textContent = item['info_mask_index'];
    document.getElementById('ifoPenaltyScore').textContent = item['info_penalty_score'];
    document.getElementById('divMessage').querySelector('span').textContent = item['message'];
    document.title = item['document_title'];
}

/**
 * 清除 SVG 內容
 */
function RemoveSVG(){
    while(svgShow.children.length > 0){
        svgShow.children[0].remove();
    }
}

/**
 * 產生 QR Code，規格有變動時走這支，要重新產生
 */
function GenerateQRcode(){
    CheckChkUrlEncode();
    const matrix = RenderQRcode();
    if (!matrix){
        RemoveSVG();
        return;
    }
    matrixTemp = matrix;
    const setting = GetDrawSetting();

    DrawSVG(matrix, setting);
}

/**
 * 不重新產生 QR Code，規格沒有變動時走這支，依已產生的資料重繪
 */
function RenderSvg(){
    if (!matrixTemp){
        console.error('缺少資料');
        return;
    }
    const setting = GetDrawSetting();
    DrawSVG(matrixTemp, setting);
}

/**
 * 產生矩陣的主程式
 * @returns {Uint8Array[]} 矩陣
 */
function RenderQRcode(){
    let result;
    let content = (!chkMini.checked && !chkUrlEncode.disabled && chkUrlEncode.checked) ? encodeURI(txtInput.value) : txtInput.value;
    const contentOld = (!chkMini.checked && !chkUrlEncode.disabled &&chkUrlEncode.checked) ? encodeURI(txtInput.value) : txtInput.value;
    if (content.length === 0){
        // 文字為空時將資訊欄設為空白
        SetInfo(0, -1, -1, 0, 0, 0, 0, 0);
        return;
    }
    let maskIndex = chkMini.checked ? -1 : parseInt(selMask.value);
    let version = chkMini.checked ? -1 : parseInt(selVersion.value);
    let encodingModeOld = GetEncodingMode(contentOld);
    if (encodingModeOld == 5) encodingModeOld = 4;


    let encodingMode = GetEncodingMode(content);
    if (encodingMode === 5){
        content = GetUnicodeByteData(content);
        encodingMode = 4;
    }
    const errorCorrectLevel = GetErrorCorrectLevel();
    const errorCorrectLevelOld = 'M';
    const capacityLevel = GetCapacityAndVersion(encodingModeOld, errorCorrectLevel, contentOld);
    let versionOld = capacityLevel['version'];

    const lengthBit = GetContentLengthBits(encodingModeOld, versionOld);

    try{
        timeStart = GetNow();

        const qrCodeDataOld = getCodewords(contentOld, errorCorrectLevelOld, versionOld);
        versionOld = qrCodeDataOld.version;
        const codewordsOld = qrCodeDataOld.codewords;
        const lastMatrix = getOptimalMask(versionOld, codewordsOld, errorCorrectLevelOld);

        timeEnd = GetNow();
        console.log(`1經過時間：${timeEnd - timeStart}毫秒`);
        //console.log('old', lastMatrix);
        result = lastMatrix[0];
    }
    catch(e){
        console.error(e);
    }



    timeStart = GetNow();
    
    const qrCodeData = GetCodewords(content, errorCorrectLevel, version);
    version = qrCodeData.version;
    const matrix = GetNewMatrix(version);
    const minVersion = qrCodeData.minVersion;
    FillPattern(matrix, version);
    const sequence = GetSequence(matrix);
    const combinedCodewords = qrCodeData.codewords;

    const best = maskIndex === -1 ?
        GetOptimalMask(matrix, sequence, combinedCodewords, errorCorrectLevel, version) :
        GetSpecificMask(matrix, sequence, combinedCodewords, errorCorrectLevel, version, maskIndex);
    const dataCodewordsNumber = qrCodeData.dataCodewordsNumber;
    const errorCorrectCodewordsNumber = qrCodeData.errorCorrectCodewordsNumber;

    timeEnd = GetNow();

    console.log(`2經過時間：${timeEnd - timeStart}毫秒`);
    //console.log('new', best);
    result = best[0];
    
    SetInfo(content.length, encodingMode, errorCorrectLevel, version, dataCodewordsNumber, errorCorrectCodewordsNumber, best[1], best[2]);
    RenderQRcodeCallback(minVersion, version);
    return result;
}

/**
 * 計算完矩陣的後續動作
 * @param {number} minVersion 依容量取得的最小版本
 * @param {number} version 目前版本
 */
function RenderQRcodeCallback(minVersion, version){
    // 是否版本的下拉選單是選擇最佳
    const specifiedMinVersion = selVersion.value === '-1';
    // 清空版本選單中的所有選項
    while(selVersion.children.length > 0){
        selVersion.children[0].remove();
    }
    const item = lang[selLanguage.value];
    const minOption = new Option(item['option_min_version'], '-1');
    selVersion.appendChild(minOption);
    // 產生最小版本以上到 40 的選項到下拉選單裡
    for(let i = minVersion; i <= 40; i++){
        const option = new Option(i, i);
        selVersion.appendChild(option);
    }
    // 若版本下拉選單不是選擇最佳，則選在目前版本
    selVersion.value = specifiedMinVersion ? '-1' : version;
}

/**
 * 取得下拉選單中，選擇的錯誤修正等級 [0=M, 1=L, 2=H, 3=Q]
 * @returns {number} 錯誤修正等級 index
 */
function GetErrorCorrectLevel(){
    return parseInt(selErrorCorrectLevel.value);
}

/**
 * 取得現在時間的毫秒數，到小數下之浮點數即有微秒部份
 * @returns {number} 毫秒
 */
function GetNow(){
    return performance.timeOrigin + performance.now();
}

/**
 * 取得繪製的各項設定
 * @returns 繪製的設定物件
 */
function GetDrawSetting(){
    const setting = {};
    setting['ModuleColor'] = iptFgColor.value;
    setting['BackgroundColor'] = chkBackground.checked ? iptBgColor.value : null;
    setting['BackgroundCornerRadius'] = chkBgRadius.checked;
    setting['Rotation'] = parseInt(selRotation.value);
    setting['CustomLogo'] = '';
    setting['BackgroundRotation'] = chkBgRotate.checked;
    setting['PaddingModuleCount'] = parseInt(selPadding.value);
    setting['FinderPatternType'] = selFinderPatternType.value;
    setting['ModuleStyleType'] = selModuleStyle.value;
    return setting;
}

/**
 * 繪製 QR Code
 * @param {Uint8Array[]} matrix 資料矩陣
 * @param {object} setting 繪製的設定物件
 */
function DrawSVG(matrix, setting){
    RemoveSVG();
    CreateTransparent();
    svgShow.setAttribute('viewBox', `0 0 ${svgWidth} ${svgWidth}`);
    const docFrag = document.createDocumentFragment();
    const s = matrix.length;
    let moduleWidth = (svgWidth) / (s + setting['PaddingModuleCount'] * 2);
    const isFgRotate = setting['Rotation'] !== 0;
    const isBgRotate = isFgRotate ? setting['BackgroundRotation'] : false;
    let padding;
    if (isFgRotate){
        padding = moduleWidth * setting['PaddingModuleCount'] / Math.sqrt(2);
        moduleWidth = (svgWidth / (s + setting['PaddingModuleCount'] * Math.sqrt(2))) / 2;
    }
    else{
        padding = moduleWidth * setting['PaddingModuleCount'];
    }
    //padding = Math.floor(padding);
    //moduleWidth = Math.floor(moduleWidth);

    DrawBackground(setting['BackgroundColor'], isFgRotate, isBgRotate, setting['BackgroundCornerRadius'], padding, docFrag);
    DrawModule(matrix, setting['ModuleStyleType'], setting['Rotation'], padding, moduleWidth, s, setting['ModuleColor'], docFrag);
    DrawFinderPattern(setting['FinderPatternType'], setting['Rotation'], padding, moduleWidth, s, setting['ModuleColor'], docFrag);

    svgShow.appendChild(docFrag);
    // 有上傳自訂圖示時附加到中央
    if (chkLogo.checked && iptLogo.files.length > 0){
        AppendLogo('svgLogo', isFgRotate, setting['BackgroundColor']);
    }
    // 沒有上傳時檢查有無點選提供的圖示，有則附加到中央
    else{
        const selectedLogo = document.getElementById('divLogoList').querySelector('svg.selected');
        if (selectedLogo){
            AppendLogo(selectedLogo.getAttribute('id'), isFgRotate, setting['BackgroundColor']);
        }
    }
}

/**
 * 繪製背景
 * @param {string} color 背景顏色，格式為 #000000 ~ #ffffff
 * @param {boolean} fgRotate 前景是否旋轉，45 度或 -135 度時為 true，0 度時為 false
 * @param {boolean} bgRotate 背景是否旋轉，45 度或 -135 度時為 true，0 度時為 false
 * @param {boolean} isRounded 背景是否有圓角，true 為有圓角矩形，false 為完整矩形
 * @param {number} radius 有圓角時的圓角半徑長度
 * @param {DocumentFragment} docFrag 要附加進的文件片段
 */
function DrawBackground(color, fgRotate, bgRotate, isRounded, radius, docFrag){
    // 有背景顏色（非透明），則增加背景
    if (color){
        const g = document.createElementNS(xmls, 'g');
        g.setAttribute('id', 'group_background');
        // 背景旋轉
        if (fgRotate && bgRotate){
            const pathBg = document.createElementNS(xmls, 'path');

            let d = '';
            // 有圓角則多畫 arc 的部份
            if (isRounded){
                const offsetArc = radius * Math.sqrt(2);
                const offsetSide = svgWidth / 2 - radius;
                d = `m${svgWidth / 2 - offsetArc / 2} ${radius - offsetArc / 2}a${radius} ${radius} 0 0 1 ${offsetArc} 0l${offsetSide} ${offsetSide}a${radius} ${radius} 0 0 1 0 ${offsetArc}l-${offsetSide} ${offsetSide}a${radius} ${radius} 0 0 1 -${offsetArc} 0l-${offsetSide} -${offsetSide}a${radius} ${radius} 0 0 1 0 -${offsetArc}z`;
            }
            else{
                const offset = svgWidth / 2;
                d = `m${offset} 0l${offset} ${offset}l-${offset} ${offset} l-${offset} -${offset}z`;
            }
            pathBg.setAttribute('d', d);
            pathBg.setAttribute('fill', color);
            g.appendChild(pathBg);
        }
        // 背景不旋轉
        else {
            const rectBg = document.createElementNS(xmls, 'rect');
            rectBg.setAttribute('x', '0');
            rectBg.setAttribute('y', '0');
            rectBg.setAttribute('width', svgWidth);
            rectBg.setAttribute('height', svgWidth);
            rectBg.setAttribute('fill', color);
            // 有圓角則增加 rx ry 屬性
            if (isRounded){
                rectBg.setAttribute('rx', radius * 2);
                rectBg.setAttribute('ry', radius * 2);
            }
            g.appendChild(rectBg);
        }
        docFrag.appendChild(g);
    }
}

/**
 * 繪製前景格子
 * @param {Uint8Array[]} matrix 矩陣資料
 * @param {string} moduleType 前景樣式，有 rectangle、disc、dot
 * @param {number} rotationAngle 前景旋轉的角度，有 0、45、-135
 * @param {number} p 邊距多少 px
 * @param {number} w 格子寬度
 * @param {number} s 邊數
 * @param {string} color 前景顏色，格式為 #000000 ~ #ffffff
 * @param {DocumentFragment} docFrag 要附加進的文件片段
 */
function DrawModule(matrix, moduleType, rotationAngle, p, w, s, color, docFrag){
    const g = document.createElementNS(xmls, 'g');
    g.setAttribute('id', 'group_module');
    if (rotationAngle === 0){
        if (moduleType === 'rectangle'){
            for (let r = 0; r < s; r++){
                for(let c = 0; c < s; c++){
                    // 只處理有值的 module
                    if (matrix[r][c] == 0){
                        continue;
                    }
                    // Finder Pattern 另外畫
                    if ((r <= 7 && c <= 7) || (r <= 7 && c >= s - 8) || (r >= s - 8 && c <= 7)){
                        continue;
                    }
                    //TODO: 有能力再改成path
                    const module = document.createElementNS(xmls, 'rect');
                    module.setAttribute('x', p + w * c);
                    module.setAttribute('y', p + w * r);
                    module.setAttribute('width', w);
                    module.setAttribute('height', w);
                    module.setAttribute('fill', color);

                    g.appendChild(module);
                }
            }
        }
        else if (moduleType === 'disc' || moduleType === 'dot'){
            const radius = moduleType === 'disc' ? w / 2 : w / 3;
            for (let r = 0; r < s; r++){
                for(let c = 0; c < s; c++){
                    // 只處理有值的 module
                    if (matrix[r][c] == 0){
                        continue;
                    }
                    // Finder Pattern 另外畫
                    if ((r <= 7 && c <= 7) || (r <= 7 && c >= s - 8) || (r >= s - 8 && c <= 7)){
                        continue;
                    }
                    //TODO: 有能力再改成path
                    const module = document.createElementNS(xmls, 'circle');
                    module.setAttribute('cx', p + w * (c + 0.5));
                    module.setAttribute('cy', p + w * (r + 0.5));
                    module.setAttribute('r', radius);
                    module.setAttribute('fill', color);

                    g.appendChild(module);
                }
            }
        }
    }
    else if (rotationAngle === 45){
        if (moduleType === 'rectangle'){
            const x = svgWidth / 2;
            const y = p;
            for (let r = 0; r < s; r++){
                for(let c = 0; c < s; c++){
                    // 只處理有值的 module
                    if (matrix[r][c] == 0){
                        continue;
                    }
                    // Finder Pattern 另外畫
                    if ((r <= 7 && c <= 7) || (r <= 7 && c >= s - 8) || (r >= s - 8 && c <= 7)){
                        continue;
                    }
                    const module = document.createElementNS(xmls, 'path');
                    module.setAttribute('d', `M${x + w * (c - r)} ${y + w * (c + r)}l${w} ${w}l-${w} ${w}l-${w} -${w}z`);
                    module.setAttribute('fill', color);
                    module.setAttribute('stroke', color);
                    g.appendChild(module);
                }
            }

        }
        else if (moduleType === 'disc' || moduleType === 'dot'){
            const radius = moduleType === 'disc' ? (w / Math.sqrt(2)) : (w * Math.sqrt(2) / 3);
            const x = svgWidth / 2;
            const y = p + w;
            for (let r = 0; r < s; r++){
                for(let c = 0; c < s; c++){
                    // 只處理有值的 module
                    if (matrix[r][c] == 0){
                        continue;
                    }
                    // Finder Pattern 另外畫
                    if ((r <= 7 && c <= 7) || (r <= 7 && c >= s - 8) || (r >= s - 8 && c <= 7)){
                        continue;
                    }
                    const module = document.createElementNS(xmls, 'circle');
                    module.setAttribute('cx', x + w * (c - r));
                    module.setAttribute('cy', y + w * (c + r));
                    module.setAttribute('r', radius);
                    module.setAttribute('fill', color);
                    g.appendChild(module);
                }
            }
        }
    }
    else if (rotationAngle === -135){
        if (moduleType === 'rectangle'){
            const x = svgWidth / 2;
            const y = p + w * 2 * s;
            for (let r = 0; r < s; r++){
                for(let c = 0; c < s; c++){
                    // 只處理有值的 module
                    if (matrix[r][c] == 0){
                        continue;
                    }
                    // Finder Pattern 另外畫
                    if ((r <= 7 && c <= 7) || (r <= 7 && c >= s - 8) || (r >= s - 8 && c <= 7)){
                        continue;
                    }
                    const module = document.createElementNS(xmls, 'path');
                    module.setAttribute('d', `M${x + w * (r - c)} ${y - w * (c + r)}l-${w} -${w}l${w} -${w}l${w} ${w}z`);
                    module.setAttribute('fill', color);
                    module.setAttribute('stroke', color);
                    g.appendChild(module);
                }
            }

        }
        else if (moduleType === 'disc' || moduleType === 'dot'){
            const radius = moduleType === 'disc' ? (w / Math.sqrt(2)) : (w * Math.sqrt(2) / 3);
            const x = svgWidth / 2;
            const y = p + w * 2 * s - w;
            for (let r = 0; r < s; r++){
                for(let c = 0; c < s; c++){
                    // 只處理有值的 module
                    if (matrix[r][c] == 0){
                        continue;
                    }
                    // Finder Pattern 另外畫
                    if ((r <= 7 && c <= 7) || (r <= 7 && c >= s - 8) || (r >= s - 8 && c <= 7)){
                        continue;
                    }
                    const module = document.createElementNS(xmls, 'circle');
                    module.setAttribute('cx', x + w * (r - c));
                    module.setAttribute('cy', y - w * (c + r));
                    module.setAttribute('r', radius);
                    module.setAttribute('fill', color);
                    g.appendChild(module);
                }
            }
        }
    }
    docFrag.appendChild(g);
}

/**
 * 繪製定位標記
 * @param {string} patternType 定位標記的樣式，有 normal、angle_rounded、out_rounded、out_in_rounded
 * @param {number} rotationAngle 前景旋轉的角度，有 0、45、-135
 * @param {number} p 邊距多少 px
 * @param {number} w 格子寬度
 * @param {number} s 邊數
 * @param {string} color 前景顏色，格式為 #000000 ~ #ffffff
 * @param {DocumentFragment} docFrag 要附加進的文件片段
 */
function DrawFinderPattern(patternType, rotationAngle, p, w, s, color, docFrag){
    let d = '';
    const t = 1;
    const w7 = w * 7, w5 = w * 5, w3 = w * 3, w2 = w * 2;
    if(rotationAngle === 0){
        const r = w * t;
        switch(patternType){
            case 'normal':
                const drawWhole = `h${w7}v${w7}h-${w7}zm${w} ${w}v${w5}h${w5}v-${w5}zm${w} ${w}h${w3}v${w3}h-${w3}z`;
                d = `m${p} ${p}${drawWhole}`;
                d += `m${w * (s - 9)} -${w * 2}${drawWhole}`;
                d += `m-${w * (s - 5)} ${w * (s - 9)}${drawWhole}`;
                break;
            case 'angle_rounded':
                const drawMiddle = `m-${w} -${w}v-${w5}h-${w5}v${w5}z`;
                d = `m${p + w7} ${p + w7}h-${w7}v-${w * (7 - t)}a${r} ${r} 0 0 1 ${r} -${r}h${w * (7 - t)}z${drawMiddle}m-${w} -${w}h-${w3}v-${w * (3 - t)}a${r} ${r} 0 0 1 ${r} -${r}h${w * (3 - t)}z`;
                d += `m${w * (s - 5)} ${w2}h-${w7}v-${w7}h${w * (7 - t)}a${r} ${r} 0 0 1 ${r} ${r}z${drawMiddle}m-${w} -${w}h-${w3}v-${w3}h${w * (3 - t)}a${r} ${r} 0 0  1 ${r} ${r}z`;
                d += `m-${w * (s - 9)} ${w * (s -5)}h-${w * (7 - t)}a${r} ${r} 0 0 1 -${r} -${r}v-${w * (7 - t)}h${w7}z${drawMiddle}m-${w} -${w}h-${w * (3 - t)}a${r} ${r} 0 0 1 -${r} -${r}v-${w * (3 - t)}h${w3}z`;
                break;
            case 'out_rounded':
                const drawOutWhole = `h${w * (3.5 - t)}a${r} ${r} 0 0 1 ${r} ${r}v${w * (7 - t * 2)}a${r} ${r} 0 0 1 -${r} ${r}h-${w * (7 - t * 2)}a${r} ${r} 0 0 1 -${r} -${r}v-${w * (7 - t * 2)}a${r} ${r} 0 0 1 ${r} -${r}zm-${w * 2.5} ${w}v${w5}h${w5}v-${w5}zm${w} ${w}h${w3}v${w3}h-${w3}z`;
                d = `m${p + w * 3.5} ${p}${drawOutWhole}`;
                d += `m${w * (s - 5.5)} -${w * 2}${drawOutWhole}`;
                d += `m-${w * (s - 8.5)} ${w * (s - 9)}${drawOutWhole}`;
                break;
            case 'out_in_rounded':
                const drawOutInWhole = `h${w * (3.5 - t)}a${r} ${r} 0 0 1 ${r} ${r}v${w * (7 - t * 2)}a${r} ${r} 0 0 1 -${r} ${r}h-${w * (7 - t * 2)}a${r} ${r} 0 0 1 -${r} -${r}v-${w * (7 - t * 2)}a${r} ${r} 0 0 1 ${r} -${r}zm0 ${w}h-${w * 2.5}v${w5}h${w5}v-${w5}zm0 ${w}h${w * (1.5 - t)}a${r} ${r} 0 0 1 ${r} ${r}v${w * (3 - t * 2)}a${r} ${r} 0 0 1 -${r} ${r}h-${w * (3 - t * 2)}a${r} ${r} 0 0 1 -${r} -${r}v-${w * (3 - t * 2)}a${r} ${r} 0 0 1 ${r} -${r}z`;
                d = `m${p + w * 3.5} ${p}${drawOutInWhole}`;
                d += `m${w * (s - 7)} -${w * 2}${drawOutInWhole}`;
                d += `m-${w * (s - 7)} ${w * (s - 9)}${drawOutInWhole}`;
                break;
            default:
                break;
        }
    }
    else if (rotationAngle === 45){
        const r = w * t * 2;
        const x = svgWidth / 2;
        switch(patternType){
            case 'normal':
                const drawWhole = `l${w7} ${w7}l-${w7} ${w7}l-${w7} -${w7}zm0 ${w2}l-${w5} ${w5}l${w5} ${w5}l${w5} -${w5}zm0 ${w2}l${w3} ${w3}l-${w3} ${w3}l-${w3} -${w3}z`;
                d = `m${x} ${p}${drawWhole}`;
                d += `m${w * (s - 7)} ${w * (s - 11)}${drawWhole}`;
                d += `m-${w2 * (s - 7)} -${w2 * 2}${drawWhole}`;
                break;
            case 'angle_rounded':
                const drawMiddle = `m0 -${w2}l${w5} -${w5}l-${w5} -${w5}l-${w5} ${w5}z`;
                d = `m${x} ${p + w2 * 7}l-${w7} -${w7}l${w * (7 - t)} -${w * (7 - t)}a${r} ${r} 0 0 1 ${w2} 0l${w * (7 - t)} ${w * (7 - t)}z${drawMiddle}m0 -${w2}l-${w3} -${w3}l${w * (3 - t)} -${w * (3 - t)}a${r} ${r} 0 0 1 ${w2} 0l${w * (3 - t)} ${w * (3 - t)}z`;
                d += `m${w * (s - 7)} ${w * (s - 3)}l-${w7} -${w7}l${w7} -${w7}l${w * (7 - t)} ${w * (7 - t)}a${r} ${r} 0 0 1 0 ${w2}z${drawMiddle}m0 -${w2}l-${w3} -${w3}l${w3} -${w3}l${w * (3 - t)} ${w * (3 - t)}a${r} ${r} 0 0 1 0 ${w2}z`;
                d += `m-${w2 * (s - 7)} ${w2 * 2}l-${w * (7 - t)} -${w * (7 - t)}a${r} ${r} 0 0 1 0 -${w2}l${w * (7 - t)} -${w * (7 -t)}l${w7} ${w7}z${drawMiddle}m0 -${w2}l-${w * (3 - t)} -${w * (3 - t)}a${r} ${r} 0 0 1 0 -${w2}l${w * (3 - t)} -${w * (3 - t)}l${w3} ${w3}z`;
                break;
            case 'out_rounded':
                const drawOutWhole = `l${w * (3.5 - t)} ${w * (3.5 - t)}a${r} ${r} 0 0 1 0 ${w2}l-${w * (7 - t * 2)} ${w * (7 - t * 2)}a${r} ${r} 0 0 1 -${w2} 0l-${w * (7 - t * 2)} -${w * (7 - t * 2)}a${r} ${r} 0 0 1 0 -${w2}l${w * (7 - t * 2)} -${w * (7 - t * 2)}a${r} ${r} 0 0 1 ${w2} 0zm-${w} ${w}l-${w * 2.5} -${w * 2.5}l-${w5} ${w5}l${w5} ${w5}l${w5} -${w5}zm-${w} ${w}l${w * 1.5} ${w * 1.5}l-${w3} ${w3}l-${w3} -${w3}l${w3} -${w3}z`;
                d = `m${x + w * 3.5} ${p + w * 3.5}${drawOutWhole}`;
                d += `m${w * (s - 5)} ${w * (s - 9)}${drawOutWhole}`;
                d += `m-${w2 * (s - 8)} -${w2}${drawOutWhole}`;
                break;
            case 'out_in_rounded':
                const drawOutInWhole = `l${w * (3.5 - t)} ${w * (3.5 - t)}a${r} ${r} 0 0 1 0 ${w2}l-${w * (7 - t * 2)} ${w * (7 - t * 2)}a${r} ${r} 0 0 1 -${w2} 0l-${w * (7 - t * 2)} -${w * (7 - t * 2)}a${r} ${r} 0 0 1 0 -${w2}l${w * (7 - t * 2)} -${w * (7 - t * 2)}a${r} ${r} 0 0 1 ${w2} 0zm-${w} ${w}l-${w * 2.5} -${w * 2.5}l-${w5} ${w5}l${w5} ${w5}l${w5} -${w5}zm-${w} ${w}l${w * (1.5 - t)} ${w * (1.5 - t)}a${r} ${r} 0 0 1 0 ${w2}l-${w * (3 - t * 2)} ${w * (3 - t * 2)}a${r} ${r} 0 0 1 -${w2} 0l-${w * (3 - t * 2)} -${w * (3 - t * 2)}a${r} ${r} 0 0 1 0 -${w2}l${w * (3 - t * 2)} -${w * (3 - t * 2)}a${r} ${r} 0 0 1 ${w2} 0z`;
                d = `m${x + w * 3.5} ${p + w * 3.5}${drawOutInWhole}`;
                d += `m${w * (s - 5)} ${w * (s - 9)}${drawOutInWhole}`;
                d += `m-${w2 * (s - 8)} -${w2}${drawOutInWhole}`;
                break;
            default:
                break;
        }
    }
    else if (rotationAngle === -135){
        const r = w * t * 2;
        const x = svgWidth / 2;
        switch(patternType){
            case 'normal':
                const drawWhole = `l-${w7} -${w7}l${w7} -${w7}l${w7} ${w7}zm0 -${w2}l${w5} -${w5}l-${w5} -${w5}l-${w5} ${w5}zm0 -${w2}l-${w3} -${w3}l${w3} -${w3}l${w3} ${w3}z`;
                d = `m${x} ${p + w2 * s}${drawWhole}`;
                d += `m-${w * (s - 7)} -${w * (s - 11)}${drawWhole}`;
                d += `m${w2 * (s - 7)} ${w2 * 2}${drawWhole}`;
                break;
            case 'angle_rounded':
                const drawMiddle = `m0 ${w2}l-${w5} ${w5}l${w5} ${w5}l${w5} -${w5}z`;
                d = `m${x} ${p + w2 * (s - 7)}l${w7} ${w7}l-${w * (7 - t)} ${w * (7 - t)}a${r} ${r} 0 0 1 -${w2} 0l-${w * (7 - t)} -${w * (7 - t)}z${drawMiddle}m0 ${w2}l${w3} ${w3}l-${w * (3 - t)} ${w * (3 - t)}a${r} ${r} 0 0 1 -${w2} 0l-${w * (3 - t)} -${w * (3 - t)}z`;
                d += `m-${w * (s - 7)} -${w * (s - 3)}l${w7} ${w7}l-${w7} ${w7}l-${w * (7 - t)} -${w * (7 - t)}a${r} ${r} 0 0 1 0 -${w2}z${drawMiddle}m0 ${w2}l${w3} ${w3}l-${w3} ${w3}l-${w * (3 - t)} -${w * (3 - t)}a${r} ${r} 0 0 1 0 -${w2}z`;
                d += `m${w2 * (s - 7)} -${w2 * 2}l${w * (7 - t)} ${w * (7 - t)}a${r} ${r} 0 0 1 0 ${w2}l-${w * (7 - t)} ${w * (7 -t)}l-${w7} -${w7}z${drawMiddle}m0 ${w2}l${w * (3 - t)} ${w * (3 - t)}a${r} ${r} 0 0 1 0 ${w2}l-${w * (3 - t)} ${w * (3 - t)}l-${w3} -${w3}z`;
                break;
            case 'out_rounded':
                const drawOutWhole = `l-${w * (3.5 - t)} -${w * (3.5 - t)}a${r} ${r} 0 0 1 0 -${w2}l${w * (7 - t * 2)} -${w * (7 - t * 2)}a${r} ${r} 0 0 1 ${w2} 0l${w * (7 - t * 2)} ${w * (7 - t * 2)}a${r} ${r} 0 0 1 0 ${w2}l-${w * (7 - t * 2)} ${w * (7 - t * 2)}a${r} ${r} 0 0 1 -${w2} 0zm${w} -${w}l${w * 2.5} ${w * 2.5}l${w5} -${w5}l-${w5} -${w5}l-${w5} ${w5}zm${w} -${w}l-${w * 1.5} -${w * 1.5}l${w3} -${w3}l${w3} ${w3}l-${w3} ${w3}z`;
                d = `m${x - w * 3.5} ${p + w2 * s - w * 3.5}${drawOutWhole}`;
                d += `m-${w * (s - 5)} -${w * (s - 9)}${drawOutWhole}`;
                d += `m${w2 * (s - 8)} ${w2}${drawOutWhole}`;
                break;
            case 'out_in_rounded':
                const drawOutInWhole = `l-${w * (3.5 - t)} -${w * (3.5 - t)}a${r} ${r} 0 0 1 0 -${w2}l${w * (7 - t * 2)} -${w * (7 - t * 2)}a${r} ${r} 0 0 1 ${w2} 0l${w * (7 - t * 2)} ${w * (7 - t * 2)}a${r} ${r} 0 0 1 0 ${w2}l-${w * (7 - t * 2)} ${w * (7 - t * 2)}a${r} ${r} 0 0 1 -${w2} 0zm${w} -${w}l${w * 2.5} ${w * 2.5}l${w5} -${w5}l-${w5} -${w5}l-${w5} ${w5}zm${w} -${w}l-${w * (1.5 - t)} -${w * (1.5 - t)}a${r} ${r} 0 0 1 0 -${w2}l${w * (3 - t * 2)} -${w * (3 - t * 2)}a${r} ${r} 0 0 1 ${w2} 0l${w * (3 - t * 2)} ${w * (3 - t * 2)}a${r} ${r} 0 0 1 0 ${w2}l-${w * (3 - t * 2)} ${w * (3 - t * 2)}a${r} ${r} 0 0 1 -${w2} 0z`;
                d = `m${x - w * 3.5} ${p + w2 * s - w * 3.5}${drawOutInWhole}`;
                d += `m-${w * (s - 5)} -${w * (s - 9)}${drawOutInWhole}`;
                d += `m${w2 * (s - 8)} ${w2}${drawOutInWhole}`;
                break;
            default:
                break;
        }
    }
    const g = document.createElementNS(xmls, 'g');
    g.setAttribute('id', 'group_finder_pattern');
    const path = document.createElementNS(xmls, 'path');
    path.setAttribute('d', d);
    path.setAttribute('fill', color);
    g.appendChild(path);
    docFrag.appendChild(g);
}

/**
 * 設定編碼分頁的資訊區塊
 * @param {number} contentLength 文字長度
 * @param {number} encodingMode 資料類型 [1=Numeric, 2=Alphanumeric, 4=Byte, 5=Byte(UTF-8)]
 * @param {number} errorCorrectLevel 錯誤修正等級 [0=M, 1=L, 2=H, 3=Q]
 * @param {number} version 版本
 * @param {number} dataCodewords 資料格數
 * @param {number} errorCorrectCodewords 錯誤修正資料格數
 * @param {number} maskIndex 索引編號
 * @param {number} penaltyScore 罰分
 */
function SetInfo(contentLength, encodingMode, errorCorrectLevel, version, dataCodewords, errorCorrectCodewords, maskIndex, penaltyScore){
    document.getElementById('spnCharacterLength').textContent = contentLength;
    let text = '';
    switch(encodingMode){
        case 0: text = '0'; break;
        case 1: text = 'Numeric'; break;
        case 2: text = 'Alphanumeric'; break;
        case 3: text = '3'; break;
        case 4: text = 'Byte'; break;
        case 5: text = 'Byte(UTF-8)'; break;
        case 6: text = '6'; break;
        case 7: text = 'ECI'; break;
        case 8: text = 'Kanji'; break;
        default: text = ''; break;
    }
    document.getElementById('spnEncodingMode').textContent = text;
    switch(errorCorrectLevel){
        case 0: text = 'M'; break;
        case 1: text = 'L'; break;
        case 2: text = 'H'; break;
        case 3: text = 'Q'; break;
        default: text = ''; break;
    }
    document.getElementById('spnErrorCorrectLevel').textContent = text;
    document.getElementById('spnVersion').textContent = version;
    document.getElementById('spnDataCodewords').textContent = dataCodewords;
    document.getElementById('spnErrorCorrectCodewords').textContent = errorCorrectCodewords;
    document.getElementById('spnMaskIndex').textContent = maskIndex;
    document.getElementById('spnPenaltyScore').textContent = penaltyScore;
}

/**
 * 勾選背景透明的變更事件
 */
function ChkBackgroundChange(){
    if (chkBackground.checked){
        iptBgColorHex.removeAttribute('disabled');
        iptBgColor.removeAttribute('disabled');
        chkBgRadius.removeAttribute('disabled');
        if(parseInt(selRotation.value) !== 0){
            chkBgRotate.removeAttribute('disabled');
        }
    }
    else{
        iptBgColorHex.setAttribute('disabled', true);
        iptBgColor.setAttribute('disabled', true);
        chkBgRadius.setAttribute('disabled', true);
        chkBgRotate.setAttribute('disabled', true);
        
    }
    RenderSvg();
}

/**
 * 初始化繪製需要的 DOM 物件
 */
function InitSvgShareDom(){
    const c = 40;
    const w = svgWidth / c;
    for (let y = 0; y < c; y++){
        for (let x = y % 2; x < c; x += 2){
            transparentPath += `M${w * x} ${w * y}h${w}v${w}h-${w}z`;
        }
    }
    grayRectangle.setAttribute('x', '0');
    grayRectangle.setAttribute('y', '0');
    grayRectangle.setAttribute('width', svgWidth);
    grayRectangle.setAttribute('height', svgWidth);
    grayRectangle.setAttribute('fill', '#BFBFBF');
    grayRectangle.setAttribute('id', 'grayRect');

    whitePath.setAttribute('fill', '#FFFFFF');
    whitePath.setAttribute('stroke', '#FFFFFF');
    whitePath.setAttribute('d', transparentPath);
    whitePath.setAttribute('id', 'whitePath');

    logoBackground0.setAttribute('cx', svgWidth / 2);
    logoBackground0.setAttribute('cy', svgWidth / 2);
    logoBackground0.setAttribute('r', logoBgRadius0);

    logoBackground45.setAttribute('cx', svgWidth / 2);
    logoBackground45.setAttribute('cy', svgWidth / 2);
    logoBackground45.setAttribute('r', logoBgRadius45);
}

/**
 * 產生表示透明背景的灰白圖層
 */
function CreateTransparent(){
    const docFrag = document.createDocumentFragment();
    const g = document.createElementNS(xmls, 'g');
    g.setAttribute('id', 'group_transparent');
    g.appendChild(grayRectangle);
    g.appendChild(whitePath);
    docFrag.appendChild(g);
    // 附加在 svgShow 下第一個
    if (svgShow.children.length === 0){
        svgShow.appendChild(docFrag);
    }
    else{
        svgShow.insertBefore(docFrag, svgShow.children[0]);
    }
}

/**
 * 將自訂上傳或點選的圖示附件到 SVG 裡
 * @param {string} id 圖示的 ID，若是上傳自訂圖示則為 svgLogo
 * @param {boolean} isRotate 前景是否旋轉，若旋轉 45 度或 -135 度則為 true，無旋轉則為 false
 * @param {string} bgColor 背景顏色十六進位編碼
 */
function AppendLogo(id, isRotate, bgColor){
    // 複製一份出來，避免把原來的刪了
    const svg = document.getElementById(id).cloneNode(true);
    const g = document.createElementNS(xmls, 'g');
    g.setAttribute('id', 'group_logo');
    let position, base64, size;
    // 有旋轉的時候背景圓形和圓示會比較小，位置也有調整
    if (isRotate){
        if (bgColor){
            logoBackground45.setAttribute('fill', bgColor);
        }
        g.appendChild(logoBackground45);
        position = logoStartPosition45;
        size = 2000 / Math.sqrt(2);
    }
    else{
        if (bgColor){
            logoBackground0.setAttribute('fill', bgColor);
        }
        g.appendChild(logoBackground0);
        position = logoStartPosition0;
        size = 2000;
    }

    svg.setAttribute('xmlns', xmls);
    const image = document.createElementNS(xmls, 'image');
    // 自訂上傳的圖示，取裡面的 DOM 轉成 base64 字串，若是點選提供的，取整個 DOM 轉 base64 字串
    if (id === 'svgLogo'){
        base64 = 'data:image/svg+xml;base64,' + GetBase64(svg.innerHTML);
    }
    else{
        base64 = 'data:image/svg+xml;base64,' + GetBase64(svg.outerHTML);
    }
    image.setAttribute('x', position);
    image.setAttribute('y', position);
    image.setAttribute('width', size);
    image.setAttribute('height', size);
    image.setAttribute('href', base64);
    g.appendChild(image);
    svgShow.appendChild(g);
}

/**
 * 點選提供的圖示後的事件
 * @param {Event} e 點擊事件
 */
function SvgLogoClick(e){
    let domClick = e.target;
    // 可能點到 path 而不是 svg，往 parent 找
    while(domClick && domClick.tagName !== 'svg'){
        domClick = domClick.parentNode;
    }
    const domBefore = document.getElementById('divLogoList').querySelector('svg.selected');
    if (domBefore){
        // 有上次點選的 logo
        if (domBefore.getAttribute('id') === domClick.getAttribute('id')){
            // 重覆點選自己，移除 class
            domClick.classList.remove('selected');
            if (chkMini.checked){
                selErrorCorrectLevel.value = '0';
            }
            ClearIptLogo(false);
         }
        else{
            // 點擊的和上次不同，更新雙方 class
            domBefore.classList.remove('selected');
            domClick.classList.add('selected');
            if (chkMini.checked){
                selErrorCorrectLevel.value = '2';
            }
            ClearIptLogo(true);
        }
    }
    else{
        // 沒有上次點選的 logo，即第一次點選
        domClick.classList.add('selected');
        if (chkMini.checked){
            selErrorCorrectLevel.value = '2';
        }
        ClearIptLogo(true);
    }
    
    GenerateQRcode();
}

/**
 * 前景是否旋轉的下拉選單變更事件
 */
function SelRotationChange(){
    const selValue = parseInt(selRotation.value);
    if (selValue === 0){
        if (chkBackground.checked){
            chkBgRotate.setAttribute('disabled', true);
        }
        chkBgRotate.checked = false;
    }
    else{
        //chkBgRotate.checked = false;
        if (chkBackground.checked){
            chkBgRotate.removeAttribute('disabled');
        }
    }
    RenderSvg();
}

/**
 * 上傳自訂圖示的勾選按鈕點選後的變更事件
 */
function ChkLogoChange(){
    if (chkLogo.checked){
        // 先取消點勾選，避免上傳視窗打開結果直接取消，沒觸發 change 事件
        chkLogo.checked = false;
        iptLogo.click();
    }
    else{
        ClearIptLogo(false);
        GenerateQRcode();
    }
}

/**
 * 上傳檔案的變更事件（包括從無到有，從有到無）
 */
function IptLogoChange(){
    if (iptLogo.files.length === 0 || iptLogo.files[0].type !== 'image/svg+xml'){
        ClearIptLogo(false);
        GenerateQRcode();
        return;
    }
    const reader = new FileReader();
    reader.addEventListener('load', function (reader){
        IptLogoReaderLoad(reader);
    });
    reader.readAsText(iptLogo.files[0]);

}

/**
 * 上傳完自訂圖示後的動作
 * @param {FileReader} reader 
 */
function IptLogoReaderLoad(reader){
    while(svgLogo.children.length > 0){
        svgLogo.children[0].remove();
    }
    // 上傳檔案的文字內容（因為前面是用 readAsText 方法）
    svgLogo.innerHTML = reader.srcElement.result;
    const uploadDom = svgLogo.querySelector('svg');
    const w = uploadDom.getAttribute('width'), h = uploadDom.getAttribute('height');
    // 有的上傳 SVG 並沒有 width height 屬性，這時直接搬 viewBox 出來用
    if (w != null && h != null){
        svgLogo.setAttribute('viewBox', `0 0 ${w} ${h}`);
    }
    else{
        const logoViewBox = uploadDom.getAttribute('viewBox');
        svgLogo.setAttribute('viewBox', logoViewBox);
    }
    // 有上傳自訂圖示，強制使用 H 的錯誤修正等級
    selErrorCorrectLevel.value = '2';
    // 若有點選提供的圖示，在上傳自訂圖示後將取消已選取的圖示
    const selectedLogo = document.getElementById('divLogoList').querySelector('svg.selected');
    if (selectedLogo){
        selectedLogo.classList.remove('selected');
    }
    chkLogo.checked = true;
    iptLogo.classList.remove('hidden');
    GenerateQRcode();
}

/**
 * 取得 base64 編碼字串給 href 使用
 * @param {string} text 要被編碼的文字
 */
function GetBase64(text){
    let result = '';
    let start = 0, end = 0;
    for(let i = 0, n = text.length; i < n; i++){
        const code = text.charCodeAt(i);
        // 遇到中日文會轉 &#.....; 的 entity code，讓只能轉 Latin1 的 btoa 不會失敗
        if (code > 0x00A0){
            end = i;
            result += text.substring(start, end) + '&#' + code + ';';
            start = i + 1;
        }
    }
    result += text.substring(start);
    return window.btoa(result);
}

/**
 * 取消上傳自訂圖示後各 DOM 的處理
 * @param {boolean} useLogo 是否使用 Logo
 */
function ClearIptLogo(useLogo){
    while(svgLogo.children.length > 0){
        svgLogo.children[0].remove();
    }
    chkLogo.checked = false;
    iptLogo.classList.add('hidden');
    iptLogo.value = '';
    if (chkMini.checked){
        selErrorCorrectLevel.value = useLogo ? '2' : '0';
    }
}

/**
 * 整理十六進位 RGB 字串
 * @param {string} text 色碼文字
 * @returns 符合的六碼大寫色碼，不符合時為空字串
 */
function FormatHexColor(text){
    text = text.toUpperCase();
    if (/^[0123456789ABCDEF]{6}$/.test(text)){
        return text;
    }
    else if (/^[0123456789ABCDEF]{3}$/.test(text)){
        return text.charAt(0) + text.charAt(0) + text.charAt(1)+ text.charAt(1)+ text.charAt(2)+ text.charAt(2);
    }
    return '';
}


function RenderLogo(){
    const docFrag = document.createDocumentFragment();
    for (let i = 0, n = logo.length; i < n; i++){
        const item = logo[i];
        const svg = document.createElementNS(xmls, 'svg');
        //<svg viewBox="0 0 2000 2000" width="50" height="50" id="svgLine">
        svg.setAttribute('viewBox', `0 0 ${logoWidth} ${logoWidth}`);
        svg.setAttribute('width', 50);
        svg.setAttribute('height', 50);
        svg.setAttribute('id', 'svg' + item['id']);
        for(let j = 0; j < item['path'].length; j ++){
            const path = document.createElementNS(xmls, 'path');
            path.setAttribute('fill', '#' + item['path'][j]['fill']);
            path.setAttribute('d', item['path'][j]['d']);
            svg.appendChild(path);
        }
        svg.addEventListener('click', SvgLogoClick);
        docFrag.appendChild(svg);
    }
    document.getElementById('divLogoList').appendChild(docFrag);
}