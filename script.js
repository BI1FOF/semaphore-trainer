// ===== 常量定义 =====
// 手臂旋转角度常量
const RBOTTOM = -5;
const LBOTTOM = 5;
const A = 45;
const B = 95;
const C = 140;
const RD = 185;
const LD = -185;
const E = -140;
const F = -95;
const G = -45;

// 特殊符号序列常量
const rotations = {
    ' ': { right: RBOTTOM, left: LBOTTOM },
    'A': { right: A, left: LBOTTOM },
    'B': { right: B, left: LBOTTOM },
    'C': { right: C, left: LBOTTOM },
    'D': { right: RD, left: LBOTTOM },
    'LD': { right: RBOTTOM, left: LD },
    'E': { right: RBOTTOM, left: E },
    'F': { right: RBOTTOM, left: F },
    'G': { right: RBOTTOM, left: G },
    'H': { right: B, left: A },
    'I': { right: C, left: A },
    'J': { right: RD, left: F },
    'K': { right: A, left: LD },
    'L': { right: A, left: E },
    'M': { right: A, left: F },
    'N': { right: A, left: G },
    'O': { right: C, left: B },
    'P': { right: B, left: LD },
    'Q': { right: B, left: E },
    'R': { right: B, left: F },
    'S': { right: B, left: G },
    'T': { right: C, left: LD },
    'U': { right: C, left: E },
    'V': { right: RD, left: G },
    '@': { right: RD, left: E },
    'W': { right: F, left: E },
    'X': { right: G, left: E },
    'Y': { right: C, left: F },
    'Z': { right: G, left: F },
    "'": { right: RD, left: LD }
};

// 特殊指令序列
const specialSymbols = {
    '[CALL]': ['R', "'", 'R', "'"],
    '[END]': ['D', 'LD', 'D', 'LD']
};

// 随机报文常量
const MIN_GROUP_COUNT = 1;            // 最少乱码组数
const MAX_GROUP_COUNT = 50;           // 最多乱码组数
const DEFAULT_GROUP_COUNT = 5;        // 默认乱码组数
const MIN_GROUP_LENGTH = 3;           // 每组最少字符数
const MAX_GROUP_LENGTH = 6;           // 每组最多字符数
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUV@WXYZ'; // 字符集

// 码速常量
const DEFAULT_CODE_SPEED = 60;         // 默认码速
const MIN_CODE_SPEED = 30;             // 最小码速
const MAX_CODE_SPEED = 100;            // 最大码速

// 动画时间因子
const SPECIAL_CHAR_INTERVAL_FACTOR = 1/3;   // 特殊符号内部字符间时间因子
const SPECIAL_SYMBOL_DURATION_FACTOR = 1.67; // 特殊符号整体时间因子
const SAME_SIGNAL_REST_FACTOR = 1/3;         // 相同字符中间的休息时间因子
const SAME_SIGNAL_DURATION_FACTOR = 1.33;    // 相同字符的总时间因子

// ===== 获取DOM元素 =====
const inputText = document.getElementById('inputText');
const playButton = document.getElementById('playButton');
const resetButton = document.getElementById('resetButton');
const speedValue = document.getElementById('speedValue');
const statusValue = document.getElementById('statusValue');
const callButton = document.getElementById('callButton');
const endButton = document.getElementById('endButton');
const randomButton = document.getElementById('randomButton');
const randomDialog = document.getElementById('randomDialog');
const decreaseBtn = document.getElementById('decreaseBtn');
const increaseBtn = document.getElementById('increaseBtn');
const groupCount = document.getElementById('groupCount');
const letterBtn = document.getElementById('letterBtn');
const cancelBtn = document.getElementById('cancelBtn');
const settingsButton = document.getElementById('settingsButton');
const settingsDialog = document.getElementById('settingsDialog');
const speedDecreaseBtn = document.getElementById('speedDecreaseBtn');
const speedIncreaseBtn = document.getElementById('speedIncreaseBtn');
const speedInput = document.getElementById('speedInput');
const settingsConfirmBtn = document.getElementById('settingsConfirmBtn');
const settingsCancelBtn = document.getElementById('settingsCancelBtn');
const notification = document.getElementById('notification');

// ===== 全局状态变量 =====
let animationSequence = [];           // 动画序列
let animationTimer = null;            // 动画定时器
let isAnimationPlaying = false;       // 动画播放状态
let codeSpeed = DEFAULT_CODE_SPEED;   // 当前码速 (使用常量初始化)
let letterDuration= 60*1000/codeSpeed //字符时间间隔
let wakeLock = null;                  // 屏幕唤醒锁

// ===== 功能函数 =====

/**
 * 更新状态显示
 * @param {string} status - 状态文本
 */
function updateStatus(status) {
    statusValue.textContent = status;
}

/**
 * 更新码速显示
 */
function updateSpeedDisplay() {
    speedValue.textContent = codeSpeed;
}

/**
 * 计算字母显示时间（毫秒）基于码速
 * @returns {number} 字母显示时间
 */
function calculateLetterDuration() {
    return 1000 * (60 / codeSpeed);
}

/**
 * 验证输入文本
 * @returns {string|null} 验证后的输入文本
 */
function validateInput() {
    const text = inputText.value.trim().toUpperCase();
    return text || null;
}

/**
 * 验证整数输入
 * @param {HTMLInputElement} inputElement - 输入元素
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @param {number} defaultValue - 默认值
 */
function validateInt(inputElement, min, max, defaultValue) {
    let value = parseInt(inputElement.value);
    
    if (isNaN(value)) {
        inputElement.value = defaultValue;
    } else if (value < min) {
        inputElement.value = min;
    } else if (value > max) {
        inputElement.value = max;
    }
}

/**
 * 请求屏幕唤醒锁
 */
async function requestWakeLock() {
    try {
        if ('wakeLock' in navigator) {
            wakeLock = await navigator.wakeLock.request('screen');
            wakeLock.addEventListener('release', () => {
                console.log('屏幕唤醒锁已释放');
            });
        }
    } catch (err) {
        console.error(`无法获取屏幕唤醒锁: ${err.message}`);
    }
}

/**
 * 释放屏幕唤醒锁
 */
function releaseWakeLock() {
    if (wakeLock !== null) {
        wakeLock.release();
        wakeLock = null;
    }
}

/**
 * 设置手旗姿势
 * @param {string} signal - 信号字母
 */
function setSignalPose(signal) {
    const pose = rotations[signal] || rotations[' '];
    document.documentElement.style.setProperty('--left-arm-rotation', `${pose.left}deg`);
    document.documentElement.style.setProperty('--right-arm-rotation', `${pose.right}deg`);
}

/**
 * 插入勤务符号
 * @param {string} symbol - 勤务符号
 */
function insertSpecialSymbol(symbol) {
    const cursorPos = inputText.selectionStart;
    const text = inputText.value;
    
    let newText = '';
    let newCursorPos = cursorPos;
    
    if (symbol === '[CALL]') {
        newText = text.substring(0, cursorPos) + '[CALL]' + text.substring(cursorPos);
        newCursorPos = cursorPos + 6;
        if (newText[newCursorPos] !== ' ') {
            newText = newText.substring(0, newCursorPos) + ' ' + newText.substring(newCursorPos);
            newCursorPos++;
        }
    } else if (symbol === '[END]') {
        let prefix = '';
        if (cursorPos > 0 && text[cursorPos - 1] !== ' ') {
            prefix = ' ';
        }
        newText = text.substring(0, cursorPos) + prefix + '[END]' + text.substring(cursorPos);
        newCursorPos = cursorPos + prefix.length + 5;
    }
    
    inputText.value = newText;
    inputText.focus();
    inputText.setSelectionRange(newCursorPos, newCursorPos);
}

/**
 * 生成动画序列
 * @param {string} text - 输入文本
 * @returns {Array} 生成的动画序列
 */
function generateAnimation(text) {
    const sequence = [];
    let i = 0;
    
    while (i < text.length) {
        if (text[i] === '[') {
            const endIndex = text.indexOf(']', i);
            if (endIndex !== -1) {
                const symbol = text.substring(i, endIndex + 1);
                sequence.push(symbol);
                i = endIndex + 1;
                continue;
            }
        }
        
        sequence.push(text[i]);
        i++;
    }
    
    return sequence;
}        

/**
 * 播放特殊符号动画
 * @param {string} specialSignal - 特殊符号名称
 */
function playSpecialSymbol(specialSignal) {
    let specialSequence = specialSymbols[specialSignal];
    let index = 0;
        
    function processNext() {
        if (index >= specialSequence.length) {
            setSignalPose(' ');
            return;
        }
        
        const signal = specialSequence[index++];
        setSignalPose(signal);
        animationTimer = setTimeout(processNext, letterDuration * SPECIAL_CHAR_INTERVAL_FACTOR);
    }
    
    processNext();
}

/**
 * 播放动画序列
 */
function playAnimation() {
    if (isAnimationPlaying || !animationSequence.length) return;
    
    isAnimationPlaying = true;
    playButton.textContent = '停止';
    playButton.classList.add('playing');
    inputText.disabled = true;
    updateStatus('播放中...');
    letterDuration = calculateLetterDuration();
    let index = 0;
        
    function processNext() {
        if (index >= animationSequence.length) {
            setSignalPose(' ');
            isAnimationPlaying = false;
            playButton.textContent = '播放';
            playButton.classList.remove('playing');
            inputText.disabled = false;
            updateStatus('就绪');
            return;
        }
        
        const signal = animationSequence[index];
        
        if (signal ==='[CALL]' || signal ==='[END]') {
            playSpecialSymbol(signal);
            animationTimer = setTimeout(processNext, letterDuration * SPECIAL_SYMBOL_DURATION_FACTOR);
        } else {
            if (index > 0 && signal === animationSequence[index-1]) {
                setSignalPose(' ');
                animationTimer = setTimeout(() => {
                    setSignalPose(signal);
                    animationTimer = setTimeout(processNext, letterDuration * SAME_SIGNAL_DURATION_FACTOR);
                }, letterDuration * SAME_SIGNAL_REST_FACTOR);
            } else {
                setSignalPose(signal);
                animationTimer = setTimeout(processNext, letterDuration);
            }
        }
        index++;
    }

    processNext();
}

/**
 * 生成字码
 * @param {number} length - 生成长度
 * @returns {string} 随机字母字符串
 */
function generateRandomLetters(length) {
    let result = '';
    for (let i = 0; i < length; i++) {
        result += LETTERS.charAt(Math.floor(Math.random() * LETTERS.length));
    }
    return result;
}

/**
 * 生成乱码组
 * @returns {string} 生成的随机报文
 */
function generateRandomGroups() {
    const count = parseInt(groupCount.value);
    let result = '[CALL] ';
    
    for (let i = 0; i < count; i++) {
        const groupLength = Math.floor(Math.random() * (MAX_GROUP_LENGTH - MIN_GROUP_LENGTH + 1)) + MIN_GROUP_LENGTH;
        let group = generateRandomLetters(groupLength);
        result += group + ' ';
    }
    
    return result.trim() + ' [END]';
}

/**
 * 插入乱码组
 */
function insertRandomGroups() {
    const randomGroups = generateRandomGroups();
    inputText.value = randomGroups;
    inputText.focus();
    inputText.setSelectionRange(randomGroups.length, randomGroups.length);
    randomDialog.style.display = 'none';
    inputText.blur();
}

// ===== 事件监听器 =====

// 当页面再次可见时重新请求唤醒锁
document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'visible' && isAnimationPlaying) {
        await requestWakeLock();
    }
});

// 播放按钮点击事件
playButton.addEventListener('click', function() {
    if (isAnimationPlaying) {
        clearTimeout(animationTimer);
        isAnimationPlaying = false;
        this.textContent = '播放';
        this.classList.remove('playing');
        inputText.disabled = false;
        setSignalPose(' ');
        updateStatus('已停止');
        return;
    }
    
    const text = validateInput();
    if (!text) {
        return;
    }
    
    animationSequence = generateAnimation(text);
    setSignalPose(animationSequence[0]);
    playAnimation();
});

// 清空按钮点击事件
resetButton.addEventListener('click', function() {
    clearTimeout(animationTimer);
    isAnimationPlaying = false;
    playButton.textContent = '播放';
    playButton.classList.remove('playing');
    inputText.disabled = false;
    inputText.value = '';
    inputText.focus();
    setSignalPose(' ');
    updateStatus('就绪');
});

// 勤务符号按钮事件
callButton.addEventListener('click', () => insertSpecialSymbol('[CALL]'));
endButton.addEventListener('click', () => {
    insertSpecialSymbol('[END]');
    inputText.blur();
});

// 乱码对话框控制
randomButton.addEventListener('click', () => randomDialog.style.display = 'flex');
cancelBtn.addEventListener('click', () => randomDialog.style.display = 'none');

// 乱码组数控制
decreaseBtn.addEventListener('click', function() {
    groupCount.value = Math.max(parseInt(groupCount.value) - 1, MIN_GROUP_COUNT);
    validateInt(groupCount, MIN_GROUP_COUNT, MAX_GROUP_COUNT, DEFAULT_GROUP_COUNT);
});

increaseBtn.addEventListener('click', function() {
    groupCount.value = Math.min(parseInt(groupCount.value) + 1, MAX_GROUP_COUNT);
    validateInt(groupCount, MIN_GROUP_COUNT, MAX_GROUP_COUNT, DEFAULT_GROUP_COUNT);
});

// 乱码组数范围验证
groupCount.addEventListener('blur', () => {
    validateInt(groupCount, MIN_GROUP_COUNT, MAX_GROUP_COUNT, DEFAULT_GROUP_COUNT);
});

// 乱码生成按钮事件
letterBtn.addEventListener('click', insertRandomGroups);

// 码速设置功能
// 打开码速设置对话框
settingsButton.addEventListener('click', () => {
    speedInput.value = codeSpeed;
    settingsDialog.style.display = 'flex';
});

// 码速减按钮
speedDecreaseBtn.addEventListener('click', () => {
    speedInput.value = Math.max(parseInt(speedInput.value) - 1, MIN_CODE_SPEED);
    validateInt(speedInput, MIN_CODE_SPEED, MAX_CODE_SPEED, DEFAULT_CODE_SPEED);
});

// 码速加按钮
speedIncreaseBtn.addEventListener('click', () => {
    speedInput.value = Math.min(parseInt(speedInput.value) + 1, MAX_CODE_SPEED);
    validateInt(speedInput, MIN_CODE_SPEED, MAX_CODE_SPEED, DEFAULT_CODE_SPEED);
});

// 码速范围验证
speedInput.addEventListener('blur', () => {
    validateInt(speedInput, MIN_CODE_SPEED, MAX_CODE_SPEED, DEFAULT_CODE_SPEED);
});

// 设置确认按钮
settingsConfirmBtn.addEventListener('click', () => {
    const newSpeed = parseInt(speedInput.value);
    validateInt(speedInput, MIN_CODE_SPEED, MAX_CODE_SPEED, DEFAULT_CODE_SPEED);
    
    if (isAnimationPlaying) {
        // 如果动画正在播放就停止
        clearTimeout(animationTimer);
        isAnimationPlaying = false;
        playButton.textContent = '播放';
        playButton.classList.remove('playing');
        inputText.disabled = false;
        updateStatus('已停止');
    }
    
    codeSpeed = parseInt(speedInput.value);
    updateSpeedDisplay();
    settingsDialog.style.display = 'none';
});

// 设置取消按钮
settingsCancelBtn.addEventListener('click', () => {
    settingsDialog.style.display = 'none';
});

// 页面关闭前清理资源
window.addEventListener('beforeunload', () => {
    clearTimeout(animationTimer);
    releaseWakeLock();
});

// ===== 初始化 =====
updateSpeedDisplay();
updateStatus('就绪');
setSignalPose(' ');

// 页面加载时请求屏幕唤醒锁
if ('wakeLock' in navigator) {
    requestWakeLock();
}
