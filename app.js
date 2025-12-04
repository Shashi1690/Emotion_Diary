// =========================================================
// 1. IMPORT FIREBASE TOOLS
// =========================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    onAuthStateChanged, 
    signOut 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    deleteDoc, 
    doc,
    query, 
    orderBy, 
    onSnapshot, 
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// =========================================================
// 2. CONFIGURATION
// =========================================================
const firebaseConfig = {
    // 🔴 IMPORTANT: PASTE YOUR REAL KEYS HERE AGAIN 🔴
    apiKey: "YOUR_API_KEY_HERE",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "NUMBERS",
    appId: "NUMBERS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// =========================================================
// 3. DOM ELEMENTS
// =========================================================
const authSection = document.getElementById('auth-section');
const diarySection = document.getElementById('diary-section');

const emailInput = document.getElementById('email-input');
const passInput = document.getElementById('pass-input');

const loginBtn = document.getElementById('login-btn');
const signupBtn = document.getElementById('signup-btn');
const logoutBtn = document.getElementById('logout-btn');

const saveBtn = document.getElementById('save-btn');
const noteText = document.getElementById('note-text');
const notesList = document.getElementById('notes-list');
const errorMsg = document.getElementById('error-msg');

// =========================================================
// 4. AUTH & NAVIGATION (The Memory)
// =========================================================
onAuthStateChanged(auth, (user) => {
    if (user) {
        // Logged In
        authSection.classList.add('hidden');
        diarySection.classList.remove('hidden');
        loadNotes(user.uid);
    } else {
        // Logged Out
        authSection.classList.remove('hidden');
        diarySection.classList.add('hidden');
        notesList.innerHTML = '';
    }
});

// --- LOGIN ---
loginBtn.addEventListener('click', () => {
    signInWithEmailAndPassword(auth, emailInput.value, passInput.value)
        .catch((err) => errorMsg.innerText = getErrorMessage(err));
});

// --- SIGN UP ---
signupBtn.addEventListener('click', () => {
    createUserWithEmailAndPassword(auth, emailInput.value, passInput.value)
        .then(() => alert("Account Created! You are now logged in."))
        .catch((err) => errorMsg.innerText = getErrorMessage(err));
});

// --- LOG OUT ---
logoutBtn.addEventListener('click', () => {
    signOut(auth);
});

// =========================================================
// 5. SAVE NOTE
// =========================================================
saveBtn.addEventListener('click', async () => {
    const text = noteText.value.trim();
    if (!text) return;

    try {
        await addDoc(collection(db, "emotions"), {
            text: text,
            uid: auth.currentUser.uid, // Tag note with User ID
            createdAt: serverTimestamp()
        });
        noteText.value = ""; 
    } catch (e) {
        console.error("Error saving: ", e);
        alert("Could not save note.");
    }
});

// =========================================================
// 6. LOAD NOTES
// =========================================================
function loadNotes(userId) {
    const q = query(
        collection(db, "emotions"), 
        orderBy("createdAt", "desc")
    );

    onSnapshot(q, (snapshot) => {
        notesList.innerHTML = "";
        snapshot.forEach((documentSnapshot) => {
            const data = documentSnapshot.data();
            const noteId = documentSnapshot.id;
            
            // Only show notes for THIS user
            if(data.uid === userId) {
                const date = data.createdAt ? data.createdAt.toDate().toLocaleString() : "Just now";
                
                const html = `
                    <div class="note-card">
                        <div class="note-header">
                            <span class="timestamp">${date}</span>
                            <button class="delete-btn" data-id="${noteId}">🗑️</button>
                        </div>
                        <p>${data.text}</p>
                    </div>
                `;
                notesList.innerHTML += html;
            }
        });
    });
}

// =========================================================
// 7. DELETE WITH SECRET KEY
// =========================================================
notesList.addEventListener('click', async (e) => {
    // Check if clicked element is delete button
    if (e.target.classList.contains('delete-btn')) {
        const idToDelete = e.target.getAttribute('data-id');
        
        // --- 🔒 CHANGE YOUR PASSWORD HERE ---
        const SECRET_KEY = "1234"; 
        // ------------------------------------

        const userEnteredKey = prompt("🔒 Enter the Secret Key to delete:");

        if (userEnteredKey === SECRET_KEY) {
            try {
                await deleteDoc(doc(db, "emotions", idToDelete));
                console.log("Deleted");
            } catch (error) {
                console.error("Error deleting:", error);
                alert("Could not delete.");
            }
        } else if (userEnteredKey !== null) {
            alert("❌ Wrong Key!");
        }
    }
});

// Helper for cleaner error messages
function getErrorMessage(error) {
    if (error.code === "auth/wrong-password") return "Incorrect Password.";
    if (error.code === "auth/user-not-found") return "User not found.";
    if (error.code === "auth/email-already-in-use") return "Email already exists.";
    return error.message;
}
