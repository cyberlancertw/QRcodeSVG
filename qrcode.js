// Encoding Mode Numeric 全數字的正則表示式
const regex_numbr = /^\d*$/;
// Encoding Mode Alphanumeric 由大寫字母、數字、空格與少數符號的正則表示式
const regex_alpha = /^[\dA-Z $%*+\-./:]*$/;
// Encoding Mode Byte 以 ISO 8859-1 編碼的常見符號，ASCII code 在 0~255 間
const regex_bytes = /^[\x00-\xff]*$/;
// Encoding Mode Kanji 日文片假名平假名與漢字
const regex_kanji = /^[\p{Script_Extensions=Han}\p{Script_Extensions=Hiragana}\p{Script_Extensions=Katakana}]*$/u;

// Capacity 容量 Table，index 為 Encoding Mode 資料類型
const capacity = [
    null,
    [
        // 0b0001 1 Numeric //L1/M0/Q3/H2
        [34, 63, 101, 149, 202],
        [41, 77, 127, 187, 255],
        [17, 34, 58, 82, 106],
        [27, 48, 77, 111, 144]
    ],
    [
        // 0b0010 2 Alphanumeric //L1/M0/Q3/H2
        [],
        [],
        [],
        []
    ],
    null,
    [
        // 0b0100 4 Byte //L1/M0/Q3/H2
        [14, 26, 42, 62, 84, 106, 122, 152, 180, 213, 251, 287, 331, 362, 412, 450, 504, 560, 624, 666, 711, 779, 857, 911, 997, 1059, 1125, 1190, 1264, 1370, 1452, 1538, 1628, 1722, 1809, 1911, 1989, 2099, 2213, 2331],
        [17, 32, 53, 78, 106, 134, 154, 192, 230, 271, 321, 367, 425, 458, 520, 586, 644, 718, 792, 858, 929, 1003, 1091, 1171, 1273, 1367, 1465, 1528, 1628, 1732, 1840, 1952, 2068, 2188, 2303, 2431, 2563, 2699, 2809, 2953],
        [7, 14, 24, 34, 44, 58, 64, 84, 98, 119, 137, 155, 177, 194, 220, 250, 280, 310, 338, 382, 403, 439, 461, 511, 535, 593, 625, 658, 698, 742, 790, 842, 898, 958, 983, 1051, 1093, 1139, 1219, 1273],
        [11, 20, 32, 46, 60, 74, 86, 108, 130, 151, 177, 203, 241, 258, 292, 322, 364, 394, 442, 482, 509, 565, 611, 661, 715, 751, 805, 868, 908, 982, 1030, 1112, 1168, 1228, 1283, 1351, 1423, 1499, 1579, 1663],
    ],
    null,
    null,
    [
        // 0b0111 7 ECI //L1/M0/Q3/H2
        [],
        [],
        [],
        []
    ],
    [
        // 0b1000 8 Kanji //L1/M0/Q3/H2
        [8, 16, 26],
        [10, 20, 32],
        [4, 8, 15],
        [7, 12, 20]
    ]
]


/**
 * 對應 Level 與 Error Correct 的 CodeWord，0 是 data codeword，1 是 error correct codeword。
 * 例如 Level = 5 且 Error Correct = 2 (H)，則 codewordsNumber[2][0][4] 和 codewordsNumber[2][1][4]
 */
const codewordsNumber = [
    [//M
        [16, 28, 44, 64, 86, 108, 124, 154, 182, 216, 254, 290, 334, 365, 415, 453, 507, 563, 627, 669, 714, 782, 860, 914, 1000, 1062, 1128, 1193, 1267, 1373, 1455, 1541, 1631, 1725, 1812, 1914, 1992, 2102, 2216, 2334],
        [10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28]
    ],
    [//L
        [19, 34, 55, 80, 108],
        [7, 10, 15, 20, 26]
    ],
    [//H
        [9, 16, 26, 36, 46],
        [17, 28, 22, 16, 22]
    ],
    [//Q
        [13, 22, 34, 48, 62],
        [13, 22, 18, 26, 18]
    ]
];

// 文字長度對應 bit 數 Table，一維 index 是 Encoding Mode 資料類型，二維 index 是 version 版本所在區間，分別是 1~9、10~26、27~40，例如 Alphanumeric 且 level 20 為 databit[2][1]
const contentLengthBits = [
    null,
    [10, 12, 14],
    [9, 11, 13],
    null,
    [8, 16, 16],
    null,
    null,
    [8, 16, 16],
    [8, 10, 12]
];


const LOG = new Uint8Array(256);
const EXP = new Uint8Array(256);

InitLogExp();


/**
 * Format Module 計算時要用的除式，表示 x^10 + x^8 + x^5 + x^4 + x^2 + x + 1
 */
const formatDivisor = new Uint8Array([1, 0, 1, 0, 0, 1, 1, 0, 1, 1, 1]);

/**
 * Version Infomation 計算時要用的除式，表示 x^12 + x^11 + x^10 + x^9 + x^8 + x^5 + x^2 + 1
 */
const versionDivisor = new Uint8Array([1, 1, 1, 1, 1, 0, 0, 1, 0, 0, 1, 0, 1]);

const versionPolynomial = new Array();

InitVersionPolynomial(40);

/**
 * Format Module 計算時使用的遮罩
 */
const formatMask = new Uint8Array([1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0]);

/**
 * Penalty Score 計算的 Rule 3 要檢查是否與 Finder Pattern 相似
 */
const similarityFinderPattern1 = new Uint8Array([1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0]);
const similarityFinderPattern2 = new Uint8Array([0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1]);

//const GeneratorPolynomialOld = new Array();
// 手動新增 degree = 1 的 generator polynomial
//GeneratorPolynomialOld.push(new Uint8Array([1, 1]));
// 從 degree = 2 開始生成，目標產生到 degree = 30（目前 level 40 最多 Error codewords number 為 30）
//FetchGeneratorPolynomialOld(1, 30);


const generatorPolynomial = new Array();
generatorPolynomial.push(new Uint8Array([1, 1]));
InitGeneratorPolynomial(30);

/**
 * 遮罩
 */
const maskList = [ 0, 0b1, 0b11, 0b111, 0b1111, 0b11111, 0b111111, 0b1111111, 0b11111111];

/**
 * Alphanumeric 取 data 要用表格
 */
const mapAlphanumeric = {
    '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, 'A': 10, 'B': 11, 'C': 12, 'D': 13, 'E': 14, 'F': 15, 'G': 16, 'H': 17,
    'I': 18, 'J': 19, 'K': 20, 'L': 21, 'M': 22, 'N': 23, 'O': 24, 'P': 25, 'Q': 26, 'R': 27, 'S': 28, 'T': 29, 'U': 30, 'V': 31, 'W': 32, 'X': 33, 'Y': 34, 'Z': 35,
    ' ': 36, '$': 37, '%': 38, '*': 39, '+': 40, '-': 41, '.': 42, '/': 43, ':': 44
};

/*
const jisCode = {
    '　': 0x8140, '、': 0x8141, '。': 0x8142, '，': 0x8143, '．': 0x8144, '：': 0x8145, '；': 0x8146, '？': 0x8147, '！': 0x8148, '゛': 0x8149, '゜': 0x814a, '´': 0x814b, '｀': 0x814c, '¨': 0x814d,
    '＾': 0x814f, '￣': 0x8150,

    '中': 0x9286,
    '茗': 0xe4aa


};
*/

/**
 * 不同版本的邊長格子數
 */
const sizeList = [0];
InitSizeList(40);

/**
 * 不同版本的 Alignment Pattern 的中心座標
 */
const alignmentCoordinates = [[], []];
InitAlignmentCoordinates(40);

/**
 * 不同版本的定位標記以外的所有格子數
 */
const availableModules = [0];
InitAvailableModules(40);

/**
 * 錯誤修正的資訊
 */
const errorCorrectBlock = [
    //0:M
    [[], [10, 1], [16, 1], [26, 1], [18, 2], [24, 2], [16, 4], [18, 4], [22, 4], [22, 5], [26, 5], [30, 5], [22, 8], [22, 9], [24, 9], [24, 10], [28, 10], [28, 11], [26, 13], [26, 14], [26, 16], [26, 17],
     [28, 17], [28, 18], [28, 20], [28, 21], [28, 23], [28, 25], [28, 26], [28, 28], [28, 29], [28, 31], [28, 33], [28,35], [28, 37], [28, 38], [28, 40], [28, 43], [28, 45], [28, 47], [28, 49]],
    //1:L
    [[], [7, 1], [10, 1], [15, 1], [20, 1], [26, 1], [18, 2], [20, 2], [24, 2], [30, 2], [18, 4], [20, 4], [24, 4], [26, 4], [30, 4], [22, 6], [24, 6], [28, 6], [30, 6], [28, 7], [28, 8], [28, 8], [28, 9],
     [30, 9], [30, 10], [26, 12], [28, 12], [30, 12], [30, 13], [30, 14], [30, 15], [30, 16], [30, 17], [30, 18], [30, 19], [30, 19], [30, 20], [30, 21], [30, 22], [30, 24], [30, 25] ],
    //2:H
    [[], [17, 1], [28, 1], [22, 2], [16, 4], [22, 4], [28,4], [26, 5], [26, 6], [24, 8], [28, 8], [24, 11], [28, 11] , [22, 16], [24, 16], [24, 18], [30, 16], [28, 19], [28, 21], [26, 25], [28, 25], [30, 25], [24, 34],
     [30, 30], [30, 32], [30, 35], [30, 37], [30, 40], [30, 42], [30, 45], [30, 48], [30, 51], [30, 54], [30, 57], [30, 60], [30, 63], [30, 66], [30, 70], [30, 74], [30, 77], [30, 81]], 
    //3:Q
    [[], [13, 1], [22, 1], [18, 2], [26, 2], [18, 4], [24, 4], [18, 6], [22, 6], [20, 8], [24, 8], [28, 8], [26, 10], [24, 12], [20, 16], [30, 12], [24, 17], [28, 16], [28, 18], [26, 21], [30, 20], [28, 23],
     [30, 23], [30, 25], [30, 27], [30, 29], [28, 34], [30, 34], [30, 35], [30, 38], [30, 40], [30, 43], [30, 45], [30, 48], [30, 51], [30, 53], [30, 56], [30, 59], [30, 62], [30, 65], [30, 68]]
];


/**
 * 預先產生 Version Polynomial 資料
 * @param {number} n 目標版本數
 */
function InitVersionPolynomial(n){
    for (let version = 0; version <= n; version++){
        // 只有版本 7 開始會有 Version Infomation Module 要放，所以 0~7 留空白
        if (version < 7){
            versionPolynomial.push(new Uint8Array(0));
            continue;
        }
        // 每個 Version Polynomial 共有 18 位（填在盤面上也是右上與左下各 18 格 module）
        const poly = new Uint8Array(18);
        let remain = version;
        let offset = 5;
        // 前 6 位是版本數的二進位表示，例如 version = 19，為 0b010011，即 x^4 + x + 1，再乘上 x^12 得 x^16 + x^13 + x^12，即後面 12 位補 0
        while(remain > 0){
            poly[offset] = remain & 1;
            remain >>= 1;
            offset--;
        }
        // 將多項式除以 x^12 + x^11 + x^10 + x^9 + x^8 + x^5 + x^2 + 1 取得餘式，將餘式放入 poly 的後 12 位，則多項式係數陣列為此版本的 Version Information
        const remainder = PolynomialRemainder(poly, versionDivisor);
        for(let i = 0; i < 12; i++){
            poly[i + 6] = remainder[i];
        }
        versionPolynomial.push(poly);
    }
}

/**
 * 取得 Version Polynomial 係數陣列
 * @param {number} version 版本
 * @returns {Uint8Array} 係數陣列
 */
function GetVersionPolynomial(version){
    return versionPolynomial[version];
}
/**
 * 取得 Encoding Mode 資料類型
 * @param {string} text 要比對檢查的文字內容
 * @returns {number} Encoding Mode 資料類型 1:Numeric、2:Alphanumeric、4:Byte、5:ByteUnicode
 */
function GetEncodingMode(text){
    // 是全數字組成
    if (regex_numbr.test(text)){
        return 0b0001;
    }
    // 是大寫字母、數字、空格、少數符號組成
    if (regex_alpha.test(text)){
        return 0b0010;
    }
    // 是常見字母數字符號
    if (regex_bytes.test(text)){
        return 0b0100;
    }
    // 是日文片假平假漢字
    if (regex_kanji.test(text)){
        //return 0b1000;
        return 0b0101;
    }
    // ECI
    //return 0b0111;
    return 0b0101;
}

/**
 * 取得 Capacity 容量，和 Version 版本
 * @param {number} encodingMode Encoding Mode 資料類型
 * @param {number} errorCorrectLevel Error Correct Level 錯誤修正等級 [0=M, 1=L, 2=H, 3=Q]
 * @param {object} content 文字內容
 * @returns {object} 'capacity' 為容量，'version' 為版本
 */
function GetCapacityAndVersion(encodingMode, errorCorrectLevel, content){
    const array = capacity[encodingMode][errorCorrectLevel];
    const byteLength = content.length;
    const result = {};
    let k = 39;
    for (let i = 0; i < 40; i++){
        if(byteLength > array[i]){
            continue;
        }
        else{
            k = i;
            break;
        }
    }
    result['capacity'] = array[k];
    result['version'] = k + 1;
    return result;
}

/**
 * 依資料類型 Encoding Mode、文字長度、錯誤修正等級 Error Correct Level 決定最小的版本
 * @param {number} encodingMode 資料類型  [1=Numeric, 2=Alphanumeric, 4=Byte]
 * @param {number} contentLength 文字長度，若是 Unicode 文字則為 Byte 個數
 * @param {number} errorCorrectLevel 錯誤修正等級 [0=M, 1=L, 2=H, 3=Q]
 * @returns 
 */
function GetVersion(encodingMode, contentLength, errorCorrectLevel){
    for (let version = 1; version <= 40; version++) {
        const capacity = GetCapacity(version, errorCorrectLevel, encodingMode);
        if (capacity >= contentLength) {
            return version;
        }
    }
    throw new Error('error_content_too_long');
}

function GetUnicodeByteData(content){
    // 最後要回傳結果
    const byteData = [];
    for (const ch of content){
        let utf32 = ch.codePointAt(0);
        if (utf32 < 0x80){
            // 當此字元是一般文字例如 abc123=-# ，值直接放入陣列中
            byteData.push(utf32);
        }
        else{
            // 如果此字元是中日文等文字，判斷 byte 長度，例如 "台" 的值是 21488，十六進位是 53F0，位數則是 3 位
            const byteCount = utf32 < 0x800 ? 2 : utf32 < 0x10000 ? 3 : utf32 < 0x110000 ? 4 : 0;
            const utf8 = [];
            for (let i = 0; i < byteCount; i++, utf32 >>>= 6){
                utf8.unshift(0x80 | (utf32 & 0x3f));
            }
            utf8[0] |= (0xf00 >>> byteCount) & 0xff;

            for (let i = 0; i < byteCount; i++){
                byteData.push(utf8[i]);
            }
        }
    }
    return byteData;
}

/**
 * 依不同版本取得 Length Bit 資料長度的 bit 值
 * @param {number} encodingMode Encoding Mode 資料類型 [1=Numeric, 2=Alphanumeric, 4=Byte, 5=UnicodeByte]
 * @param {number} version Version 版本 1 到 40
 * @returns {number} Data Bit 長度
 */
function GetContentLengthBits(encodingMode, version){
    // 版本 1 到 9 
    if (version <= 9){
        return contentLengthBits[encodingMode][0];
    }
    // 版本 10 到 26
    if (version <= 26){
        return contentLengthBits[encodingMode][1];
    }
    // 版本 27 到40
    return contentLengthBits[encodingMode][2];
}

/*
function GetDataCodewordsNumber(errorCorrectLevel, version){
    return codewordsNumber[errorCorrectLevel][0][version - 1];
}


function GetErrorCodewordsNumber(errorCorrectLevel, version){
    return codewordsNumber[errorCorrectLevel][1][version - 1];
}

*/


/**
 * 初始化 GF(256) 乘法除法要使用的指對數資料
 */
function InitLogExp(){
    // 255 % 255 = 0
    LOG[1] = 0;
    EXP[0] = 1;
    for (let e = 1, v = 1; e < 255; e++){
        // 指對數皆以 2 為底，若前一數 value 已大於 127 則 2 倍後會達 256，要和 Reed Solomon
        // 的 Primitive Polynomial PP(x) = x^8 + x^4 + x^3 + x^2 + 1，也就是 PP(2) = 285 做 XOR
        // 反覆作就可以生成 order 256 的 Galois Field 的數字
        v = v > 127 ? ((v << 1) ^ 0b100011101) : (v << 1);
        LOG[v] = e;
        EXP[e] = v;
    }
    //console.dir(LOG);
    //console.dir(EXP);
}

/**
 * GF(256) 使用的乘法
 * @param {number} a 
 * @param {number} b 
 * @returns 
 */
function Product(a, b){
    // 在十進位時以 64 * 32 為例，可改用 64 * 32 = 2^6 * 2^5 = 2^(6+5) = 2^11 = 2048 這樣的思維，也就是：
    // 64 * 32 = 2^(log64) * 2^(log32) = 2^(log64 + log32) = exp(log(64) + log(32)) 化為 2 為底的指對數這樣去做，
    // 但在 GF(256) 中，還要考慮收進有限體，且使用已生成的 LOG 和 EXP 來查表計算，
    // 例如 64 * 32 = EXP[LOG[64]] * EXP[LOG[32]] = EXP[6] * EXP[5] = EXP[6 + 5] = EXP[11] = 232

    // 若 a 或 b 有一個為 undefined 則回傳 0，在多項式乘法中就可不考慮邊界
    return (a && b) ? EXP[(LOG[a] + LOG[b]) % 255] : 0;
    
    
    //TODO: 這裡不判斷，在 PolynomialMulti 裡考慮邊界。觀察效能
}

/**
 * GF(256) 使用的除法
 * @param {number} a 
 * @param {number} b 
 * @returns 
 */
function Divide(a, b){
    // 在十進位時以 64 / 32 為例，可改用 2^6 / 2^5 = 2^(6-5) 這樣的思維，也就是 64 / 32 = 2^(log64 - log32) = exp(log(64) - log(32))
    // 但減法可能在查表出現負數而超過範圍，GF(256) 中利用迦羅瓦體是循環的，a^256 = a，得 a^255 = 1 與 a^254 = a^(-1)
    // 故 a^n / a^m = a^(n - m) = a^(n + m * 254) = a^[(n + m * 254) % 255]
    return EXP[(LOG[a] + LOG[b] * 254) % 255];
}


/**
 * GF(256) 多項式乘法
 * @param {Uint8Array} poly1 多項式係數，若 x^2 + 3x + 2 的多項式，則係數陣列為 [1, 3, 2]
 * @param {Uint8Array} poly2 多項式係數，若 6x^4 + 7x^2 + 5 的多項式，則係數陣列為 [6, 0, 7, 0, 5]
 * @returns {Uint8Array}
 */
function PolynomialMulti(poly1, poly2){
    // eg: 二次多項式含常數項有三個項，poly1.length = 3 ，四次多項式含常數項有五個項，poly2.length = 5
    // 乘開則為六次多項式，包含常數項就有七個項，故 3 + 5 - 1
    let m = poly1.length, n = poly2.length;
    let k = m + n - 1;
    const coefficients = new Uint8Array(k);

    for (let i = 0; i < k; i++){
        let c = 0;
        for (let r = 0; r <= i; r++){
            // 在實數系統上的多項式乘法，要做的是累加相乘的結果給係數，eg: (x^2 + 3x + 2)(6x^4 + 7x^2 + 5)，
            // 乘開後是 6x^6 + 18x^5 + 19x^4 + 21x^3 + 19x^2 + 15x + 10  
            // 係數陣列為 [6, 18, 19, 21, 19, 15, 10]，以 i = 4 的 x^2 為例，乘積結果的二次項來自：
            // x^2 * 5 + 3x * 0x + 2 * 7x^2 + 不存在項 0/x * 0x^3 + 不存在項 0/x^2 * 6x^4
            // 故係數為 1 * 5 + 3 * 0 + 2 * 7 + undefined * 0 + undefined * 6 = 19
            // 而 GF(256) 中累加使用 XOR，所以下面使用 ^，而且係數乘積使用 LOG 與 EXP 查表。
            // 雖然有可能超過邊界，像上面的不存在項，但 Product 方法中有處理 undefined 則得 0，故可直接做。
            c = c ^ Product(poly1[r], poly2[i - r]);

            //TODO: 在這裡檢查邊界，而 Product 不檢查，觀察效能
        }
        coefficients[i] = c;
    }
    return coefficients;
}


/**
 * GF(256) 多項式除法得餘式
 * @param {Uint8Array} poly1 被除式多項式係數，若 6x^4 + 7x^2 + 5 的多項式，則係數陣列為 [6, 0, 7, 0, 5]
 * @param {Uint8Array} poly2 除式多項式係數，若 2x^2 + 3x + 2 的多項式，則係數陣列為 [2, 3, 2]
 */
function PolynomialRemainder(poly1, poly2){
    const quotientLength = poly1.length - poly2.length + 1;

    // 從餘式即被除式開始做
    let remainder = new Uint8Array(poly1);
    for (let count = 0; count < quotientLength; count++) {
        // 當首項係數非 0，開始除
        if (remainder[0]) {
            // 取得被除式首項係數除以除式首項係數的商數
            const factor = Divide(remainder[0], poly2[0]);
            const subPolynomial = new Uint8Array(remainder.length);
            // 除式與前面計算的商相乘後的多項式
            subPolynomial.set(PolynomialMulti(poly2, [factor]), 0);
            // 減去乘積結果，再退一項
            remainder = remainder.map((value, index) => value ^ subPolynomial[index]).slice(1);
        }
        // 當首項係數為 0，直接退一項
        else {

            remainder = remainder.slice(1);
        }
    }
    //TODO: 以上直接對 index 推移，不要建新陣列，比較效能
    
    return remainder;
}

/**
 * 取得 Generator Polynomial
 * @param {number} degree 
 * @returns 
 */
function GetGeneratorPolynomial(degree) {
    // degree = 1 得 [1, 1] 表多項式 (x + 1)
    // degree = 2 得 [1, 3, 2] 表多項式 (x + 1)(x + 2) = x^2 + 3x + 2
    // degree = 3 得 [1, 7, 14, 8] 表多項式 (x + 1)(x + 2)(x + 4) = x^3 + 7x^2 + 14x + 8
    // 1, 2, 4, 8, 16, 32, 64, 128, 29, 58, ... 為 EXP，
    // 則 degree = 10 表 (x + 1)(x + 2)....(x + 128)(x + 29)(x + 58) 乘開後多項式的係數陣列
    let lastPoly = new Uint8Array([1]);
    for (let index = 0; index < degree; index++) {
        lastPoly = PolynomialMulti(lastPoly, new Uint8Array([1, EXP[index]]));
    }

    return lastPoly;

    /*
    // TODO: 靠已預產生好的 GeneratorPolynomial 直接取，比較效能
    degree--;
    if (GeneratorPolynomial[degree]){
        return GeneratorPolynomial[degree];
    }
    else{
        FetchGeneratorPolynomial(degree, degree + 1);
        return GeneratorPolynomial[degree];
    }
    */
}

/**
 * 預先產生 Generator Polynomial 的資料
 * @param {number} degreeProcess 要處理的 degree
 * @param {number} degreeFetch 目標要產生的 degree
 * @returns 
 */
function FetchGeneratorPolynomialOld(degreeProcess, degreeFetch){
    /* link 的作法還是輸 for loop 了，作太有彈性但沒必要，故廢棄
    
    // 要處理的 degree 已達要取得的目標則結束
    if (degreeProcess >= degreeFetch){
        return;
    }

    // degree 還未達目標但已存在結果，跳過，做下一個
    if (GeneratorPolynomial[degreeProcess]){
        FetchGeneratorPolynomialOld(degreeProcess + 1, degreeFetch);
        return;
    }

    // 已有內容的 degree，從要處理 degree 的前一個開始找
    let degreeDone = degreeProcess - 1;
    // 若還沒有內容就繼續往前找，直到有內容
    while (!GeneratorPolynomial[degreeDone] && degreeDone > -1){
        degreeDone--;
    }

    // 若有內容的 degree 不是剛好要處理的 degree 前一個，直接跳往最早有內容的 degree 來做
    if (degreeProcess - 1 != degreeDone){
        FetchGeneratorPolynomialOld(degreeDone + 1, degreeFetch);
        return;
    }

    // degree = 1 得 [1, 1] 表多項式 (x + 1)
    // degree = 2 得 [1, 3, 2] 表多項式 (x + 1)(x + 2) = x^2 + 3x + 2
    // degree = 3 得 [1, 7, 14, 8] 表多項式 (x + 1)(x + 2)(x + 4) = x^3 + 7x^2 + 14x + 8
    // 1, 2, 4, 8, 16, 32, 64, 128, 29, 58, ... 為 EXP，
    // 則 degree = 10 表 (x + 1)(x + 2)....(x + 128)(x + 29)(x + 58) 乘開後多項式的係數陣列
    // 將前一個累積的係數陣列代表的多項式與 (x + EXP[degree]) 相乘即為所求
    GeneratorPolynomial[degreeProcess] = PolynomialMulti(GeneratorPolynomial[degreeDone], new Uint8Array([1, EXP[degreeProcess]]));

    FetchGeneratorPolynomialOld(degreeProcess + 1, degreeFetch);
    */
}

/**
 * 預先產生 Generator Polynomial 的資料
 * @param {number} degree 目標要產生足夠的 degree
 */
function InitGeneratorPolynomial(degree){
    // degree = 1 得 [1, 1] 表多項式 (x + 1)
    // degree = 2 得 [1, 3, 2] 表多項式 (x + 1)(x + 2) = x^2 + 3x + 2
    // degree = 3 得 [1, 7, 14, 8] 表多項式 (x + 1)(x + 2)(x + 4) = x^3 + 7x^2 + 14x + 8
    // 1, 2, 4, 8, 16, 32, 64, 128, 29, 58, ... 為 EXP，
    // 則 degree = 10 表 (x + 1)(x + 2)....(x + 128)(x + 29)(x + 58) 乘開後多項式的係數陣列
    // 將前一個累積的係數陣列代表的多項式與 (x + EXP[degree]) 相乘即為所求
    for(let i = 1; i < degree; i++){
        generatorPolynomial[i] = PolynomialMulti(generatorPolynomial[i - 1], new Uint8Array([1, EXP[i]]));
    }
}


/**
 * 取得 Error Data Correction
 * @param {Uint8Array} byteData 要填入字串的資料
 * @param {number} totalCodewordsNumber 
 * @returns 
 */
function GetErrorDataCorrection(byteData, totalCodewordsNumber) {
    //TODO: 這裡是傳入 total，Generator Polynomial 要用的 degree 是 errorCodewordsNumber，
    // 看要不要改寫成傳入 errorCodewordsNumber，再和 byteData.length 也就是 dataCodewordsNumber 加起來得 totalCodewordsNumber 做為 messagePolinomial 長度
    const degree = totalCodewordsNumber - byteData.length;
    const messagePolynomial = new Uint8Array(totalCodewordsNumber);
    messagePolynomial.set(byteData, 0);
    return PolynomialRemainder(messagePolynomial, GetGeneratorPolynomial(degree));
}


/**
 * 預處理 QR Code 的寬度格子數，依序為 0, 21, 25, 29 ,... 為 4n + 17
 * @param {number} n 目標處理到的版本
 */
function InitSizeList(n){
    for (let i = 1; i <= n; i++){
        sizeList.push(4 * i + 17);
    }
}


function InitAlignmentCoordinates(n){
    for (let version = 2; version <= n; version++){
        const tracks = [];
        // 至少會有 track 為 6
        tracks.push(6);
    
        // 會出現 Alignment Pattern 的中心為 Track，Track 的數量 n 是 Math.floor(version / 7) + 2
        // 故最左 Track 與最右 Track 之間的間隔數量 intervalCount 為 Math.floor(version / 7) + 1
        const intervalCount = Math.floor(version / 7) + 1;
        // 最左 Track 與最右 Track 之間的差 (lastRow - 6) - (6) = (size - 1 - 6) - 6 = 17 + version * 4 - 13 = 4 + version * 4
        const distance = 4 * version + 4;
        // 距離平分後若是偶數則為各 Track 之間的距離，若為奇數取下一個偶數
        const step = Math.ceil(distance / intervalCount / 2) * 2;
        const lastTrack = 6 + distance;
        // 從最後的 Track 往前加間距來取得座標，多個 Track 時只有第一和第二的距離與剩下的不同
        for (let c = 0; c < intervalCount; c++){
            tracks.push(lastTrack - step * c);
        }
        
        const alignmentCenters = [];
        // 排除掉與左上、右上、左下，三個 Finder Pattern 重疊的座標
        for (const row of tracks){
            for (const column of tracks){
                if (row === 6 && column === 6) continue;
                if (row === 6 && column === lastTrack) continue;
                if (row === lastTrack && column === 6) continue;
                alignmentCenters.push([row, column]);
            }
        }
        alignmentCoordinates.push(alignmentCenters);
    }
}


/**
 * 依版本取得新的 QR code 矩陣空資料
 * @param {number} version 版本
 * @returns 
 */
function GetNewMatrix(version){
    const size = sizeList[version];
    // 建立 size 個 row，每個 row 又是長 size 的 Uint8Array
    const matrix = new Array(size);
    for(let i = 0; i < size; i++){
        matrix[i] = new Uint8Array(size);
    }
    return matrix;
}


/**
 * 將矩陣指定位置填入長方形
 * @param {Uint8Array[]} matrix 要變動的矩陣資料
 * @param {number} row 指定位置的所在列編號
 * @param {number} column 指定位置的所在行編號
 * @param {number} width 填入的長方形寬度
 * @param {number} height 填入的長方形高度
 * @param {number} fillValue 要填入的值為 0 或 1
 */
function FillRectangle(matrix, row, column, width, height, fillValue = 1){
    for (let r = row, m = row + height; r < m; r++){
        for (let c = column, n = column + width; c < n; c++){
            matrix[r][c] = fillValue;
        }
    }
}

/**
 * 填滿標記區塊，包括定位標記、校正標記、定時資訊，黑格
 * @param {Uint8Array[]} matrix 矩陣資料
 * @param {number} version 版本
 */
function FillPattern(matrix, version){
    const size = matrix.length;

    // Finder patterns 定位標記
    // 左上，7x7 的回字區域，往外空出一行與一列，再加上 Format Information 格式資訊再佔一行與一列，所以 (0, 0) 填滿寬 9 高 9 的矩形
    FillRectangle(matrix, 0, 0, 9, 9);
    // 右上，7x7 的回字區域，往外空出一行與一列，再加上 Format Information 格式資訊再佔一列，所以 (0, -8) 填滿寬 8 高 9 的矩形
    FillRectangle(matrix, 0, size - 8, 8, 9);
    // 左下，7x7 的回字區域，往外空出一行與一列，再加上 Format Information 格式資訊再佔一行，所以 (-8, 0) 填滿寬 9 高 8 的矩形
    FillRectangle(matrix, size - 8, 0, 9, 8);

    // Alignment pattern 校正標記
    // 每個校正標記 5x5 的回字區域，中心點所在的 [row, column]
    const alignmentCenters = alignmentCoordinates[version];
    for (const [row, column] of alignmentCenters){
        // 中心點左上角 2 單位的地方, 往右下角畫 5x5 的矩形
        FillRectangle(matrix, row - 2, column - 2, 5, 5);
    }

    // Timing patterns 定時資訊
    // 上方水平，連接左上與右上，從 (6, 9) 連向 (6, -9)，中間距離 version * 4，所以 (6, 9) 填滿寬 version * 4 高 1 的矩形
    FillRectangle(matrix, 6, 9, version * 4, 1);
    // 左方鉛直，連接左上與左下，從 (9, 6) 連向 (-9, 6)，中間距離 version * 4，所以 (9, 6) 填滿寬 1 高 version * 4 的矩形
    FillRectangle(matrix, 9, 6, 1, version * 4);

    // Dark module
    matrix[size - 8][8] = 1;

    // Version Information
    // 版本自 7 開始，右上與左下會有 3x6 與 6x3 的區域要放版本資訊
    if (version > 6) {
        FillRectangle(matrix, 0, size - 11, 3, 6);
        FillRectangle(matrix, size - 11, 0, 6, 3);
    }
}

/**
 * 將被填滿的標記畫出空白的格子，顯示正確的圖形
 * @param {Uint8Array[]} matrix 矩陣資料
 * @param {number} version 版本
 */
function SculpPattern(matrix, version){
    const size = matrix.length;

    // Finder patterns 定位標記
    // 左上，7x7 回字區域，挖空出四條內部，並挖掉周圍
    FillRectangle(matrix, 1, 1, 4, 1, 0);
    FillRectangle(matrix, 1, 5, 1, 4, 0);
    FillRectangle(matrix, 2, 1, 1, 4, 0);
    FillRectangle(matrix, 5, 2, 4, 1, 0);
    FillRectangle(matrix, 0, 7, 1, 8, 0);
    FillRectangle(matrix, 7, 0, 7, 1, 0);
    // 右上，7x7 回字區域，挖空出四條內部，並挖掉周圍
    FillRectangle(matrix, 1, size - 6, 4, 1, 0);
    FillRectangle(matrix, 1, size - 2, 1, 4, 0);
    FillRectangle(matrix, 2, size - 6, 1, 4, 0);
    FillRectangle(matrix, 5, size - 5, 4, 1, 0);
    FillRectangle(matrix, 0, size - 8, 1, 8, 0);
    FillRectangle(matrix, 7, size - 7, 7, 1, 0);
    // 左下，7x7 回字區域，挖空出四條內部，並挖掉周圍
    FillRectangle(matrix, size - 6, 1, 4, 1, 0);
    FillRectangle(matrix, size - 6, 5, 1, 4, 0);
    FillRectangle(matrix, size - 5, 1, 1, 4, 0);
    FillRectangle(matrix, size - 2, 2, 4, 1, 0);
    FillRectangle(matrix, size - 8, 0, 8, 1, 0);
    FillRectangle(matrix, size - 7, 7, 1, 7, 0);

    // Alignment pattern 校正標記
    // 每個校正標記 5x5 的回字區域，中心點所在的 [row, column]
    const alignmentCenters = GetAlignmentCoordinates(version);
    for (const [row, column] of alignmentCenters){
        // 中心點左上角 1 單位的地方, 往右下角畫 3x3 的矩形
        FillRectangle(matrix, row - 1, column - 1, 3, 3, 0);
        // 中心點補回一格
        matrix[row][column] = 1;
    }
    // Timing patterns 定時資訊
    for (let i = 9, u = version * 4 + 9; i < u; i += 2){
        // 跳格挖掉變班馬線，同時做上方水平和左方鉛直
        matrix[6][i] = 0;
        matrix[i][6] = 0;
    }
}

function GetAlignmentCoordinates(version){
    return alignmentCoordinates[version];
}

/**
 * 取得填值的座標序列
 * @param {Uint8Array[]} matrix 矩陣資料
 * @returns {Array} 座標序列，形式為 [[24, 24], [24, 23], ... ]，每個項目為 [row, column]
 */
function GetSequence(matrix){
    const size = matrix.length;

    // 列推移的量，預設 -1，從右下角開始是往上推
    let rowStep = -1;
    // 所在 row 位置，從右下角開始為最後一列
    let row = size - 1;
    // 所在 column 位置，從右下角開始為最後一行
    let column = size - 1;
    // 要回傳的可塞格子位置，形式為 [[24, 24], [24, 23], [23, 24], [23, 23], [22, 24], ... ]
    // 表示從(24, 24)開始往(24, 23)、(23, 24)、(23, 23)、(22, 24) ... Z 字方向填黑白格子
    const sequence = [];
    let index = 0;
    // 以下神技，佩服不已
    while (column >= 0) {
        if (matrix[row][column] === 0) {
            // 只在 0 的時候取出座標做為填值用位置，前面 FillPattern 會先把定位標記、校正標記、定時資訊等地方先設為 1，無法做為填值
            sequence.push([row, column]);
        }
        // index 為奇數時，可能是↗往右上走，或是↘往右下走，column 會加 1，而 row 受 rowStep 是正 1 或負 1 影響，而往下或往上
        if (index & 1) {
            // row 先變化，rowStep = 1 時往下，rowStep = -1 時往上
            row += rowStep;
            // 當 row 移到 -1 表示到頂部了，若移到 size 表示到底部了，則 rowStep 要相反讓下一次的上下能轉換方向，並且馬上加一次調整回盤面
            if (row === -1 || row === size) {
                rowStep = -rowStep;
                row += rowStep;
                // 若 column 剛好 7 又移到頂部或底部，則下一步要跨過左方鉛直的定時資訊，要一次左移 2 格
                // 若 column 不是 7，只要左移 1 格就好
                column -= column === 7 ? 2 : 1;
            }
            else {
                column++;
            }
        }
        // index 為偶數時，下一步←往左移
        else {
            column--;
        }
        index++;
    }
    return sequence;
}

/**
 * 合併 Data Codewords 與 Error Correction Codewords 
 * @param {Uint8Array} dataCodwords 
 * @param {Uint8Array} errorCorrectCodewords 
 * @returns 要填入的 Total Codewords
 */
function GetCombineCodewords(dataCodwords, errorCorrectCodewords) {
    const m = dataCodwords.length, n = errorCorrectCodewords.length;
    const combined = new Uint8Array(m + n);
    for (let i = 0; i < m; i++){
        combined[i] = dataCodwords[i];
    }
    for (let i = 0; i < n; i++){
        combined[m + i] = errorCorrectCodewords[i];
    }
    return combined;
}

/**
 * 將 Data Codewords 與 Error Correction Codewords 合併成的資料，二進位表示的 0 1 依序填入矩陣
 * @param {Uint8Array[]} matrix 矩陣資料
 * @param {Uint8Array} totalCodewords 完整的 Codewords 資料
 * @param {Array} sequence 填值的座標序列
 */
function PlaceCodewords(matrix, totalCodewords, sequence){
    let index = 0;
    // 每一個 codeword 是 8 個 module 格子，由左至右依照 sequence 順序填入矩陣 matrix 對應的 (row, column) 裡
    for (const codeword of totalCodewords) {
        // 右移後與 1 做 AND 將得各位數上是 0 還是 1，例如 shift = 5，codeword = 118，二進位表示是 01110110
        // 01110110 >> 5 得 011，而 011 & 1 得 1                                               --^-----
        // shift 由 7 到 0 所以由高位往低位取值來填入
        for (let shift = 7; shift >= 0; shift--) {
            const bit = (codeword >> shift) & 1;
            const [row, column] = sequence[index];
            index++;
            matrix[row][column] = bit;
        }
    }
}


/**
 * 遮罩的函數
 */
const maskFunction = [
    (row, column) => ((row + column) & 1) === 0,
    (row, column) => (row & 1) === 0,
    (row, column) => column % 3 === 0,
    (row, column) => (row + column) % 3 === 0,
    (row, column) => (((row >> 1) + Math.floor(column / 3)) & 1) === 0,
    (row, column) => ((row * column) & 1) + ((row * column) % 3) === 0,
    (row, column) => ((((row * column) & 1) + ((row * column) % 3)) & 1) === 0,
    (row, column) => ((((row + column) & 1) + ((row * column) % 3)) & 1) === 0,
];


/**
 * 取得不同遮罩結果的矩陣
 * @param {Uint8Array[]} baseMatrix 放好定位等標記後的矩陣資料
 * @param {Array} sequence 填值的序列
 * @param {Uint8Array} totalCodewords 合併後要填入的 Codeword 資料
 * @param {number} maskIndex 遮罩編號，有 0 到 7
 * @returns {Uint8Array[]}遮罩處理後的矩陣
 */
function GetMaskedMatrix(baseMatrix, sequence, totalCodewords, maskIndex) {
    // Array.from() 二階沒有 deep copy，棄用
    //const matrix = Array.from(baseMatrix);
    
    let size = baseMatrix.length;
    const matrix = new Array(size);
    for(let i = 0; i < size; i++){
        const row = new Uint8Array(size);
        for (let k = 0; k < size; k++){
            row[k] = baseMatrix[i][k];
        }
        matrix[i] = row;
    }
    
    // 將資料 codeword 轉 Bit 依 sequence 的座標順序，與遮罩 XOR 後填入矩陣的對應 module 中
    for(let i = 0, n = sequence.length; i < n; i++){
        const row = sequence[i][0];
        const column = sequence[i][1];
        // 一個 codeword 是 8 個 module，而 i 是 sequence 的 index，每 8 個換下一個 codeword，故以下右移 3
        const codeword = totalCodewords[i >> 3];
        // 神之一手
        const bitShift = 7 - (i & 0b111);
        const moduleBit = (codeword >> bitShift) & 1;
        matrix[row][column] = moduleBit ^ maskFunction[maskIndex](row, column);
    }
    return matrix;
}

/**
 * 依錯誤修正等級 Error Correct Level 和遮罩編號 取得 Format Module 格式資料，為 15 個 bit
 * @param {number} errorCorrectLevel 錯誤修正等級 Error Correct Level [0=M, 1=L, 2=H, 3=Q]
 * @param {number} maskIndex 遮罩編號，有 0 到 7
 * @returns 
 */
function GetFormatModules(errorCorrectLevel, maskIndex) {
    const formatPolynomial = new Uint8Array(15);
    const maskedFormatPolynomial = new Uint8Array(15);
    // 依規則產生 ax^14 + bx^13 + cx^12 + dx^11 + ex^10，再除以 x^10 + x^8 + x^5 + x^4 + x^2 + x + 1 取九次的餘式
    formatPolynomial[0] = errorCorrectLevel >> 1;
    formatPolynomial[1] = errorCorrectLevel & 1;
    formatPolynomial[2] = maskIndex >> 2;
    formatPolynomial[3] = (maskIndex >> 1) & 1;
    formatPolynomial[4] = maskIndex & 1;
    const remainder = PolynomialRemainder(formatPolynomial, formatDivisor);
    // 將餘式接在 Format Polynomial 後面
    for(let i = 5; i < 15; i ++){
        formatPolynomial[i] = remainder[i - 5];
    }
    // 係數陣列經遮罩得 Format Module 格式資料
    for(let i = 0; i < 15; i ++){
        maskedFormatPolynomial[i] = formatPolynomial[i] ^ formatMask[i];
    }
    return maskedFormatPolynomial;
}

/**
 * 取得 Format Module 並放入矩陣中
 * @param {Uint8Array[]} matrix 矩陣資料
 * @param {number} errorCorrectLevel 錯誤修正等級 Error Correct Level [0=M, 1=L, 2=H, 3=Q]
 * @param {number} maskIndex 遮罩編號，有 0 到 7
 */
function PlaceFormatModules(matrix, errorCorrectLevel, maskIndex) {
    const formatModules = GetFormatModules(errorCorrectLevel, maskIndex);
    const last = matrix.length - 1;

    for (let i = 0; i < 6; i++){
        matrix[8][i] = formatModules[i];
        matrix[last - i][8] = formatModules[i];
    }
    matrix[8][7] = formatModules[6];
    matrix[8][8] = formatModules[7];
    matrix[7][8] = formatModules[8];
    matrix[last - 6][8] = formatModules[6];
    matrix[8][last - 7] = formatModules[7];
    matrix[8][last - 6] = formatModules[8];
    
    for (let i = 9; i < 15; i++){
        matrix[14 - i][8] = formatModules[i];
        matrix[8][last - 14 + i] = formatModules[i];
    }
}

/**
 * 取得一列或一行黑白格資料中，連續五格同色以上的 Penalty Score (Rule 1)
 * @param {Uint8Array} line 一列或一行資料
 * @returns {number} Penalty Score
 */
function GetPenaltyOfLine(line){
    // 連續的 module 已有多少個
    let countOfSame = 1;
    // 上一個連續的 module 格子的值（先賦予 [0]，後面從 [1] 開始與前面的比較）
    let lastModule = line[0];
    // 統計要回傳的 Penalty
    let penalty = 0;

    for (let i = 1, n = line.length; i < n; i++){
        const module = line[i];
        // 如果現在的格子與前一個格子不同，表示斷掉了，重算
        if (module !== lastModule){
            lastModule = module;
            countOfSame = 1;
        }
        else{
            countOfSame++;
            // 若連續數量剛好達 5 個，依規則先給 penalty 3，之後再累加
            if (countOfSame == 5){
                penalty += 3;
            }
            else if (countOfSame > 5){
                penalty++;
            }
        }
    }

    return penalty;
}

/**
 * 取得一列或一行的黑白格資料中，與 黑白黑黑黑白黑白白白白 的相似數量
 * @param {Uint8Array} line 列或行的資料
 * @returns {number} 相似數量
 */
function GetSimilarityOfLine(line){
    // 比對的開始 index 從 0 到 size -11，因為 黑白黑黑黑白黑白白白白 的長度為 11，取 size - 10 可以讓後面 i + k 剛好到最後
    const last = line.length - 10;
    let countOfSimilarity = 0;

    for (let i = 0; i < last; i++){
        let same1 = true, same2 = true;
        for (let k = 0; k < 11; k++){
            // 比對 黑白黑黑黑白黑白白白白
            if (line[i + k] !== similarityFinderPattern1[k]){
                same1 = false;
            }
            // 比對 白白白白黑白黑黑黑白黑
            if (line[i + k] !== similarityFinderPattern2[k]){
                same2 = false;
            }
        }
        if (same1){
            countOfSimilarity++;
        }
        if (same2){
            countOfSimilarity++;
        }
    }

    return countOfSimilarity;
}

/**
 * 取得矩陣資料計算 Rule 1~4 的罰分 Penalty Score
 * @param {Uint8Array[]} matrix 經遮罩後的矩陣資料
 * @returns {number} 罰分 Penalty Score
 */
function GetPenaltyScore(matrix){
    const size = matrix.length;
    const last = size - 1;
    
    let totalPenalty = 0;
    let countOfSimilarity = 0;
    let countOfDark = 0;
    let countOfSquare = 0;

    for (let r = 0; r < size; r++ ){
        // 取各列計算 Penalty Score of Line (Rule 1)
        totalPenalty += GetPenaltyOfLine(matrix[r]);
        // 取各列計算與 黑白黑黑黑白黑白白白白 的相似個數
        countOfSimilarity += GetSimilarityOfLine(matrix[r]);

        const moduleOfColumn = new Uint8Array(size);
        for (let c = 0; c < size; c++){
            // 組成各行，注意這裡是取 [c][r]，取直的行資料出來
            moduleOfColumn[c] = matrix[c][r];

            // 此格不是最行一列也不是最後一行時，判斷「此格與右格、下格、右下格」是否為同色 2x2 正方形
            if (r < last && c < last){
                const module = matrix[r][c];
                if (module === matrix[r][c + 1] && module === matrix[r + 1][c] && module === matrix[r + 1][c + 1]){
                    countOfSquare++;
                }
            }

            // 記算黑格的數量，Penalty Score of Difference (Rule 4)要用
            if (matrix[r][c] === 1){
                countOfDark++;
            }
        }
        // 取各行計算 Penalty Score of Line (Rule 1)
        totalPenalty += GetPenaltyOfLine(moduleOfColumn);
        // 取各行計算與 黑白黑黑黑白黑白白白白 的相似個數
        countOfSimilarity += GetSimilarityOfLine(moduleOfColumn);
    }

    // 補最後一列、最後一行
/*
    totalPenalty += GetPenaltyOfLine(matrix[last]);
    countOfSimilarity += GetSimilarityOfLine(matrix[last]);
    const lastColumn = new Uint8Array(size);
    for (let i = 0; i < size; i++){
      const module = matrix[i][last];
      lastColumn[i] = module;
      if (module === 1){
        countOfDark++;
      }
      if (matrix[last][i] === 1){
        countOfDark++;
      }
    }
    if (matrix[last][last] === 1){
      countOfDark--;
    }
    totalPenalty += GetPenaltyOfLine(lastColumn);
    countOfSimilarity += GetSimilarityOfLine(lastColumn);
*/
    // 計算 Penalty Score of Rectangle (Rule 2)
    totalPenalty += countOfSquare * 3;

    // 計算 Penalty Score of Similarity (Rule 3)
    totalPenalty += countOfSimilarity * 40;

    // 計算黑格在盤面佔的百分比，取較接近 50 的 5 的倍數，與 50 的差再 2 倍，即 Penalty Score of Difference (Rule 4)
    const percentage = countOfDark * 100 / (size * size);
    if (percentage > 50){
      totalPenalty += (Math.floor(percentage / 5) * 5 - 50) * 2;
    }
    else{
      totalPenalty += (50 - Math.floor(percentage / 5) * 5) * 2;
    }
    //const roundedPercentage = percentage > 50 ? Math.floor(percentage / 5) * 5 : Math.ceil(percentage / 5) * 5;
    //totalPenalty += Math.abs(roundedPercentage - 50) * 2;

    return totalPenalty;
}

/**
 * 取得最佳遮罩後的矩陣和最低罰分
 * @param {Uint8Array[]} baseMatrix 基本矩陣資料
 * @param {Array} sequence 填入資料序列
 * @param {Uint8Array} totalCodewords 合併後 codeword 資料
 * @param {number} errorCorrectLevel 錯誤修正等級 Error Correct Level [0=M, 1=L, 2=H, 3=Q]
 * @param {number} version 版本
 * @returns
 */
function GetOptimalMask(baseMatrix, sequence, totalCodewords, errorCorrectLevel, version){
    let bestMatrix;
    let bestMask = -1;
    let leastPenaltyScore = Infinity;

    for (let i = 0; i < 8; i++){
        const matrix = GetMaskedMatrix(baseMatrix, sequence, totalCodewords, i);
        PlaceFormatModules(matrix, errorCorrectLevel, i);
        if (version > 6){
            PlaceVersionModules(matrix, version);
        }
        SculpPattern(matrix, version);
        const penaltyScore = GetPenaltyScore(matrix);
        // 有更低的罰分就置換掉，目標找到最低罰分的矩陣
        if (penaltyScore < leastPenaltyScore){
            leastPenaltyScore = penaltyScore;
            bestMatrix = matrix;
            bestMask = i;
        }
    }
    return [bestMatrix, bestMask, leastPenaltyScore];
}

/**
 * 依指定遮罩取得矩陣和罰分資料
 * @param {Uint8Array[]} baseMatrix 基本矩陣資料
 * @param {Array} sequence 填入資料序列
 * @param {Uint8Array} totalCodewords 合併後 codeword 資料
 * @param {number} errorCorrectLevel 錯誤修正等級 Error Correct Level [0=M, 1=L, 2=H, 3=Q]
 * @param {number} version 版本
 * @param {number} maskIndex 遮罩編號 0~7
 * @returns 
 */
function GetSpecificMask(baseMatrix, sequence, totalCodewords, errorCorrectLevel, version, maskIndex){
    const matrix = GetMaskedMatrix(baseMatrix, sequence, totalCodewords, maskIndex);
    PlaceFormatModules(matrix, errorCorrectLevel, maskIndex);
    if (version > 6){
        PlaceVersionModules(matrix, version);
    }
    SculpPattern(matrix, version);
    const penaltyScore = GetPenaltyScore(matrix);
    return [matrix, maskIndex, penaltyScore];
}

/**
 * 取得 Data Codewords 的 byte 內容
 * @param {object} content 要編碼字串內容，若資料類型 Encoding Mode 為 5 表 Unicode Byte，則 content 為 Byte Array
 * @param {number} encodingMode 資料類型 Encoding Mode [1=Numeric, 2=Alphanumeric, 4=Byte, 5=UnicodeByte]
 * @param {number} contentLengthBits 要編碼字串長度在 Data Codeword 中要佔多少 bit 的個數
 * @param {number} dataCodewordsNumber 資料 Codeword 長度
 * @returns 
 */
function GetByteData(content, encodingMode, contentLengthBits, dataCodewordsNumber) {
    const data = new Uint8Array(dataCodewordsNumber);
    switch(encodingMode){
        case 0b0001://Numeric
            FillNumericData(data, content, contentLengthBits, dataCodewordsNumber);
            break;
        case 0b0010://Alphanumeric
            FillAlphanumericData(data, content, contentLengthBits, dataCodewordsNumber);
            break;
        case 0b0100://Byte
            FillByteData(data, content, contentLengthBits, dataCodewordsNumber);
            break;
        case 0b0101://ByteUnicode
            FillByteData(data, content, contentLengthBits, dataCodewordsNumber);
            break;
        case 0b1000://Kanji
            FillKanjiData(data, content, contentLengthBits, dataCodewordsNumber);
            break;
        default:
            break;
    }
    return data;
}

function FillNumericData(data, content, contentLengthBits, dataCodewordsNumber){

    const contentLength = content.length;
    const groupCount = Math.floor(contentLength / 3);
    let offset = 0;

    // encodingMode = 1 的 Numeric 類型其 lengthBits 有 10（version 1 到 9）、12（version 10 到 26）和 14（version 27 以上）三種
    // 由於前 4 位是 encodingMode 0001，又八個 bit 一個 Codeword，每三個數為一個 group 需要 10 bit（剩下二位數或一位數是各要 7 bit 和 4 bit）
    // LengthBit = 10: 0001LLLL LLLLLLAA AAAAAAAA BBBBBBBB BBCCCCCC CCCCDDDD DDDDDDFF FFFFFFFF ....
    // LengthBit = 12: 0001LLLL LLLLLLLL AAAAAAAA AABBBBBB BBBBCCCC CCCCCCDD DDDDDDDD FFFFFFFF ....
    // LengthBit = 14: 0001LLLL LLLLLLLL LLAAAAAA AAAABBBB BBBBBBCC CCCCCCCC DDDDDDDD DDFFFFFF ....

    if (contentLengthBits === 10){
        // 10 bit 時有 4 位在 [0]，有 6 位在 [1]
        data[0] = 0b00010000 | (contentLength >> 6) ;
        data[1] = (contentLength & 0b111111) << 2;
    }
    else if (contentLengthBits === 12){
        // 12 bit 時有 4 位在 [0]，有 8 位在 [1]
        data[0] = 0b00010000 | (contentLength >> 8) ;
        data[1] = contentLength & 0b11111111;
    }
    else{
        // 14 bit 時有 4 位在 [0]，有 8 位在 [1]，有 2 位在 [2]
        data[0] = 0b00010000 | (contentLength >> 10) ;
        data[1] = (contentLength >> 2) & 0b11111111;
        data[2] = (contentLength & 0b11) << 6;
    }
    offset = 4 + contentLengthBits;
    
    for (let i = 0; i < groupCount; i++){
        // 長度 3 的數字，截取段落出來以十進位轉成數字
        const value = parseInt(content.substr(i * 3, 3), 10);
        // 要處理的 index 位置，每 8 個 bit 一數得 codeword 位置，將處理 index 與 index + 1
        const index = offset >> 3;
        // 此 index 的 codeword 中，已移了多少 bit
        const remainOffset = offset & 7;
        // 三位數以 10 bit 放入，每個 codeword 只有 8 bit 所以一定會佔用一前一後兩個 codeword
        // 前面 codeword（data[index]）需要位數為 8 - remainOffset，需要右移 10 - (8 - remainOffset) = remainOffset + 2
        const shiftRight = remainOffset + 2;
        // 後面 codeword（data[index + 1]）需要位數 remainOffset + 10 - 8 = remainOffset + 2，需要左移 8 - (remainOffset + 2) = 8 - shiftRight
        const shiftLeft = 8 - shiftRight;

        data[index] |= value >> shiftRight;
        data[index + 1] = (value & maskList[shiftRight]) << shiftLeft;

        offset += 10;
    }

    const lastLength = contentLength - groupCount * 3;
    if (lastLength > 0){
        const lastGroup = content.substr(groupCount * 3);
        const value = parseInt(lastGroup);
        // 剩下數字為二位數時可被 2^7 = 128 涵蓋，以 7 bit 來表示；若為一位數可被 2^4 = 16 涵蓋，以 4 bit 來表示
        const lastBitLength = lastLength === 2 ? 7 : 4;
        const index = offset >> 3;
        const remainOffset = offset & 7;

        if (lastBitLength <= 8 - remainOffset){
            // 現在 codeword 足夠塞入最後的數字，佔去 lastBitLength 位，需要左移 8 - remainOffset - lastBitLength 位
            data[index] |= value << 8 - remainOffset - lastBitLength;
        }
        else{
            // 現在 codeword 不夠塞入最後的數字，先塞位數 8 - remainOffset，需要右移 remainOffset + lastBitLength - 8 位
            data[index] |= value >> (remainOffset + lastBitLength - 8);
            // 後面 codeword 需要位數 remainOffset + lastBitLength - 8 位，遮罩後需要左移 8 - (remainOffset + lastBitLength - 8) = 16 - remainOffset - lastBitLength
            data[index + 1] = (value & maskList[remainOffset + lastBitLength - 8]) << (16 - remainOffset - lastBitLength);
        }
        offset += lastBitLength;
    }
    PadCodewords(data, offset, dataCodewordsNumber);
}

function FillAlphanumericData(data, content, contentLengthBits, dataCodewordsNumber){
    // encodingMode = 2 的 Alphanumeric 類型其 lengthBits 有 9（version 1 到 9）、11（version 10 到 26）和 13（version 27 以上）三種
    // 由於前 4 位是 encodingMode 0010，又八個 bit 一個 Codeword，每兩個字元要 11 bit （剩一個字元時要 6 bit）
    // LengthBit = 9 : 0010LLLL LLLLLAAA AAAAAAAA BBBBBBBB BBBCCCCC CCCCCCDD DDDDDDDD DEEEEEEE EEEEFFFF ...
    // LengthBit = 11: 0010LLLL LLLLLLLA AAAAAAAA AABBBBBB BBBBBCCC CCCCCCCC DDDDDDDD DDDEEEEE EEEEEEFF ...
    // LengthBit = 13: 0010LLLL LLLLLLLL LAAAAAAA AAAABBBB BBBBBBBC CCCCCCCC CCDDDDDD DDDDDEEE EEEEEEEE ...
    const contentLength = content.length;
    const groupCount = Math.floor(contentLength / 2);
    let offset = 0;

    if (contentLengthBits === 9){
        // 9 bit 時有 4 bit 在 [0]，有 5 bit 在 [1]
        data[0] = 0b00100000 | contentLength >> 5;
        data[1] = (contentLength & 0b11111) << 3;
    }
    else if (contentLengthBits === 11){
        // 11 bit 時有 4 bit 在 [0]，有 7 bit 在 [1]
        data[0] = 0b00100000 | contentLength >> 7;
        data[1] = (contentLength & 0b1111111) << 1;
    }
    else{
        // 13 bit 時有 4 bit 在[0]，有 8 bit 在 [1]，有 1 在 [2]
        data[0] = 0b00100000 | contentLength >> 9;
        data[1] = (contentLength >> 1) & 0b11111111;
        data[2] = (contentLength & 0b1) << 7;
    }
    offset = 4 + contentLengthBits;

    for (let i = 0; i < groupCount; i++){
        const value = mapAlphanumeric[content.substr(i * 2, 1)] * 45 + mapAlphanumeric[content.substr(i * 2 + 1, 1)];
        const index = offset >> 3;
        const remainOffset = offset & 7;
        if (remainOffset <= 5){
            // 需要 11 位的資料可以塞在兩個 codeword 裡
            // 前面 codeword 要放入 8 - remainOffset 位，需要右移 11 - (8 - remainOffset) = 3 + remainOffset 位
            data[index] |= value >> (3 + remainOffset);
            // 後面 codeword 要放入 3 + remainOffset 位，遮罩後需左移 8 - (3 + remainOffset) = 5 - remainOffset 位
            data[index + 1] = (value & maskList[3 + remainOffset]) << (5 - remainOffset);
        }
        else{
            // 需要 11 位的資料要分在三個 codeword 裡
            // 前面 codeword 要放入 8 - remainOffset 位，需要右移 11 - (8 - remainOffset) = 3 + remainOffset 位
            data[index] |= value >> (3 + remainOffset);
            // 中間 codeword 要放入 8 位，需要右移 remainOffset + 11 - 8 - 8 = remainOffset - 5 位，再遮罩
            data[index + 1] = (value >> (remainOffset - 5)) & 0b11111111;
            // 後面 codeword 要放入 remainOffset - 5 位，遮罩後需要左移 8 - (remainOffset - 5) = 13 - remainOffset 位
            data[index + 2] = (value & maskList[remainOffset -5]) << (13 - remainOffset);
        }
        offset += 11;
    }

    if (groupCount * 2 != contentLength){
        // 還有最後一個字元，以 6 bit 放入
        const value = mapAlphanumeric[content.substr(groupCount * 2)];
        const index = offset >> 3;
        const remainOffset = offset & 7;
        if (remainOffset <= 2){
            // 最後一個字元可放入這個 codeword，佔去 6 bit，需要左移 8 - remainOffset - 6 = 2 - remainOffset 位
            data[index] |= value << (2 - remainOffset);
        }
        else{
            // 最後一個字元要分在兩個 codeword 中
            // 前面 codeword 佔去 8 - remainOffset 位，需要右移 remainOffset + 6 - 8 = remainOffset - 2 位
            data[index] |= value >> (remainOffset - 2);
            // 後面 codeword 佔去 remainOffset - 2 位，遮罩後需要左移 8 - (remainOffset - 2) = 10 - remainOffset 位
            data[index + 1] = (value & maskList[remainOffset - 2]) << (10 - remainOffset);
        }
        offset += 6;
    }
    PadCodewords(data, offset, dataCodewordsNumber);
}

function FillByteData(data, content, contentLengthBits, dataCodewordsNumber){
    // encodingMode = 4 的 Byte 類型其 lengthBits 只有 8（version 1 到 9）和 16（version 10 以上）兩種
    // 由於前 4 位是 encodingMode 0100，又八個 bit 一個 Codeword，一個字元需要 8 bit，所以 leftShift 和 rightShift 都是 4
    // LengthBit = 8 : 0100LLLL LLLLAAAA AAAABBBB BBBBCCCC CCCCDDDD DDDDEEEE EEEEFFFF ....
    // LengthBit = 16: 0100LLLL LLLLLLLL LLLLAAAA AAAABBBB BBBBCCCC CCCCDDDD DDDDEEEE ....
    const contentLength = content.length;
    let offset = 0;
    // 前四位是資料類型 Encoding Mode 4 = 0b0100，會佔去第一個 Codeword 左邊四位
    // 一個 Codeword 是 8 位所以要左移 4 位得 01000000，剩下是文字的長度
    if (contentLengthBits === 8){
        data[0] = 0b01000000 | (contentLength >> 4);
        data[1] = (contentLength & 0b1111) << 4;
    }
    else{
        // 若 lengthBit 為 16 則要取中間八位填入 [1] 這個 Codeword，故右移 4 位再和 255 遮罩，[2] Codeword 要文字長度的最右邊 4 位
        data[0] = 0b01000000 | (contentLength >> 12);
        data[1] = (contentLength >> 4) & 0b11111111;
        data[2] = (contentLength & 0b1111) << 4;
    }
    offset = 4 + contentLengthBits;

    // 當字元都是 0xFF 以內的文字（encodingMode = 4）直接取字元的 charCode；而有中日文則取出 Unicode byte 的陣列
    if (typeof content === 'string'){
        // 開始填值，剛好每個字元轉為 8 bit 後，左邊 4 位放在這一個 codeword，右邊 4 放下一個 codeword
        // 這一個 codeword 即 data[index]，要把前面已放的位數拿來 or
        // 下一個 codeword 即 data[index + 1]，遮罩取右邊 4 位後左移 4 位放入
        for (let i = 0; i < contentLength; i++) {
            const value = content.charCodeAt(i);
            const index = offset >> 3;
            data[index] |= value >> 4;
            data[index + 1] = (value & 0b1111) << 4;
            offset += 8;
        }
    }
    else{
        // 開始填值，每個 value 是 8 bit，左邊 4 位放在這一個 codeword，右邊 4 放下一個 codeword
        // 這一個 codeword 即 data[index]，要把前面已放的位數拿來 or
        // 下一個 codeword 即 data[index + 1]，遮罩取右邊 4 位後左移 4 位放入
        for (let i = 0; i < contentLength; i++) {
            const value = content[i];
            const index = offset >> 3;
            data[index] |= value >> 4;
            data[index + 1] = (value & 0b1111) << 4;
            offset += 8;
        }
    }

    PadCodewords(data, offset, dataCodewordsNumber);
}
/*
function FillKanjiData(data, content, lengthBits, dataCodewordsNumber){
    //8 10 12
    // encodingMode = 7 的 Kanji 類型其 lengthBits 有 8（version 1 到 9）、10（version 10 到 26）和 12（version 27 以上）三種
    // 由於前 4 位是 encodingMode 0111，又八個 bit 一個 Codeword，一個字元需要 8 bit，每個字元需要 13 bit
    // LengthBit = 8 : 0111LLLL LLLLAAAA AAAAAAAA ABBBBBBB BBBBBBCC CCCCCCCC CCCDDDDD DDDDDDDD EEEEEEEE EEEEEFFF ...
    // LengthBit = 10: 0111LLLL LLLLLLAA AAAAAAAA AAABBBBB BBBBBBBB CCCCCCCC CCCCCDDD DDDDDDDD DDEEEEEE EEEEEEEF ...
    // LengthBit = 12: 0111LLLL LLLLLLLL AAAAAAAA AAAAABBB BBBBBBBB BBCCCCCC CCCCCCCD DDDDDDDD DDDDEEEE EEEEEEEE ...
    const contentLength = content.length;
    let offset = 0;
    if (lengthBits === 8){
        data[0] = 0b10000000 | contentLength >> 4;
        data[1] = (contentLength & 0b1111) << 4;
    }
    else if (lengthBits === 10){
        data[0] = 0b10000000 | contentLength >> 6;
        data[1] = (contentLength & 0b111111) << 2;
    }
    else{
        data[0] = 0b10000000 | contentLength >> 8;
        data[1] = contentLength & 0b11111111;
    }

    offset += lengthBits;

    for (let i = 0; i < contentLength; i++){
        let jisCode = GetShiftJisCode(content.substr(i, 1));
        jisCode = jisCode - (jisCode >= 0xe040 ? 0xc140 : 0x8140);
        const value = (jisCode >> 8) * 192 + (jisCode & 255);

        const index = offset >> 3;
        const remainOffset = offset & 7;
        // 每個日文字要 13 位，可能佔用兩個 codeword，也可能跨三個 codeword
        if (remainOffset <= 3){
            // 只佔兩個 codeword
            // 前面 codeword 要放入 8 - remainOffset 位，需要右移 remainOffset + 13 - 8 = remainOffset + 5 位
            data[index] |= value >> (remainOffset + 5);
            // 後面 codeword 要放入 remainOffset + 5 位，遮罩後需左移 8 - (remainOffset + 5) = 3 - remainOffset 位
            data[index + 1] = (value & maskList[remainOffset + 5]) << (3 - remainOffset);
        }
        else{
            // 會跨三個 codeword
            // 前面 codeword 要放入 8 - remainOffset 位，需要右移 remainOffset + 13 - 8 = remainOffset + 5 位
            data[index] |= value >> (remainOffset + 5);
            // 中間 codeword 要放入 8 位，需要右移 remainOffset + 13 - 16 = remainOffset - 3 位，遮罩取 8 位
            data[index + 1] = (value >> remainOffset - 3) & 0b11111111;
            // 後面 codeword 要放入 remainOffset - 3 位，遮罩完再左移 8 - (remainOffset - 3) = 11 - remainOffset
            data[index + 2] = (value & maskList[remainOffset - 3]) << (11 - remainOffset);
        }
        offset += 13;
    }

    PadCodewords(data, offset, dataCodewordsNumber);
}

function GetShiftJisCode(char){
    return jisCode[char];
}
*/
/*
function PutBits(buffer, value, bitLength, offset) {
  const byteStart = offset >> 3;
  const byteEnd = (offset + bitLength - 1) >> 3;
  let remainingBits = bitLength;
  for (let index = byteStart; index <= byteEnd; index++) {
    const availableBits = index === byteStart ? 8 - (offset & 7) : 8;
    const bitMask = (1 << availableBits) - 1;
    const rightShift = Math.max(0, remainingBits - availableBits);
    const leftShift = Math.max(0, availableBits - remainingBits);
    // chunk might get over 255, but it won't fit a Uint8 anyway, so no
    // problem here. Watch out using other languages or data structures!
    const chunk = ((value >> rightShift) & bitMask) << leftShift;
    buffer[index] |= chunk;
    remainingBits -= availableBits;
  }
}
*/

function PadCodewords(data, offset, dataCodewordsNumber){
    // 取得填完 dataCodewords 後，在最後一個 codeword 中還剩幾個 bit 未填，這些要留 0 跳過
    const remainBitsCount = 8 - (offset & 7);
    // 取得要開始填 17 和 236 的 codeword 的起始位置，由 offset 每 8 bit 一數得 codeword 中開始的位置
    // 再往後 1，若剩餘 bit 數小於 4，則開始位置要往後 2（為什麼啊？）
    const fillStart = (offset >> 3) + (remainBitsCount < 4 ? 2 : 1);
    // 取得後面要填 17 和 236 的 codeword 個數
    const fillSize = dataCodewordsNumber - fillStart;
    // 從 0 開始奇偶交錯填入，偶數填入 236，奇數填入 17
    for (let index = 0; index < fillSize; index++) {
        const byte = index & 1 ? 17 : 236;
        data[fillStart + index] = byte;
    }
}

function InitAvailableModules(n){
    // version = 1，這個版本沒有校正標記，獨自算
    availableModules.push(21 * 21 - 3 * 8 * 8 - 2 * 15 - 1 - 2 * 5);
    for (let version = 2; version <= n; version++){
        // 校正標記 AlignmentPattern 對角線上的的個數
        const alignCount = Math.floor(version / 7) + 2;
        availableModules.push(
            // 邊長 version * 4 + 17，共有平方個格子
            (version * 4 + 17) * (version * 4 + 17) 
            // FinderPattern 有三個，每個 7x7 再包含間隔線是 8x8，要扣掉
            - 8 * 8 * 3 
            // AlignmentPattern 要扣掉左上、右上、左下與 FinderPattern 重疊的三個，每個佔 5x5，要扣掉
            - (alignCount * alignCount - 3) * 5 * 5 
            // Timing Pattern 有上面水平、左邊鉛直有兩條，長度 version * 4 + 1 要扣
            - (version * 4 + 1) * 2
            // 加回 TimingPattern 和 AlignmentPattern 重疊多扣的
            + (alignCount - 2) * 5 * 2
            // 錯誤修正等級 Error Correct Level 與遮罩資訊 Mask Information 有兩條各 15 格要扣
            - 15 * 2
            // 左下固定一格 dark module 有 1 格要扣
            - 1
            // 版本 7 開始會有右上和左下各 6 * 3 的版本格式資訊 Version Format Information 要扣
            - ((version > 6) ?  (6 * 3 * 2) : 0)
        );
    }
}


function GetAvailableModules(version) {
    return availableModules[version];
}

/**
 * 取得資料用的 Codeword 數量
 * @param {number} errorCorrectLevel 錯誤修正等級 Error Correct Level [0=M, 1=L, 2=H, 3=Q]
 * @param {number} version 版本 1~40
 * @returns 
 */
function GetDataCodewordsNumber(errorCorrectLevel, version) {
    // 可置入 module 格子數，每 8 個一數為 Codeword 總個數
    const totalCodewords = GetAvailableModules(version) >> 3;
    // 依錯誤修正等級與版本，找出對應的資訊，格式為 blockSize = 每個 Block 中的 Error Correct Codeword 數量，blockCount = 共有多少個 Block（包含 Group 1 & 2）
    const [blockSize, blockCount] = errorCorrectBlock[errorCorrectLevel][version];
    // 總 Codeword 數扣掉錯誤修正用的 Codeword 則為 Data 用的 Codeword 數
    return totalCodewords - blockSize * blockCount;
}


function GetCapacity(version, errorCorrectLevel, encodingMode){
    const dataCodewordsNumber = GetDataCodewordsNumber(errorCorrectLevel, version);
    const contentLengthBits = GetContentLengthBits(encodingMode, version);
    const availableBits = (dataCodewordsNumber << 3) - contentLengthBits - 4;

    switch(encodingMode){
        case 1:
            // Numeric
            const remainBits = availableBits % 10;
            return Math.floor(availableBits / 10) * 3 + (remainBits > 6 ?  2 : remainBits > 3 ? 1 : 0);
        case 2:
            // Alphanumeric
            return Math.floor(availableBits / 11) * 2 + (availableBits % 11 > 5 ? 1 : 0);
        case 4:
            // Byte 或 UnicodeByte
            return availableBits >> 3;
        default:
            return 0;
    }
}


function GetReorderData(data, blockCount){
    // Group 1 的 byte 數，而 Group 2 的 byte 數恰好多 1
    const blockSize = Math.floor(data.length / blockCount);
    // Group 1 有多少 Block 的個數
    const group1Count = blockCount - data.length % blockCount;
    const n = data.length;
    // 重排序後的 Data Codeword，長度與原來的相同
    const reorderData = new Uint8Array(n);
    for (let i = 0; i < n; i++){
        // 新的排序是左上開始，由上往下，編號 i 每 blockCount 一數，是已走完完整的直行數
        const passedColumnCount = Math.floor(i / blockCount);
        // 左邊完整的直行數後，在此直行中由上往下還要再走多少 byte 到這個編號 i
        const passedByteCount = i % blockCount;
        // 對應到原 data 的編號 k
        let k;
        if (passedColumnCount === blockSize){
            // i 在最後一直行，要往下推 group1Count 將他移到 Group 2 內
            //k = (passedByteCount + group1Count + 1) * (blockSize + 1) - group1Count - 1;
            k = (blockSize + 1) * (passedByteCount + group1Count) - group1Count + passedColumnCount;
        }
        else{
            if (passedByteCount < group1Count){
                // 非最後一直行，在 Group 1 中，上方的完整橫列皆 blockSize 有 passedByteCount 個，再加上此橫列左邊的 passedColumnCount
                k = passedByteCount * blockSize + passedColumnCount;
            }
            else{
                // 非最後一直行，在 Group 2 中，當作填滿右上角，上方的完整列用 blockSize + 1 為寬去乘以 passedByteCount 個，再扣掉右上角的個數即 group1Count，再加上此橫列左邊的 passedColumnCount
                k = passedByteCount * (blockSize + 1) - group1Count + passedColumnCount;
            }
        }
        reorderData[i] = data[k];
    }
    return reorderData;
    
}


function GetErrorCorrectData(data, blockCount, errorCorrectBlockSize){
    const dataLength = data.length;
    // Group 1 中的 Block 長度，若 Gropu 2 的 Block 會多 1
    const dataBlockSize = Math.floor(dataLength / blockCount);
    // Group 1 的 Block 個數
    const group1Count = blockCount - dataLength % blockCount;
    // 要回傳的 Error Correct Data，每個 Block 都要放入長度 errorCorrectBlockSize 的資料
    const errorCorrectData = new Uint8Array(errorCorrectBlockSize * blockCount);
    for (let blockIndex = 0; blockIndex < blockCount; blockIndex++){
        const dataStartIndex = blockIndex < group1Count ? dataBlockSize * blockIndex : (dataBlockSize + 1) * blockIndex - group1Count;
        const dataBlockLength = dataBlockSize + (blockIndex < group1Count ? 0 : 1);
        const dataBlock = new Uint8Array(dataBlockLength);
        for (let i = 0; i < dataBlockLength; i++){
            dataBlock[i] = data[dataStartIndex + i];
        }
        const totalCodewordsNumber = dataBlockLength + errorCorrectBlockSize;
        const errorCorrectCodewords = GetErrorDataCorrection(dataBlock, totalCodewordsNumber);
        for (let i = 0; i < totalCodewordsNumber; i++){
            errorCorrectData[blockCount * i + blockIndex] = errorCorrectCodewords[i];
        }
    }
    return errorCorrectData;
}


function GetCodewords(content, errorCorrectLevel, version) {
    let encodingMode = GetEncodingMode(content);
    if (errorCorrectLevel == undefined || errorCorrectLevel == null){
        errorCorrectLevel = 2;
    }
    if (encodingMode === 5){
        content = GetUnicodeByteData(content);
        encodingMode = 4;
    }
    const minVersion = GetVersion(encodingMode, content.length, errorCorrectLevel);
    if (version == - 1){
        version = minVersion;
    }
    const contentLengthBits = GetContentLengthBits(encodingMode, version);
    const dataCodewordsNumber = GetDataCodewordsNumber(errorCorrectLevel, version);
    const [blockSize, blockCount] = errorCorrectBlock[errorCorrectLevel][version];
    const rawData = GetByteData(content, encodingMode, contentLengthBits, dataCodewordsNumber);
    const data = GetReorderData(rawData, blockCount);
    const errorCorrectData = GetErrorCorrectData(rawData, blockCount, blockSize);
    const codewords = GetCombineCodewords(data, errorCorrectData);
  
    return {
        codewords,
        version,
        errorCorrectLevel,
        encodingMode,
        dataCodewordsNumber,
        'errorCorrectCodewordsNumber': errorCorrectData.length,
        minVersion
    };
}




function PlaceVersionModules(matrix, version) {
    const size = matrix.length;
    const versionInfomation = GetVersionPolynomial(version);
    for (let i = 0; i < 18; i++){
        const row = Math.floor(i / 3);
        const column = i % 3;
        matrix[5 - row][size - 9 - column] = versionInfomation[i];
        matrix[size - 9 - column][5 - row] = versionInfomation[i];
    }
}

/*function getCodewords(content, minErrorLevel = 'L') {
    const encodingMode = getEncodingMode(content);
    const [version, errorLevel] = getVersionAndErrorLevel(
      encodingMode,
      content.length,
      minErrorLevel
    );
    const lengthBits = getLengthBits(encodingMode, version);
  
    const dataCodewords = getDataCodewords(version, errorLevel);
    const [ecBlockSize, blocks] = EC_TABLE[version - 1][errorLevel];
  
    const rawData = getData(content, lengthBits, dataCodewords);
    const data = reorderData(rawData, blocks);
    const ecData = getECData(rawData, blocks, ecBlockSize);
  
    const codewords = new Uint8Array(data.length + ecData.length);
    codewords.set(data, 0);
    codewords.set(ecData, data.length);
  
    return {
      codewords,
      version,
      errorLevel,
      encodingMode
    };
} */

//----------------------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------------------

const NUMERIC_RE = /^\d*$/;
const ALPHANUMERIC_RE = /^[\dA-Z $%*+\-./:]*$/;
const LATIN1_RE = /^[\x00-\xff]*$/;
const KANJI_RE = /^[\p{Script_Extensions=Han}\p{Script_Extensions=Hiragana}\p{Script_Extensions=Katakana}]*$/u;

const LENGTH_BITS = [
    [10, 12, 14],
    [9, 11, 13],
    [8, 16, 16],
    [8, 10, 12]
  ];
  function getLengthBits(mode, version) {
    // ECI mode folds into byte mode
    // Basically it's `Math.floor(Math.log2(mode))` but much faster
    // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/clz32
    const modeIndex = 31 - Math.clz32(mode);
    const bitsIndex = version > 26 ? 2 : version > 9 ? 1 : 0;
    return LENGTH_BITS[modeIndex][bitsIndex];
  }

function getSize(version){
    return 4 * version + 17;
}

function getEncodingMode(string) {
    if (NUMERIC_RE.test(string)) {
      return 0b0001;
    }
    if (ALPHANUMERIC_RE.test(string)) {
      return 0b0010;
    }
    if (LATIN1_RE.test(string)) {
      return 0b0100;
    }
    if (KANJI_RE.test(string)) {
      return 0b1000;
    }
    return 0b0111;
  }


function fillArea(matrix, row, column, width, height, fill = 1) {
    const fillRow = new Uint8Array(width).fill(fill);
    for (let index = row; index < row + height; index++) {
      // YES, this mutates the matrix. Watch out!
      matrix[index].set(fillRow, column);
    }
}


function getNewMatrix(version) {
    const length = getSize(version);
    return Array.from({ length }, () => new Uint8Array(length));
}

function getModuleSequence(version){
    const matrix = getNewMatrix(version);
    const size = getSize(version);

    // Finder patterns + divisors
    fillArea(matrix, 0, 0, 9, 9);
    fillArea(matrix, 0, size - 8, 8, 9);
    fillArea(matrix, size - 8, 0, 9, 8);
  // CHANGED PART in order to support multiple alignment patterns
  // Alignment patterns
  const alignmentTracks = getAlignmentCoordinates(version);
  const lastTrack = alignmentTracks.length - 1;
  alignmentTracks.forEach((row, rowIndex) => {
    alignmentTracks.forEach((column, columnIndex) => {
      // Skipping the alignment near the finder patterns
      if (rowIndex === 0 &&
        (columnIndex === 0 || columnIndex === lastTrack)
        || columnIndex === 0 && rowIndex === lastTrack) {
        return;
      }
      fillArea(matrix, row - 2, column - 2, 5, 5);
    });
  });
    // Timing patterns
    fillArea(matrix, 6, 9, version * 4, 1);
    fillArea(matrix, 9, 6, 1, version * 4);
    // Dark module
    matrix[size - 8][8] = 1;
// ADDED PART
  // Version info
  if (version > 6) {
    fillArea(matrix, 0, size - 11, 3, 6);
    fillArea(matrix, size - 11, 0, 6, 3);
  }
    let rowStep = -1;
    let row = size - 1;
    let column = size - 1;
    const sequence = [];
    let index = 0;
    while (column >= 0) {
        if (matrix[row][column] === 0) {
        sequence.push([row, column]);
        }
        // Checking the parity of the index of the current module
        if (index & 1) {
            row += rowStep;
            if (row === -1 || row === size) {
                rowStep = -rowStep;
                row += rowStep;
                column -= column === 7 ? 2 : 1;
            }
            else {
                column++;
            }
        }
        else {
            column--;
        }
        index++;
    }
    return sequence;
}

function getRawQRCode(message) {
    // One day, we'll compute these values. But not today!
    const VERSION = 2;
    const TOTAL_CODEWORDS = 44;
    const LENGTH_BITS = 8;
    const DATA_CODEWORDS = 28;
  
    const codewords = new Uint8Array(TOTAL_CODEWORDS);
    const byteData = getByteData(message, LENGTH_BITS, DATA_CODEWORDS);
    codewords.set(byteData, 0);
    codewords.set(getEDC(byteData, TOTAL_CODEWORDS), DATA_CODEWORDS);
  
    const size = getSize(VERSION);
    const qrCode = getNewMatrix(VERSION);
    const moduleSequence = getModuleSequence(VERSION);
  
    // Placing the fixed patterns
    // Finder patterns
    [[0, 0], [size - 7, 0], [0, size - 7]].forEach(([row, col]) => {
      fillArea(qrCode, row, col, 7, 7);
      fillArea(qrCode, row + 1, col + 1, 5, 5, 0);
      fillArea(qrCode, row + 2, col + 2, 3, 3);
    });
    // Separators
    fillArea(qrCode, 7, 0, 8, 1, 0);
    fillArea(qrCode, 0, 7, 1, 7, 0);
    fillArea(qrCode, size - 8, 0, 8, 1, 0);
    fillArea(qrCode, 0, size - 8, 1, 7, 0);
    fillArea(qrCode, 7, size - 8, 8, 1, 0);
    fillArea(qrCode, size - 7, 7, 1, 7, 0);
    // Alignment pattern
    fillArea(qrCode, size - 9, size - 9, 5, 5);
    fillArea(qrCode, size - 8, size - 8, 3, 3, 0);
    qrCode[size - 7][size - 7] = 1;
    // Timing patterns
    for (let pos = 8; pos < VERSION * 4 + 8; pos += 2) {
      qrCode[6][pos] = 1;
      qrCode[6][pos + 1] = 0;
      qrCode[pos][6] = 1;
      qrCode[pos + 1][6] = 0;
    }
    qrCode[6][size - 7] = 1;
    qrCode[size - 7][6] = 1;
    // Dark module
    qrCode[size - 8][8] = 1;
  
    // Placing message and error data
    let index = 0;
    for (const codeword of codewords) {
      // Counting down from the leftmost bit
      for (let shift = 7; shift >= 0; shift--) {
        const bit = (codeword >> shift) & 1;
        const [row, column] = moduleSequence[index];
        index++;
        qrCode[row][column] = bit;
      }
    }
    return qrCode;
  }

  const MASK_FNS = [
    (row, column) => ((row + column) & 1) === 0,
    (row, column) => (row & 1) === 0,
    (row, column) => column % 3 === 0,
    (row, column) => (row + column) % 3 === 0,
    (row, column) => (((row >> 1) + Math.floor(column / 3)) & 1) === 0,
    (row, column) => ((row * column) & 1) + ((row * column) % 3) === 0,
    (row, column) => ((((row * column) & 1) + ((row * column) % 3)) & 1) === 0,
    (row, column) => ((((row + column) & 1) + ((row * column) % 3)) & 1) === 0,
  ];

  function getMaskedMatrix(version, codewords, maskIndex) {
    const sequence = getModuleSequence(version);
    const matrix = getNewMatrix(version);
    sequence.forEach(([ row, column ], index) => {
      // Each codeword contains 8 modules, so shifting the index to the
      // right by 3 gives the codeword's index
      const codeword = codewords[index >> 3];
      const bitShift = 7 - (index & 7);
      const moduleBit = (codeword >> bitShift) & 1;
      matrix[row][column] = moduleBit ^ MASK_FNS[maskIndex](row, column);
    });
    return matrix;
  }

const formatPoly = new Uint8Array(15);
const EDC_ORDER = 'MLHQ';
const FORMAT_DIVISOR = new Uint8Array([1, 0, 1, 0, 0, 1, 1, 0, 1, 1, 1]);
const FORMAT_MASK = new Uint8Array([1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0]);

function getFormatModules(errorLevel, maskIndex) {
  const formatPoly = new Uint8Array(15);
  const errorLevelIndex = EDC_ORDER.indexOf(errorLevel);
  formatPoly[0] = errorLevelIndex >> 1;
  formatPoly[1] = errorLevelIndex & 1;
  formatPoly[2] = maskIndex >> 2;
  formatPoly[3] = (maskIndex >> 1) & 1;
  formatPoly[4] = maskIndex & 1;
  const rest = polyRest(formatPoly, FORMAT_DIVISOR);
  formatPoly.set(rest, 5);
  const maskedFormatPoly = formatPoly.map(
    (bit, index) => bit ^ FORMAT_MASK[index]
  );
  return maskedFormatPoly;
}

function placeFormatModules(matrix, errorLevel, maskIndex) {
    const formatModules = getFormatModules(errorLevel, maskIndex);
    matrix[8].set(formatModules.subarray(0, 6), 0);
    matrix[8].set(formatModules.subarray(6, 8), 7);
    matrix[8].set(formatModules.subarray(7), matrix.length - 8);
    matrix[7][8] = formatModules[8];
    formatModules.subarray(0, 7).forEach(
      (cell, index) => (matrix[matrix.length - index - 1][8] = cell)
    );
    formatModules.subarray(9).forEach(
      (cell, index) => (matrix[5 - index][8] = cell)
    );
}

function getMaskedQRCode(version, codewords, errorLevel, maskIndex) {
    const matrix = getMaskedMatrix(version, codewords, maskIndex);
    placeFormatModules(matrix, errorLevel, maskIndex);
    placeFixedPatterns(matrix);
    placeVersionModules(matrix);
    return matrix;
}
const VERSION_DIVISOR = new Uint8Array([1, 1, 1, 1, 1, 0, 0, 1, 0, 0, 1, 0, 1]);
function getVersionInformation(version) {
  // Using `Uint8Array.from` on a string feels kinda cheating... but it works!
  const poly = Uint8Array.from(version.toString(2).padStart(6, '0') + '000000000000');
  poly.set(polyRest(poly, VERSION_DIVISOR), 6);
  return poly;
}

function placeVersionModules(matrix) {
    const size = matrix.length;
    const version = (size - 17) >> 2;
    if (version < 7) {
      return;
    }
    getVersionInformation(version).forEach((bit, index) => {
      const row = Math.floor(index / 3);
      const col = index % 3;
      matrix[5 - row][size - 9 - col] = bit;
      matrix[size - 11 + col][row] = bit;
    });
  }

function getByteData(content, lengthBits, dataCodewords) {
    const data = new Uint8Array(dataCodewords);
    const rightShift = (4 + lengthBits) & 7;
    const leftShift = 8 - rightShift;
    const andMask = (1 << rightShift) - 1;
    const dataIndexStart = lengthBits > 12 ? 2 : 1;
  
    data[0] = 64 /* byte mode */ + (content.length >> (lengthBits - 4));
    if (lengthBits > 12) {
      data[1] = (content.length >> rightShift) & 255;
    }
    data[dataIndexStart] = (content.length & andMask) << leftShift;
  
    for (let index = 0; index < content.length; index++) {
      const byte = content.charCodeAt(index);
      data[index + dataIndexStart] |= byte >> rightShift;
      data[index + dataIndexStart + 1] = (byte & andMask) << leftShift;
    }
    const remaining = dataCodewords - content.length - dataIndexStart - 1;
    for (let index = 0; index < remaining; index++) {
      const byte = index & 1 ? 17 : 236;
      data[index + content.length + 2] = byte;
    }
    return data;
  }

function getEDC(data, codewords) {
    const degree = codewords - data.length;
    const messagePoly = new Uint8Array(codewords);
    messagePoly.set(data, 0);
    return polyRest(messagePoly, getGeneratorPoly(degree));
  }

  function getGeneratorPoly(degree) {
    let lastPoly = new Uint8Array([1]);
    for (let index = 0; index < degree; index++) {
      lastPoly = polyMul(lastPoly, new Uint8Array([1, EXP[index]]));
    }
    return lastPoly;
  }

  function polyMul(poly1, poly2) {
    // This is going to be the product polynomial, that we pre-allocate.
    // We know it's going to be `poly1.length + poly2.length - 1` long.
    const coeffs = new Uint8Array(poly1.length + poly2.length - 1);
  
    // Instead of executing all the steps in the example, we can jump to
    // computing the coefficients of the result
    for (let index = 0; index < coeffs.length; index++) {
      let coeff = 0;
      for (let p1index = 0; p1index <= index; p1index++) {
        const p2index = index - p1index;
        // We *should* do better here, as `p1index` and `p2index` could
        // be out of range, but `mul` defined above will handle that case.
        // Just beware of that when implementing in other languages.
        coeff ^= mul(poly1[p1index], poly2[p2index]);
      }
      coeffs[index] = coeff;
    }
    return coeffs;
  }
  
  
function polyRest(dividend, divisor) {
    const quotientLength = dividend.length - divisor.length + 1;
    // Let's just say that the dividend is the rest right away
    let rest = new Uint8Array(dividend);
    for (let count = 0; count < quotientLength; count++) {
      // If the first term is 0, we can just skip this iteration
      if (rest[0]) {
        const factor = div(rest[0], divisor[0]);
        const subtr = new Uint8Array(rest.length);
        subtr.set(polyMul(divisor, [factor]), 0);
        rest = rest.map((value, index) => value ^ subtr[index]).slice(1);
      } else {
        rest = rest.slice(1);
      }
    }
    return rest;
}

function mul(a, b) {
    return a && b ? EXP[(LOG[a] + LOG[b]) % 255] : 0;
}

function div(a, b) {
    return EXP[(LOG[a] + LOG[b] * 254) % 255];
}

function placeFixedPatterns(matrix) {
    const size = matrix.length;
    const version = (size - 17) / 4;
    // Finder patterns
    [[0, 0], [size - 7, 0], [0, size - 7]].forEach(([row, col]) => {
      fillArea(matrix, row, col, 7, 7);
      fillArea(matrix, row + 1, col + 1, 5, 5, 0);
      fillArea(matrix, row + 2, col + 2, 3, 3);
    });
    // Separators
    fillArea(matrix, 7, 0, 8, 1, 0);
    fillArea(matrix, 0, 7, 1, 7, 0);
    fillArea(matrix, size - 8, 0, 8, 1, 0);
    fillArea(matrix, 0, size - 8, 1, 7, 0);
    fillArea(matrix, 7, size - 8, 8, 1, 0);
    fillArea(matrix, size - 7, 7, 1, 7, 0);
    // Alignment pattern
    const alignmentTracks = getAlignmentCoordinates(version);
  const lastTrack = alignmentTracks.length - 1;
  alignmentTracks.forEach((row, rowIndex) => {
    alignmentTracks.forEach((column, columnIndex) => {
      // Skipping the alignment near the finder patterns
      if (rowIndex === 0 &&
        (columnIndex === 0 || columnIndex === lastTrack )
        || columnIndex === 0 && rowIndex === lastTrack) {
        return;
      }
      fillArea(matrix, row - 2, column - 2, 5, 5);
      fillArea(matrix, row - 1, column - 1, 3, 3, 0);
      matrix[row][column] = 1;
    });
  });
    matrix[size - 7][size - 7] = 1;
    // Timing patterns
    for (let pos = 8; pos <= size - 9; pos += 2) {
      matrix[6][pos] = 1;
      matrix[6][pos + 1] = 0;
      matrix[pos][6] = 1;
      matrix[pos + 1][6] = 0;
    }
    matrix[6][size - 7] = 1;
    matrix[size - 7][6] = 1;
    // Dark module
    matrix[size - 8][8] = 1;
}

function getOptimalMask(version, codewords, errorLevel) {
    let bestMatrix;
    let bestScore = Infinity;
    let bestMask = -1;

    for (let index = 0; index < 8; index++) {
      const matrix = getMaskedQRCode(version, codewords, errorLevel, index);
      const penaltyScore = getPenaltyScore(matrix);

      if (penaltyScore < bestScore) {
        bestScore = penaltyScore;
        bestMatrix = matrix;
        bestMask = index;
      }
    }
    return [bestMatrix, bestMask];
}

function getPenaltyScore(matrix) {
    let totalPenalty = 0;
  
    // Rule 1
    const rowPenalty = matrix.reduce(
      (sum, row) => sum + getLinePenalty(row)
    , 0);
    totalPenalty += rowPenalty;
  
    const columnPenalty = matrix.reduce((sum, _, columnIndex) => {
      const column = matrix.map(row => row[columnIndex]);
      return sum + getLinePenalty(column);
    }, 0);
    totalPenalty += columnPenalty;

    // Rule 2
    let blocks = 0;
    const size = matrix.length
    for (let row = 0; row < size - 1; row++) {
      for (let column = 0; column < size - 1; column++) {
        const module = matrix[row][column];
        if (
          matrix[row][column + 1] === module &&
          matrix[row + 1][column] === module &&
          matrix[row + 1][column + 1] === module
        ) {
          blocks++;
        }
      }
    }
    totalPenalty += blocks * 3;

    // Rule 3
    let patterns = 0;
    for (let index = 0; index < size; index++) {
      const row = matrix[index];
      for (let columnIndex = 0; columnIndex < size - 10; columnIndex++) {
        if ([RULE_3_PATTERN, RULE_3_REVERSED_PATTERN].some(
          pattern => pattern.every(
            (cell, ptr) => cell === row[columnIndex + ptr]
          )
        )) {
          patterns++;
        }
      }
      for (let rowIndex = 0; rowIndex < size - 10; rowIndex++) {
        if ([RULE_3_PATTERN, RULE_3_REVERSED_PATTERN].some(
          pattern => pattern.every(
            (cell, ptr) => cell === matrix[rowIndex + ptr][index]
          )
        )) {
          patterns++;
        }
      }
    }
    totalPenalty += patterns * 40;

    // Rule 4
    const totalModules = size * size;
    const darkModules = matrix.reduce(
      (sum, line) => sum + line.reduce(
        (lineSum, cell) => lineSum + cell
      , 0)
    , 0);
    const percentage = darkModules * 100 / totalModules;
    const mixPenalty = Math.abs(Math.trunc(percentage / 5 - 10)) * 10;
  
    return totalPenalty + mixPenalty;
}

const RULE_3_PATTERN = new Uint8Array([1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0]);
const RULE_3_REVERSED_PATTERN = RULE_3_PATTERN.slice().reverse();

function getLinePenalty(line) {
  let count = 0;
  let counting = 0;
  let penalty = 0;
  for (const cell of line) {
    if (cell !== counting) {
      counting = cell;
      count = 1;
    } else {
      count++;
      if (count === 5) {
        penalty += 3;
      } else if (count > 5) {
        penalty++;
      }
    }
  }
  return penalty;
}


function getDataCodewordsNumber(errorCorrectLevel, version){

    return codewordsNumber['MLHQ'.indexOf(errorCorrectLevel)][0][version - 1];
}

function getErrorCodewordsNumber(errorCorrectLevel, version){
    return codewordsNumber['MLHQ'.indexOf(errorCorrectLevel)][1][version - 1];
}


function* getByteValues(content) {
    for (const char of content) {
      yield {
        value: char.charCodeAt(0),
        bitLength: 8
      };
    }
}


const BIT_WIDTHS = [0, 4, 7, 10];

function* getNumericValues(content) {
  for (let index = 0; index < content.length; index += 3) {
    const chunk = content.substr(index, 3);
    const bitLength = BIT_WIDTHS[chunk.length];
    const value = parseInt(chunk, 10);
    yield { value, bitLength };
  }
}

const ALPHACHAR_MAP = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:';
function* getAlphanumericValues(content) {
  for (let index = 0; index < content.length; index += 2) {
    const chunk = content.substr(index, 2);
    const bitLength = chunk.length === 1 ? 6 : 11;
    const codes = chunk.split('').map(
      char => ALPHACHAR_MAP.indexOf(char)
    );
    const value = chunk.length === 1
      ? codes[0]
      : codes[0] * ALPHACHAR_MAP.length + codes[1];
    yield { value, bitLength };
  }
}

function getShiftJISCode(char){
    return 0xfc4b;
}

function* getKanjiValues(content) {
    for (const char of content) {
      const code = getShiftJISCode(char);
      const reduced = code - (code >= 0xe040 ? 0xc140 : 0x8140);
      const value = (reduced >> 8) * 192 + (reduced & 255);
      yield { value, bitLength: 13 };
    }
}

  function putBits(buffer, value, bitLength, offset) {
    const byteStart = offset >> 3;
    const byteEnd = (offset + bitLength - 1) >> 3;
    let remainingBits = bitLength;
    for (let index = byteStart; index <= byteEnd; index++) {
      const availableBits = index === byteStart ? 8 - (offset & 7) : 8;
      const bitMask = (1 << availableBits) - 1;
      const rightShift = Math.max(0, remainingBits - availableBits);
      const leftShift = Math.max(0, availableBits - remainingBits);
      // chunk might get over 255, but it won't fit a Uint8 anyway, so no
      // problem here. Watch out using other languages or data structures!
      const chunk = ((value >> rightShift) & bitMask) << leftShift;
      buffer[index] |= chunk;
      remainingBits -= availableBits;
    }
}

const valueGenMap = {
    [0b0001]: getNumericValues,
    [0b0010]: getAlphanumericValues,
    [0b0100]: getByteValues,
    [0b1000]: getKanjiValues
}

function getData(content, lengthBits, dataCodewords) {
    const encodingMode = GetEncodingMode(content);
    let offset = 4 + lengthBits;
    const data = new Uint8Array(dataCodewords);
    putBits(data, encodingMode, 4, 0);
    putBits(data, content.length, lengthBits, 4);
    const dataGenerator = valueGenMap[encodingMode];
    for (const { value, bitLength } of dataGenerator(content)) {
      putBits(data, value, bitLength, offset);
      offset += bitLength;
    }
    const remainderBits = 8 - (offset & 7);
    const fillerStart = (offset >> 3) + (remainderBits < 4 ? 2 : 1);
    for (let index = 0; index < dataCodewords - fillerStart; index++) {
      const byte = index & 1 ? 17 : 236;
      data[fillerStart + index] = byte;
    }
    return data;
}

function getAlignmentCoordinates(version) {
    if (version === 1) {
      return [];
    }
    const intervals = Math.floor(version / 7) + 1;
    const distance = 4 * version + 4; // between first and last pattern
    const step = Math.ceil(distance / intervals / 2) * 2;
    return [6].concat(Array.from(
      { length: intervals },
      (_, index) => distance + 6 - (intervals - 1 - index) * step)
    );
  }

function getAvailableModules(version) {
    if (version === 1) {
      return 21 * 21 - 3 * 8 * 8 - 2 * 15 - 1 - 2 * 5;
    }
    const alignmentCount = Math.floor(version / 7) + 2;
    return (version * 4 + 17) ** 2
      - 3 * 8 * 8
      - (alignmentCount ** 2 - 3) * 5 * 5
      - 2 * (version * 4 + 1)
      + (alignmentCount - 2) * 5 * 2
      - 2 * 15
      - 1
      - (version > 6 ? 2 * 3 * 6 : 0);
}


const EC_TABLE = [
    { L: [7, 1],   M: [10, 1],  Q: [13, 1],  H: [17, 1] },
    { L: [10, 1],  M: [16, 1],  Q: [22, 1],  H: [28, 1] },
    { L: [15, 1],  M: [26, 1],  Q: [18, 2],  H: [22, 2] },
    { L: [20, 1],  M: [18, 2],  Q: [26, 2],  H: [16, 4] },
    { L: [26, 1],  M: [24, 2],  Q: [18, 4],  H: [22, 4] },
    { L: [18, 2],  M: [16, 4],  Q: [24, 4],  H: [28, 4] },
    { L: [20, 2],  M: [18, 4],  Q: [18, 6],  H: [26, 5] },
    { L: [24, 2],  M: [22, 4],  Q: [22, 6],  H: [26, 6] },
    { L: [30, 2],  M: [22, 5],  Q: [20, 8],  H: [24, 8] },
    { L: [18, 4],  M: [26, 5],  Q: [24, 8],  H: [28, 8] },
    { L: [20, 4],  M: [30, 5],  Q: [28, 8],  H: [24, 11] },
    { L: [24, 4],  M: [22, 8],  Q: [26, 10], H: [28, 11] },
    { L: [26, 4],  M: [22, 9],  Q: [24, 12], H: [22, 16] },
    { L: [30, 4],  M: [24, 9],  Q: [20, 16], H: [24, 16] },
    { L: [22, 6],  M: [24, 10], Q: [30, 12], H: [24, 18] },
    { L: [24, 6],  M: [28, 10], Q: [24, 17], H: [30, 16] },
    { L: [28, 6],  M: [28, 11], Q: [28, 16], H: [28, 19] },
    { L: [30, 6],  M: [26, 13], Q: [28, 18], H: [28, 21] },
    { L: [28, 7],  M: [26, 14], Q: [26, 21], H: [26, 25] },
    { L: [28, 8],  M: [26, 16], Q: [30, 20], H: [28, 25] },
    { L: [28, 8],  M: [26, 17], Q: [28, 23], H: [30, 25] },
    { L: [28, 9],  M: [28, 17], Q: [30, 23], H: [24, 34] },
    { L: [30, 9],  M: [28, 18], Q: [30, 25], H: [30, 30] },
    { L: [30, 10], M: [28, 20], Q: [30, 27], H: [30, 32] },
    { L: [26, 12], M: [28, 21], Q: [30, 29], H: [30, 35] },
    { L: [28, 12], M: [28, 23], Q: [28, 34], H: [30, 37] },
    { L: [30, 12], M: [28, 25], Q: [30, 34], H: [30, 40] },
    { L: [30, 13], M: [28, 26], Q: [30, 35], H: [30, 42] },
    { L: [30, 14], M: [28, 28], Q: [30, 38], H: [30, 45] },
    { L: [30, 15], M: [28, 29], Q: [30, 40], H: [30, 48] },
    { L: [30, 16], M: [28, 31], Q: [30, 43], H: [30, 51] },
    { L: [30, 17], M: [28, 33], Q: [30, 45], H: [30, 54] },
    { L: [30, 18], M: [28, 35], Q: [30, 48], H: [30, 57] },
    { L: [30, 19], M: [28, 37], Q: [30, 51], H: [30, 60] },
    { L: [30, 19], M: [28, 38], Q: [30, 53], H: [30, 63] },
    { L: [30, 20], M: [28, 40], Q: [30, 56], H: [30, 66] },
    { L: [30, 21], M: [28, 43], Q: [30, 59], H: [30, 70] },
    { L: [30, 22], M: [28, 45], Q: [30, 62], H: [30, 74] },
    { L: [30, 24], M: [28, 47], Q: [30, 65], H: [30, 77] },
    { L: [30, 25], M: [28, 49], Q: [30, 68], H: [30, 81] }
];
  
function getDataCodewords(version, errorLevel) {
    const totalCodewords = getAvailableModules(version) >> 3;
    const [blocks, ecBlockSize] = EC_TABLE[version - 1][errorLevel];
    return totalCodewords - blocks * ecBlockSize;
}

const capacityFnMap = {
    [0b0001]: getNumericCapacity,
    [0b0010]: getAlphanumericCapacity,
    [0b0100]: getByteCapacity,
    [0b1000]: getKanjiCapacity
};

function getNumericCapacity(availableBits) {
    const remainderBits = availableBits % 10;
    return Math.floor(availableBits / 10) * 3 + (remainderBits > 6 ? 2 : remainderBits > 3 ? 1 : 0);
}

function getAlphanumericCapacity(availableBits) {
    return Math.floor(availableBits / 11) * 2 + (availableBits % 11 > 5 ? 1 : 0);
}

function getByteCapacity(availableBits) {
    return availableBits >> 3;
}

function getKanjiCapacity(availableBits) {
    return Math.floor(availableBits / 13);
}
function getCapacity(version, errorLevel, encodingMode) {
    const dataCodewords = getDataCodewords(version, errorLevel);
    const lengthBits = getLengthBits(encodingMode, version);
    const availableBits = (dataCodewords << 3) - lengthBits - 4;
    return capacityFnMap[encodingMode](availableBits);
}

function getVersionAndErrorLevel(encodingMode, contentLength, minErrorLevel = 'L') {
    // The error levels we're going to consider
    const errorLevels = 'HQML'.slice(0, 'HQML'.indexOf(minErrorLevel) + 1);
    for (let version = 1; version <= 40; version++) {
      // You can iterate over strings in JavaScript 😁
      for (const errorLevel of errorLevels) {
        const capacity = getCapacity(version, errorLevel, encodingMode);
        if (capacity >= contentLength) {
          return [version, errorLevel];
        }
      }
    }
}

function reorderData(data, blocks) {
    /** Codewords in data blocks (in group 1) */
    const blockSize = Math.floor(data.length / blocks);
    /** Blocks in group 1 */
    const group1 = blocks - data.length % blocks;
    /** Starting index of each block inside `data` */
    const blockStartIndexes = Array.from(
      { length: blocks },
      (_, index) => index < group1
        ? blockSize * index
        : (blockSize + 1) * index - group1
    );
    return Uint8Array.from(data, (_, index) => {
      /** Index of the codeword inside the block */
      const blockOffset = Math.floor(index / blocks);
      /** Index of the block to take the codeword from
        If we're at the end (`blockOffset === blockSize`), then we take
        only from the blocks of group 2 */
      const blockIndex = (index % blocks)
        + (blockOffset === blockSize ? group1 : 0);
      /** Index of the codeword inside `data` */
      const codewordIndex = blockStartIndexes[blockIndex] + blockOffset;
      return data[codewordIndex];
    });
}

function getECData(data, blocks, ecBlockSize) {
    /** Codewords in data blocks (in group 1) */
    const dataBlockSize = Math.floor(data.length / blocks);
    /** Blocks in group 1 */
    const group1 = blocks - data.length % blocks;
    const ecData = new Uint8Array(ecBlockSize * blocks);
    for (let offset = 0; offset < blocks; offset++) {
      const start = offset < group1
        ? dataBlockSize * offset
        : (dataBlockSize + 1) * offset - group1;
      const end = start + dataBlockSize + (offset < group1 ? 0 : 1);
      const dataBlock = data.subarray(start, end);
      const ecCodewords = getEDC(dataBlock, dataBlock.length + ecBlockSize);
      // Interleaving the EC codewords: we place one every `blocks`
      ecCodewords.forEach((codeword, index) => {
        ecData[index * blocks + offset] = codeword;
      });
    }
    return ecData;
}

function getCodewords(content, minErrorLevel = 'L', version) {
    const encodingMode = getEncodingMode(content);
    const [minVersion, errorLevel] = getVersionAndErrorLevel(
      encodingMode,
      content.length,
      minErrorLevel
    );
    if (version === -1){
        version = minVersion
    }
    const lengthBits = getLengthBits(encodingMode, version);
  
    const dataCodewords = getDataCodewords(version, errorLevel);
    const [ecBlockSize, blocks] = EC_TABLE[version - 1][errorLevel];
  
    const rawData = getData(content, lengthBits, dataCodewords);
    const data = reorderData(rawData, blocks);
    const ecData = getECData(rawData, blocks, ecBlockSize);
  
    const codewords = new Uint8Array(data.length + ecData.length);
    codewords.set(data, 0);
    codewords.set(ecData, data.length);
  
    return {
      codewords,
      version,
      errorLevel,
      encodingMode,
      minVersion
    };
}
