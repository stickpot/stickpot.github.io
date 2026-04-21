(function () {
    // 闭包封装 → 不污染全局
    var popup = null;
    var input = null;
    var currentEncryptedUrl = ""; // 动态加密链接，不是固定的
    var saltKey = ""; // 动态加密链接，不是固定的

    // ============== 核心：code 转换为 加密链接（你在这里配置映射）==============
    function getEncryptedUrlByCode(code) {
        // 你可以在这里无限加：code 对应 加密链接
        var urlMap = {
            "my": "U2FsdGVkX18aoM1cd1U67jL53ffT/pQZT378F5PVYaOI0z47WLRgVuyvXWsj9O3kOJ9iS35ZWLSINbfxBBx5GA==|kjr",
            "cherry": "U2FsdGVkX182+wCKGqJijE4Kxi6Tc2ouSAF4+aF6/hMj9inH8shc7UzeKAZRnvZJwuVN/j3znqc7Snn54s94aw==|X2rvBu"
        };
        // 返回对应加密链接，找不到就返回空
        return urlMap[code] || "";
    }

    // 初始化弹窗结构
    function initPopup() {
        if (popup) return;

        var popupHtml =
            '<div style="display:none;position:fixed;left:0;top:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:9999;text-align:center;">' +
            '  <div style="width:320px;margin:33vh auto;background:#1e1e1e;padding:24px;border:1px solid #444;border-radius:8px;">' +
            '    <p style="color:#fff;margin:0 0 16px;font-size:16px;">请输入密码</p>' +
            // 重点：移除了 text-align:center，输入框恢复左对齐
            '    <input type="password" placeholder="输入密码" style="width:100%;padding:10px;box-sizing:border-box;margin-bottom:16px;border-radius:6px;border:1px solid #555;background:#2a2a2a;color:#fff;">' +
            '    <div>' +
            '      <button style="width:49%;padding:8px;background:#444;color:#fff;border:none;border-radius:6px;cursor:pointer;">取消</button>' +
            '      <button style="width:49%;padding:8px;background:#0066cc;color:#fff;border:none;border-radius:6px;cursor:pointer;">确定</button>' +
            '    </div>' +
            '  </div>' +
            '</div>';

        document.body.insertAdjacentHTML('beforeend', popupHtml);

        popup = document.body.lastElementChild;
        input = popup.querySelector('input');
        var btns = popup.querySelectorAll('button');
        btns[0].onclick = closePwdPopup;
        btns[1].onclick = confirmPwd;

        // 回车提交（必须输入不为空才触发）
        input.addEventListener('keydown', function (e) {
            var pwd = input.value.trim();
            if ((e.key === 'Enter' || e.keyCode === 13) && pwd) {
                confirmPwd();
            }
        });
    }

    // 打开弹窗（接收 code 参数！）
    window.openPwdPopup = function (code) {
        // 根据 code 获取对应的加密链接
        saltKey = code;
        currentEncryptedUrl = getEncryptedUrlByCode(code);

        // 如果没有找到链接，直接提示
        if (!currentEncryptedUrl) {
            alert("链接不存在");
            return;
        }
        var salt = currentEncryptedUrl.split("|")[1];
        if (currentEncryptedUrl.endsWith(localStorage.getItem(code))) {
            document.location.href = localStorage.getItem("hr" + salt);
            return;
        }
        initPopup();
        popup.style.display = "block";
        input.value = "";
        input.focus();
    };

    function closePwdPopup() {
        popup.style.display = "none";
    }

    function confirmPwd() {
        var pwd = input.value.trim();
        closePwdPopup();
        if (!pwd) return;

        try {
            var encryptedData = currentEncryptedUrl.split('|');
            var encryptStr = encryptedData[0];
            var salt = encryptedData[1];
            var key = CryptoJS.SHA256(pwd).toString();
            var bytes = CryptoJS.AES.decrypt(encryptStr, key);
            var url = bytes.toString(CryptoJS.enc.Utf8);
            if (url && url.endsWith(salt)) {
                var splitInfo = url.split('|');
                var rel = splitInfo[0];
                rel = rel + (rel.includes('?') ? '&' : '?') + 'type=' + saltKey;
                localStorage.setItem(saltKey, salt);
                localStorage.setItem("sk" + salt, splitInfo[1]);
                localStorage.setItem("hr" + salt, rel);
                document.location.href = rel;
            } else {
                alert("密码错误");
            }
        } catch (e) {
            alert("密码错误");
        }
    }

    window.getUrlParam = function(name) {
        var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
        var r = window.location.search.substr(1).match(reg);
        if (r != null) {
            return decodeURIComponent(r[2]);
        }
        return "";
    };
    window.createNavCard = function createNavCard(navTitle, iconClass, links) {
        if (!navTitle || !links || !links.length) return null;
        var navContainer = document.createElement('div');
        navContainer.className = 'nav-container';
        var navCard = document.createElement('div');
        navCard.className = 'nav-card';
        var titleEl = document.createElement('div');
        titleEl.className = 'nav-title';
        titleEl.innerHTML = '<i class="fa ' + iconClass + '"></i>' + navTitle;
        var listEl = document.createElement('div');
        listEl.className = 'nav-list';
        for (var i = 0; i < links.length; i++) {
            var item = links[i];
            if (!item.text || !item.href) continue;
            var navItem = document.createElement('div');
            navItem.className = 'nav-item';
            var a = document.createElement('a');
            a.href = item.href;
            a.textContent = item.text;
            navItem.appendChild(a);
            listEl.appendChild(navItem);
        }
        navCard.appendChild(titleEl);
        navCard.appendChild(listEl);
        navContainer.appendChild(navCard);
        return navContainer;
    }
})();