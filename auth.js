/**
 * CEP Authentication & User Data Storage - FIREBASE CLOUD VERSION
 * Đã tích hợp Đăng nhập bằng Google & Facebook
 */

var CEP_AUTH = (function () {
    const firebaseConfig = {
        apiKey: "AIzaSyBNrB6G8FIoZaHxjyf1ki9sshPKbobH0rU",
        authDomain: "cep-career-web.firebaseapp.com",
        projectId: "cep-career-web",
        storageBucket: "cep-career-web.firebasestorage.app",
        messagingSenderId: "850922923304",
        appId: "1:850922923304:web:c58846ecd299f7f6621c1d",
        measurementId: "G-P209XZ5FDK"
    };

    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }

    const auth = firebase.auth();
    const db = firebase.firestore();
    let currentUserData = null;

    auth.onAuthStateChanged(async (user) => {
        if (user) {
            const doc = await db.collection('users').doc(user.uid).get();
            if (doc.exists) {
                currentUserData = doc.data();
            }
            if(typeof updateUserUI === 'function') updateUserUI();
            if(typeof renderProfile === 'function' && document.getElementById('page-profile') && document.getElementById('page-profile').classList.contains('active')) {
                renderProfile();
            }
            if(document.getElementById('page-login') && document.getElementById('page-login').classList.contains('active') || document.getElementById('page-register') && document.getElementById('page-register').classList.contains('active')){
                if(typeof showPage === 'function') showPage('page-home');
            }
        } else {
            currentUserData = null;
            if(typeof updateUserUI === 'function') updateUserUI();
        }
    });

    function isLoggedIn() { return auth.currentUser !== null; }
    function getCurrentUser() { return currentUserData; }

    async function register(data) {
        try {
            const userCred = await auth.createUserWithEmailAndPassword(data.email, data.password);
            const user = userCred.user;
            const userData = {
                uid: user.uid, fullname: data.fullname, email: data.email, phone: data.phone || '',
                role: data.role || 'student', avatar: data.avatar || '', bio: data.bio || '',
                location: data.location || '', website: data.website || '', occupation: data.occupation || '',
                dob: '', gender: 'male', facebook: '', education: '', experience: '', skills: '',
                createdAt: Date.now(), updatedAt: Date.now()
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
            const userCred = await auth.signInWithEmailAndPassword(email, password);
            const doc = await db.collection('users').doc(userCred.user.uid).get();
            if (doc.exists) currentUserData = doc.data();
            return { success: true, user: currentUserData || { fullname: "Bạn" } }; 
        } catch (error) {
            return { success: false, message: 'Sai email hoặc mật khẩu!' };
        }
    }

    // ====== PHẦN ĐƯỢC THÊM: XỬ LÝ ĐĂNG NHẬP MẠNG XÃ HỘI ======
    async function handleSocialLoginSuccess(user) {
        const doc = await db.collection('users').doc(user.uid).get();
        if (!doc.exists) {
            const userData = {
                uid: user.uid,
                fullname: user.displayName || 'Người dùng',
                email: user.email || '',
                phone: user.phoneNumber || '',
                role: 'student',
                avatar: user.photoURL || '',
                bio: '', location: '', website: '', occupation: '',
                dob: '', gender: 'male', facebook: '', education: '', experience: '', skills: '',
                createdAt: Date.now(), updatedAt: Date.now()
            };
            await db.collection('users').doc(user.uid).set(userData);
            currentUserData = userData;
        } else {
            currentUserData = doc.data();
        }
        return { success: true, user: currentUserData };
    }

    async function loginWithGoogle() {
        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            const result = await auth.signInWithPopup(provider);
            return await handleSocialLoginSuccess(result.user);
        } catch (error) {
            return { success: false, message: 'Đăng nhập Google bị hủy hoặc lỗi.' };
        }
    }

    async function loginWithFacebook() {
        try {
            const provider = new firebase.auth.FacebookAuthProvider();
            const result = await auth.signInWithPopup(provider);
            return await handleSocialLoginSuccess(result.user);
        } catch (error) {
            return { success: false, message: 'Đăng nhập Facebook thất bại (Cần cấu hình App ID)!' };
        }
    }
    // ==========================================================

    async function logout() {
        await auth.signOut();
        window.location.reload();
    }

    async function updateProfile(data) {
        if (!auth.currentUser) return { success: false, message: 'Chưa đăng nhập!' };
        try {
            const allowed = ['fullname','phone','bio','location','website','occupation','avatar','role','dob','gender','facebook','education','experience','skills'];
            const updateData = {};
            allowed.forEach(key => { if (data[key] !== undefined) updateData[key] = data[key]; });
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
        if (!isLoggedIn()) { window.location.href = 'login.html'; return false; }
        return true;
    }

    return {
        isLoggedIn: isLoggedIn, getCurrentUser: getCurrentUser,
        register: register, login: login, logout: logout,
        updateProfile: updateProfile, changePassword: changePassword,
        forgotPassword: forgotPassword, requireAuth: requireAuth,
        loginWithGoogle: loginWithGoogle,
        loginWithFacebook: loginWithFacebook
    };
})();
