/**
 * CEP Authentication & User Data Storage
 * Lưu toàn bộ dữ liệu người dùng vào localStorage
 * Đặt file này cùng thư mục với các file HTML
 */

var CEP_AUTH = (function () {
    var USERS_KEY   = 'cep_users';
    var SESSION_KEY = 'cep_session';

    /* ── Helpers ── */
    function getUsers() {
        try {
            var raw = localStorage.getItem(USERS_KEY);
            return raw ? JSON.parse(raw) : {};
        } catch (e) { return {}; }
    }

    function saveUsers(users) {
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }

    function getSession() {
        try {
            // Kiểm tra sessionStorage trước (sẽ mất khi đóng tab), sau đó kiểm tra localStorage (nếu có Ghi nhớ đăng nhập)
            var s = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
            return s ? JSON.parse(s) : null;
        } catch (e) { return null; }
    }

    function saveSession(email, remember) {
        var session = { email: email, loginAt: Date.now() };
        // Luôn lưu vào sessionStorage
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
        // Nếu tick Ghi nhớ đăng nhập thì lưu cả vào localStorage
        if (remember) {
            localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        }
    }

    function clearSession() {
        sessionStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(SESSION_KEY);
    }

    function hashPassword(pw) {
        // Băm mật khẩu cơ bản
        var hash = 0;
        var salt = 'CEP_SALT_2024';
        var str  = pw + salt;
        for (var i = 0; i < str.length; i++) {
            var char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash |= 0;
        }
        return 'cep_' + Math.abs(hash).toString(36);
    }

    /* ── Public API ── */

    function isLoggedIn() {
        return getSession() !== null;
    }

    function getCurrentUser() {
        var session = getSession();
        if (!session) return null;
        var users = getUsers();
        return users[session.email] || null;
    }

    function register(data) {
        if (!data.fullname || !data.email || !data.password) {
            return { success: false, message: 'Vui lòng điền đầy đủ thông tin!' };
        }
        var users = getUsers();
        if (users[data.email]) {
            return { success: false, message: 'Email này đã được đăng ký!' };
        }
        
        // Khởi tạo các trường dữ liệu mặc định (Bao gồm các trường Profile mới)
        users[data.email] = {
            fullname   : data.fullname,
            email      : data.email,
            phone      : data.phone      || '',
            role       : data.role       || 'student',
            password   : hashPassword(data.password),
            avatar     : data.avatar     || '',
            bio        : data.bio        || '',
            location   : data.location   || '',
            website    : data.website    || '',
            occupation : data.occupation || '',
            dob        : '',
            gender     : 'male',
            facebook   : '',
            education  : '',
            experience : '',
            skills     : '',
            createdAt  : Date.now(),
            updatedAt  : Date.now()
        };
        saveUsers(users);
        return { success: true };
    }

    function login(email, password, remember) {
        var users = getUsers();
        var user  = users[email];
        if (!user) {
            return { success: false, message: 'Email không tồn tại trong hệ thống!' };
        }
        if (user.password !== hashPassword(password)) {
            return { success: false, message: 'Mật khẩu không đúng!' };
        }
        
        // Gọi hàm saveSession với cờ remember (true/false)
        saveSession(email, remember);
        return { success: true, user: user };
    }

    function logout() {
        clearSession();
        window.location.reload(); // Tự động load lại trang khi đăng xuất
    }

    function updateProfile(data) {
        var session = getSession();
        if (!session) return { success: false, message: 'Chưa đăng nhập!' };
        var users = getUsers();
        var user  = users[session.email];
        if (!user) return { success: false, message: 'Người dùng không tồn tại!' };

        // Mảng các trường dữ liệu được phép cập nhật (Không cho phép đổi email ở đây)
        var allowed = [
            'fullname','phone','bio','location','website','occupation','avatar','role',
            'dob','gender','facebook','education','experience','skills'
        ];
        
        allowed.forEach(function (key) {
            if (data[key] !== undefined) user[key] = data[key];
        });
        
        user.updatedAt = Date.now();
        saveUsers(users);
        return { success: true, user: user };
    }

    function changePassword(currentPassword, newPassword) {
        var session = getSession();
        if (!session) return { success: false, message: 'Chưa đăng nhập!' };
        var users = getUsers();
        var user  = users[session.email];
        if (!user) return { success: false, message: 'Người dùng không tồn tại!' };
        if (user.password !== hashPassword(currentPassword)) {
            return { success: false, message: 'Mật khẩu hiện tại không đúng!' };
        }
        
        user.password  = hashPassword(newPassword);
        user.updatedAt = Date.now();
        saveUsers(users);
        
        // Xoá session để bắt buộc đăng nhập lại bằng mật khẩu mới
        clearSession(); 
        return { success: true };
    }

    function forgotPassword(email) {
        var users = getUsers();
        if (!users[email]) {
            return { success: false, message: 'Email không tồn tại trong hệ thống!' };
        }
        return { success: true };
    }

    function requireAuth() {
        if (!isLoggedIn()) {
            window.location.href = 'login.html';
            return false;
        }
        return true;
    }

    // Export các hàm để gọi từ bên ngoài
    return {
        isLoggedIn      : isLoggedIn,
        getCurrentUser  : getCurrentUser,
        register        : register,
        login           : login,
        logout          : logout,
        updateProfile   : updateProfile,
        changePassword  : changePassword,
        forgotPassword  : forgotPassword,
        requireAuth     : requireAuth
    };
})();