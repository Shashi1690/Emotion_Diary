// =========================================================
// 1. IMPORTS (Now includes deleteDoc)
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
    deleteDoc, // <--- Used to delete
    doc,       // <--- Used to find the specific note
    query, 
    orderBy, 
    onSnapshot, 
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// =========================================================
// 2. CONFIGURATION
// =========================================================
const firebaseConfig = {
    // 🔴 PASTE YOUR REAL FIREBASE KEYS HERE 🔴
    apiKey: "AIzaSyB4AkivpThDPwokA4LLHoIZenyEr2E29t8",

  authDomain: "my-emotion-diary-f017d.firebaseapp.com",

  projectId: "my-emotion-diary-f017d",

  storageBucket: "my-emotion-diary-f017d.firebasestorage.app",

  messagingSenderId: "635844173948",

  appId: "1:635844173948:web:2690b78b62243e5e93a9f9",

  measurementId: "G-YF68FPLWNL"
};

// Initialize
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
// 4. AUTH & NAVIGATION
// =========================================================
onAuthStateChanged(auth, (user) => {
    if (user) {
        authSection.classList.add('hidden');
        diarySection.classList.remove('hidden');
        loadNotes(user.uid);
    } else {
        authSection.classList.remove('hidden');
        diarySection.classList.add('hidden');
        notesList.innerHTML = '';
    }
});

loginBtn.addEventListener('click', () => {
    signInWithEmailAndPassword(auth, emailInput.value, passInput.value)
        .catch((err) => errorMsg.innerText = err.message);
});

signupBtn.addEventListener('click', () => {
    createUserWithEmailAndPassword(auth, emailInput.value, passInput.value)
        .then(() => alert("Account Created!"))
        .catch((err) => errorMsg.innerText = err.message);
});

logoutBtn.addEventListener('click', () => signOut(auth));

// =========================================================
// 5. SAVE NOTE
// =========================================================
saveBtn.addEventListener('click', async () => {
    const text = noteText.value.trim();
    if (!text) return;

    try {
        await addDoc(collection(db, "emotions"), {
            text: text,
            uid: auth.currentUser.uid,
            createdAt: serverTimestamp()
        });
        noteText.value = ""; 
    } catch (e) {
        console.error("Error saving: ", e);
    }
});

// =========================================================
// 6. LOAD NOTES (With Delete Button)
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
            const noteId = documentSnapshot.id; // The unique ID of the note
            
            if(data.uid === userId) {
                const date = data.createdAt ? data.createdAt.toDate().toLocaleString() : "Just now";
                
                // We add the Trash Icon (🗑️) inside the HTML
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
// 7. DELETE FUNCTIONALITY
// =========================================================
notesList.addEventListener('click', async (e) => {
    // Check if the clicked item is the Delete Button
    if (e.target.classList.contains('delete-btn')) {
        const idToDelete = e.target.getAttribute('data-id');
        
        // Ask for confirmation
        if (confirm("Delete this note forever?")) {
            try {
                // Delete from Firebase
                await deleteDoc(doc(db, "emotions", idToDelete));
            } catch (error) {
                console.error("Error deleting:", error);
                alert("Could not delete note.");
            }
        }
    }
});