/**
 * CEP Authentication & User Data Storage - FIREBASE CLOUD VERSION
 * Đã được tích hợp cơ sở dữ liệu Firebase.
 */

var CEP_AUTH = (function () {
    // 1. CẤU HÌNH FIREBASE CỦA BẠN
    const firebaseConfig = {
        apiKey: "AIzaSyBNrB6G8FIoZaHxjyf1ki9sshPKbobH0rU",
        authDomain: "cep-career-web.firebaseapp.com",
        projectId: "cep-career-web",
        storageBucket: "cep-career-web.firebasestorage.app",
        messagingSenderId: "850922923304",
        appId: "1:850922923304:web:c58846ecd299f7f6621c1d",
        measurementId: "G-P209XZ5FDK"
    };

    // Khởi tạo Firebase nếu chưa có
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }

    const auth = firebase.auth();
    const db = firebase.firestore();

    let currentUserData = null;

    // 2. LẮNG NGHE TRẠNG THÁI ĐĂNG NHẬP
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            const doc = await db.collection('users').doc(user.uid).get();
            if (doc.exists) {
                currentUserData = doc.data();
            }
            // Tự động cập nhật giao diện
            if(typeof updateUserUI === 'function') updateUserUI();
            if(typeof renderProfile === 'function' && document.getElementById('page-profile') && document.getElementById('page-profile').classList.contains('active')) {
                renderProfile();
            }
            // Nếu đang ở trang login/register thì tự động chuyển về trang chủ
            if(document.getElementById('page-login') && document.getElementById('page-login').classList.contains('active') || document.getElementById('page-register') && document.getElementById('page-register').classList.contains('active')){
                if(typeof showPage === 'function') showPage('page-home');
            }
        } else {
            currentUserData = null;
            if(typeof updateUserUI === 'function') updateUserUI();
        }
    });

    // 3. CÁC HÀM XỬ LÝ (FIREBASE CLOUD)
    function isLoggedIn() {
        return auth.currentUser !== null;
    }

    function getCurrentUser() {
        return currentUserData;
    }

    async function register(data) {
        try {
            // Tạo tài khoản Auth
            const userCred = await auth.createUserWithEmailAndPassword(data.email, data.password);
            const user = userCred.user;
            
            // Lưu thông tin vào CSDL Firestore
            const userData = {
                uid: user.uid,
                fullname: data.fullname,
                email: data.email,
                phone: data.phone || '',
                role: data.role || 'student',
                avatar: data.avatar || '',
                bio: data.bio || '',
                location: data.location || '',
                website: data.website || '',
                occupation: data.occupation || '',
                dob: '', gender: 'male', facebook: '', education: '', experience: '', skills: '',
                createdAt: Date.now(),
                updatedAt: Date.now()
            };

            await db.collection('users').doc(user.uid).set(userData);
            return { success: true };
        } catch (error) {
            let msg = 'Lỗi đăng ký!';
            if (error.code === 'auth/email-already-in-use') msg = 'Email này đã được đăng ký!';
            if (error.code === 'auth/weak-password') msg = 'Mật khẩu quá yếu (cần tối thiểu 6 ký tự)!';
            return { success: false, message: msg };
        }
    }

    async function login(email, password, remember) {
        try {
            const persistence = remember ? firebase.auth.Auth.Persistence.LOCAL : firebase.auth.Auth.Persistence.SESSION;
            await auth.setPersistence(persistence);
            await auth.signInWithEmailAndPassword(email, password);
            return { success: true, user: { fullname: "Bạn" } }; 
        } catch (error) {
            return { success: false, message: 'Sai email hoặc mật khẩu!' };
        }
    }

    async function logout() {
        await auth.signOut();
        window.location.reload();
    }

    async function updateProfile(data) {
        if (!auth.currentUser) return { success: false, message: 'Chưa đăng nhập!' };
        try {
            const allowed = ['fullname','phone','bio','location','website','occupation','avatar','role','dob','gender','facebook','education','experience','skills'];
            const updateData = {};
            allowed.forEach(key => {
                if (data[key] !== undefined) updateData[key] = data[key];
            });
            updateData.updatedAt = Date.now();

            await db.collection('users').doc(auth.currentUser.uid).update(updateData);
            currentUserData = { ...currentUserData, ...updateData };
            return { success: true, user: currentUserData };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    async function changePassword(currentPassword, newPassword) {
        try {
            // Xác thực lại trước khi đổi pass để bảo mật
            const user = auth.currentUser;
            const cred = firebase.auth.EmailAuthProvider.credential(user.email, currentPassword);
            await user.reauthenticateWithCredential(cred);
            
            await user.updatePassword(newPassword);
            return { success: true };
        } catch (error) {
            return { success: false, message: 'Mật khẩu hiện tại không đúng!' };
        }
    }

    async function forgotPassword(email) {
        try {
            await auth.sendPasswordResetEmail(email);
            return { success: true };
        } catch (error) {
            let msg = 'Lỗi gửi email!';
            if (error.code === 'auth/user-not-found') msg = 'Email không tồn tại trong hệ thống!';
            return { success: false, message: msg };
        }
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
