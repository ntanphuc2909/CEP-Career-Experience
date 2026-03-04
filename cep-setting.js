/**
 * CEP Settings & Utilities
 * Quản lý theme, toast notification, và các tiện ích chung
 * Đặt file này trong cùng thư mục với các file HTML
 */

var CEP_SETTINGS = (function () {
    var STORAGE_KEY = 'cep_settings';

    var defaults = {
        theme             : 'light',
        language          : 'vi',
        notifications     : true,
        emailNotifications: true,
        fontSize          : 'medium'
    };

    function load() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            return raw ? Object.assign({}, defaults, JSON.parse(raw)) : Object.assign({}, defaults);
        } catch (e) { return Object.assign({}, defaults); }
    }

    function save(settings) {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); }
        catch (e) { console.error('CEP_SETTINGS save error:', e); }
    }

    function setTheme(theme) {
        var s = load();
        s.theme = theme;
        save(s);
        applyTheme(theme);
    }

    function applyTheme(theme) {
        if (theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            document.body.classList.add('dark-mode');
        } else {
            document.documentElement.removeAttribute('data-theme');
            document.body.classList.remove('dark-mode');
        }
    }

    /* ── Toast ── */
    var toastQueue   = [];
    var toastVisible = false;

    function showToast(message, type, duration) {
        type     = type     || 'success';
        duration = duration || 3000;
        toastQueue.push({ message: message, type: type, duration: duration });
        if (!toastVisible) processToastQueue();
    }

    function processToastQueue() {
        if (!toastQueue.length) { toastVisible = false; return; }
        toastVisible = true;
        var item  = toastQueue.shift();
        var toast = document.getElementById('cep-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'cep-toast';
            toast.style.cssText = [
                'position:fixed','bottom:28px','right:28px','z-index:99999',
                'padding:14px 22px','border-radius:12px',
                'font-family:"DM Sans",sans-serif','font-size:14px','font-weight:500',
                'box-shadow:0 8px 28px rgba(0,0,0,0.18)',
                'transform:translateY(80px)','opacity:0',
                'transition:all .35s cubic-bezier(.34,1.56,.64,1)',
                'max-width:340px','line-height:1.5','cursor:pointer'
            ].join(';');
            toast.addEventListener('click', function () { hideToast(toast); });
            document.body.appendChild(toast);
        }
        var colors = {
            success : '#2D5F5D',
            error   : '#E76F51',
            warning : '#F4A261',
            info    : '#2196f3'
        };
        toast.style.background = colors[item.type] || colors.success;
        toast.style.color      = '#fff';
        toast.textContent      = item.message;
        requestAnimationFrame(function () {
            toast.style.transform = 'translateY(0)';
            toast.style.opacity   = '1';
        });
        toast._timer = setTimeout(function () { hideToast(toast); }, item.duration);
    }

    function hideToast(toast) {
        if (toast._timer) clearTimeout(toast._timer);
        toast.style.transform = 'translateY(80px)';
        toast.style.opacity   = '0';
        setTimeout(processToastQueue, 400);
    }

    /* Apply theme immediately */
    function init() { applyTheme(load().theme); }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    return { load:load, save:save, setTheme:setTheme, applyTheme:applyTheme, showToast:showToast };
})();
