// 初始化：自动给所有代码块加复制按钮 + 单击选中
document.addEventListener('DOMContentLoaded', function () {
    // 单击代码块 → 选中
    document.querySelectorAll('.cmd-code').forEach(block => {
        block.addEventListener('click', function (e) {
            if (e.target.classList.contains('copy-btn')) return;
            selectText(this);
        });
    });

    // 添加复制按钮
    document.querySelectorAll('.cmd-code').forEach(el => {
        const btn = document.createElement('button');
        btn.className = 'copy-btn';
        btn.textContent = '复制';

        btn.onclick = () => {
            selectText(el);
            const text = el.childNodes[0].nodeValue.trim();
            navigator.clipboard.writeText(text);
            btn.textContent = '已复制';
            setTimeout(() => btn.textContent = '复制', 2000);
        };
        el.appendChild(btn);
    });
});

// 选中文字
function selectText(el) {
    const range = document.createRange();
    range.selectNodeContents(el.childNodes[0]);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
}
function goBackHome() {
    try {
        window.location.href = '../index.html';
    } catch (e) {}
}

function createCmdItem(titleText, codeText) {
    var item = document.createElement('div');
    item.className = 'cmd-item';
    var title = document.createElement('div');
    title.className = 'cmd-title';
    title.textContent = titleText;
    var code = document.createElement('div');
    code.className = 'cmd-code';
    code.textContent = codeText;
    item.appendChild(title);
    item.appendChild(code);
    return item;
}

function renderCommands(commands) {
    var container = document.getElementById('command-container');
    for (var i = 0; i < commands.length; i++) {
        var item = commands[i];
        container.appendChild(createCmdItem(item[0], item[1]));
    }
}

