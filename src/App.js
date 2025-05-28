import React, { useState, useEffect, memo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile 
} from 'firebase/auth';
import { 
    getFirestore, 
    doc, 
    setDoc, 
    deleteDoc, 
    collection, 
    query, 
    where, 
    onSnapshot,
    serverTimestamp, 
    setLogLevel,
    arrayUnion, 
    arrayRemove,
    orderBy, 
    limit     
} from 'firebase/firestore';

// --- Import the CSS file ---
import './App.css'; 

// --- Constants ---
const MONTHS = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
];
const CURRENT_YEAR = new Date().getFullYear();

// --- Helper Functions ---
const getDaysInMonth = (year, monthIndex) => {
    if (year === null || monthIndex === null || monthIndex < 0 || monthIndex > 11) return [];
    const numDays = new Date(year, monthIndex + 1, 0).getDate();
    return Array.from({ length: numDays }, (_, i) => i + 1);
};

// --- Settings Modal Component (Memoized) ---
const SettingsModal = memo(({ 
    isOpen, 
    onClose,
    appTheme,
    onToggleTheme,
    currentAppNickname, 
    newNicknameInput, 
    onNewNicknameInputChange, 
    onSaveNickname,
    manageableYears,
    isLoadingYears,
    yearManagementError,
    newYearToAdd,
    onNewYearToAddChange,
    onAddYear,
    onDeleteYear,
    companions, 
    newCompanionUidInput, 
    onNewCompanionUidInputChange, 
    newCompanionNicknameInput, 
    onNewCompanionNicknameInputChange, 
    onAddCompanion, 
    onRemoveCompanion,
    settingsMessage,
    currentUserUid
}) => {
    if (!isOpen) return null;

    return (
        <div className="settings-modal-overlay" onClick={onClose}>
            <div className="settings-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="settings-modal-header">
                    <h2>App Settings</h2>
                    <button onClick={onClose} className="button-icon close-modal-button" title="Close settings">
                        <svg xmlns="http://www.w3.org/2000/svg" className="icon" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
                
                {settingsMessage && <div className={`info-message ${settingsMessage.startsWith("Failed") || settingsMessage.startsWith("Cannot") ? 'error-message' : ''}`}>{settingsMessage}</div>}

                <div className="settings-section">
                    <h3 className="subsection-title">My Account</h3>
                    {currentUserUid && (
                        <>
                            <p className="info-text">Your User ID: <strong className="uid-emphasis">{currentUserUid}</strong></p>
                            <p className="placeholder-text small-text">Share this ID with someone you want to set as your companion, or someone who wants to set you as theirs.</p>
                        </>
                    )}
                </div>


                <div className="settings-section">
                    <h3 className="subsection-title">Manage Available Years</h3>
                    {yearManagementError && <div className="error-message">{yearManagementError}</div>}
                    <div className="add-year-form">
                        <input 
                            type="number" 
                            value={newYearToAdd} 
                            onChange={(e) => onNewYearToAddChange(e.target.value)} 
                            placeholder="Enter year (e.g., 2026)" 
                            className="form-group-input"
                        />
                        <button onClick={onAddYear} className="button button-primary add-year-button">Add Year</button>
                    </div>
                    {isLoadingYears && <p className="loading-text-tasks">Loading years...</p>}
                    {!isLoadingYears && manageableYears.length > 0 && (
                        <div className="manageable-years-display">
                            <ul className="year-tags-list">
                                {manageableYears.map(year => (
                                    <li key={year} className="year-tag">
                                        <span>{year}</span>
                                        <button 
                                            onClick={() => onDeleteYear(year)} 
                                            className="button-icon delete-year-button" 
                                            title={`Delete year ${year}`}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="icon" viewBox="0 0 20 20" fill="currentColor">
                                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                     {!isLoadingYears && manageableYears.length === 0 && (
                        <p className="info-message">No years available. Add a year to start.</p>
                    )}
                </div>

                <div className="settings-section">
                    <h3 className="subsection-title">App Theme</h3>
                    <button onClick={onToggleTheme} className="button theme-toggle-button">
                        Switch to {appTheme === 'dark' ? 'Light' : 'Dark'} Mode
                    </button>
                </div>

                <div className="settings-section">
                    <h3 className="subsection-title">App Nickname (Current: {currentAppNickname})</h3>
                    <div className="nickname-form">
                        <input 
                            id="nickname-input-field" 
                            type="text" 
                            value={newNicknameInput}
                            onChange={(e) => onNewNicknameInputChange(e.target.value)}
                            placeholder="Enter app nickname" 
                            className="form-group-input"
                        />
                        <button onClick={onSaveNickname} className="button button-primary">Save Nickname</button>
                    </div>
                </div>
                
                <div className="settings-section">
                    <h3 className="subsection-title">Companion Settings</h3>
                    <div className="companion-form add-companion-form"> 
                         <input 
                            type="text" 
                            value={newCompanionUidInput}
                            onChange={(e) => onNewCompanionUidInputChange(e.target.value)}
                            placeholder="Companion's User ID" 
                            className="form-group-input companion-uid-input"
                        />
                        <input 
                            type="text" 
                            value={newCompanionNicknameInput}
                            onChange={(e) => onNewCompanionNicknameInputChange(e.target.value)}
                            placeholder="Companion's Nickname" 
                            className="form-group-input companion-nickname-input"
                        />
                        <button onClick={onAddCompanion} className="button button-primary">Add Companion</button>
                    </div>
                    {companions && companions.length > 0 && (
                        <div className="manageable-companions-display">
                            <h4>Current Companions:</h4>
                            <ul className="companion-tags-list">
                                {companions.map(comp => ( 
                                    <li key={comp.uid} className="companion-tag">
                                        <span>{comp.nickname} ({comp.uid.substring(0, 6)}...)</span> 
                                        <button onClick={() => onRemoveCompanion(comp.uid)} className="button-icon delete-companion-button" title={`Remove ${comp.nickname}`}>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="icon" viewBox="0 0 20 20" fill="currentColor">
                                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {(!companions || companions.length === 0) && (
                        <p className="placeholder-text">You have no companions added.</p>
                    )}
                    <p className="placeholder-text small-text">Note: Adding a companion allows you to view their tasks (read-only if their security rules permit you).</p>
                </div>
            </div>
        </div>
    );
});


// --- Main App Component ---
function App() {
    const [auth, setAuth] = useState(null);
    const [db, setDb] = useState(null);
    const [user, setUser] = useState(null); 
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [appId, setAppId] = useState('default-app-id'); // Will be updated by useEffect
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState(''); 
    const [isLoginView, setIsLoginView] = useState(true);
    const [authError, setAuthError] = useState('');
    const [selectedYear, setSelectedYear] = useState(null);
    const [selectedMonth, setSelectedMonth] = useState(null); 
    const [daysInSelectedMonth, setDaysInSelectedMonth] = useState([]);
    const [selectedDay, setSelectedDay] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [newTaskText, setNewTaskText] = useState('');
    const [isLoadingTasks, setIsLoadingTasks] = useState(false);
    const [generalError, setGeneralError] = useState('');
    const [manageableYears, setManageableYears] = useState([]);
    const [newYearToAdd, setNewYearToAdd] = useState('');
    const [isLoadingYears, setIsLoadingYears] = useState(true);
    const [yearManagementError, setYearManagementError] = useState('');
    const [recentTasks, setRecentTasks] = useState([]);
    const [isLoadingRecentTasks, setIsLoadingRecentTasks] = useState(true);
    const [recentTasksError, setRecentTasksError] = useState('');
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [appTheme, setAppTheme] = useState('dark'); 
    const [appNickname, setAppNickname] = useState('Task Manager Deluxe'); 
    const [newNicknameInput, setNewNicknameInput] = useState('');
    
    const [companions, setCompanions] = useState([]); 
    const [newCompanionUidInput, setNewCompanionUidInput] = useState('');
    const [newCompanionNicknameInput, setNewCompanionNicknameInput] = useState(''); 
    const [selectedCompanionForViewing, setSelectedCompanionForViewing] = useState(null); 

    const [settingsMessage, setSettingsMessage] = useState('');
    const [viewMode, setViewMode] = useState('myTasks'); 
    const [effectiveUidForTasks, setEffectiveUidForTasks] = useState(null); 


    // --- Apply Theme ---
    useEffect(() => {
        document.body.classList.remove('theme-light', 'theme-dark');
        document.body.classList.add(`theme-${appTheme}`);
    }, [appTheme]);

    // --- Firebase Initialization and Auth State Listener ---
    useEffect(() => {
        // Construct Firebase config from environment variables
        const firebaseConfigFromEnv = {
            apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
            authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
            projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
            storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
            messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
            appId: process.env.REACT_APP_FIREBASE_APP_ID, // Firebase's own App ID for the web app
            measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID 
        };

        let effectiveAppIdToSet;
        // eslint-disable-next-line no-undef
        if (typeof __app_id !== 'undefined') {
            // eslint-disable-next-line no-undef
            effectiveAppIdToSet = __app_id; // Use global if available
        } else if (process.env.REACT_APP_CUSTOM_APP_ID) {
            effectiveAppIdToSet = process.env.REACT_APP_CUSTOM_APP_ID;
        } else {
            effectiveAppIdToSet = 'task-manager-default'; // Fallback if neither is set
        }
        setAppId(effectiveAppIdToSet);

        try {
            let firebaseConfigToUse;
            // eslint-disable-next-line no-undef
            if (typeof __firebase_config !== 'undefined') {
                // eslint-disable-next-line no-undef
                firebaseConfigToUse = JSON.parse(__firebase_config); // Use global if available
            } else {
                firebaseConfigToUse = firebaseConfigFromEnv; // Fallback to environment variables
            }

            if (!firebaseConfigToUse || !firebaseConfigToUse.apiKey) {
                setGeneralError("Firebase configuration is missing or invalid. Please check your .env file locally or environment variables in your hosting provider (e.g., Netlify). Ensure all REACT_APP_FIREBASE_... variables are set.");
                console.error("Firebase configuration is missing. Ensure .env file is set up locally with REACT_APP_... variables or environment variables are set in Netlify.");
                setIsAuthReady(true);
                return;
            }

            const appInstance = initializeApp(firebaseConfigToUse); 
            const firestoreDb = getFirestore(appInstance); 
            const firestoreAuth = getAuth(appInstance);
            setDb(firestoreDb); 
            setAuth(firestoreAuth); 
            setLogLevel('debug');

            const unsubscribeAuth = onAuthStateChanged(firestoreAuth, (currentUser) => {
                setUser(currentUser); setIsAuthReady(true);
                if (currentUser) {
                    setAuthError(''); setEmail(''); setPassword(''); setDisplayName('');
                    setSelectedYear(null); setSelectedMonth(null); setSelectedDay(null);
                    setEffectiveUidForTasks(currentUser.uid); 
                    setViewMode('myTasks'); 
                    setSelectedCompanionForViewing(null); 
                } else {
                    setManageableYears([]); setRecentTasks([]); setAppTheme('dark'); 
                    setAppNickname('Task Manager Deluxe'); setCompanions([]);
                    setEffectiveUidForTasks(null); setSelectedCompanionForViewing(null);
                }
            });
            return () => unsubscribeAuth();
        } catch (e) { 
            console.error("Error initializing Firebase:", e); 
            setGeneralError(`Firebase initialization error: ${e.message}. Check console and Firebase configuration.`); 
            setIsAuthReady(true); 
        }
    }, []); 

    // Determine effective UID for task fetching based on viewMode
    useEffect(() => {
        if (viewMode === 'myTasks' && user) {
            setEffectiveUidForTasks(user.uid);
        } else if (viewMode === 'companionTasks' && selectedCompanionForViewing) {
            setEffectiveUidForTasks(selectedCompanionForViewing.uid); 
        } else if (user) { 
            setEffectiveUidForTasks(user.uid);
            if (viewMode === 'companionTasks') setViewMode('myTasks'); 
        } else {
            setEffectiveUidForTasks(null);
        }
    }, [viewMode, user, selectedCompanionForViewing]);


    // --- Listen to User Preferences (Theme, Nickname, Companions) in Real-time ---
    useEffect(() => {
        if (!db || !user || !appId) {
            setAppTheme('dark');
            setAppNickname('Task Manager Deluxe');
            setNewNicknameInput('Task Manager Deluxe');
            setCompanions([]);
            setNewCompanionUidInput('');
            setNewCompanionNicknameInput('');
            return;
        }

        const prefDocRef = doc(db, `artifacts/${appId}/users/${user.uid}/userConfiguration`, "appPreferencesDoc");
        const unsubscribePrefs = onSnapshot(prefDocRef, async (docSnap) => {
            if (docSnap.exists()) {
                const prefs = docSnap.data();
                setAppTheme(prefs.theme || 'dark');
                const nickname = prefs.nickname || 'Task Manager Deluxe';
                setAppNickname(nickname);
                const nicknameInputField = document.getElementById('nickname-input-field');
                if (document.activeElement !== nicknameInputField || newNicknameInput === '') { 
                    setNewNicknameInput(nickname);
                }
                setCompanions(prefs.companions ? [...prefs.companions] : []); 
            } else {
                const defaultPrefs = { theme: 'dark', nickname: 'Task Manager Deluxe', companions: [] };
                try {
                    await setDoc(prefDocRef, defaultPrefs);
                } catch (error) {
                    console.error("Error creating default user preferences:", error);
                    setSettingsMessage("Could not initialize preferences.");
                    setAppTheme(defaultPrefs.theme);
                    setAppNickname(defaultPrefs.nickname);
                    setNewNicknameInput(defaultPrefs.nickname);
                    setCompanions(defaultPrefs.companions);
                }
            }
        }, (error) => {
            console.error("Error listening to user preferences:", error);
            setSettingsMessage("Could not load preferences.");
            setAppTheme('dark');
            setAppNickname('Task Manager Deluxe');
            setNewNicknameInput('Task Manager Deluxe');
            setCompanions([]);
        });

        return () => unsubscribePrefs(); 

    }, [db, user, appId, newNicknameInput]); 


    // --- Fetch/Manage User-Specific Years ---
    useEffect(() => {
        if (!db || !user || !appId) {
            setIsLoadingYears(false);
            if(user) setManageableYears([CURRENT_YEAR, CURRENT_YEAR + 1, CURRENT_YEAR + 2].sort((a, b) => a - b));
            else setManageableYears([]);
            return;
        }
        setIsLoadingYears(true); setYearManagementError('');
        const yearsDocRef = doc(db, `artifacts/${appId}/users/${user.uid}/userConfiguration`, "manageableYearsDoc");
        const unsubscribeYears = onSnapshot(yearsDocRef, async (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data && Array.isArray(data.list)) { setManageableYears([...data.list].sort((a, b) => a - b)); }
                else { 
                    const defaultYears = [CURRENT_YEAR, CURRENT_YEAR + 1, CURRENT_YEAR + 2].sort((a, b) => a - b);
                    try { await setDoc(yearsDocRef, { list: defaultYears }); } 
                    catch (error) { setManageableYears(defaultYears); console.error("Error resetting malformed years:", error); }
                }
            } else { 
                const defaultYears = [CURRENT_YEAR, CURRENT_YEAR + 1, CURRENT_YEAR + 2].sort((a, b) => a - b);
                try { await setDoc(yearsDocRef, { list: defaultYears }); } 
                catch (error) { setManageableYears(defaultYears); console.error("Error creating default years:", error); }
            }
            setIsLoadingYears(false);
        }, (error) => {
            setYearManagementError(`Failed to fetch years: ${error.message}`);
            setManageableYears([CURRENT_YEAR, CURRENT_YEAR + 1, CURRENT_YEAR + 2].sort((a,b)=>a-b));
            setIsLoadingYears(false);
        });
        return () => unsubscribeYears();
    }, [db, user, appId]);

    // --- Fetch Recent Tasks (adapts to effectiveUidForTasks) ---
    useEffect(() => {
        if (!db || !effectiveUidForTasks || !appId) { 
            setRecentTasks([]);
            setIsLoadingRecentTasks(false);
            return;
        }
        setIsLoadingRecentTasks(true); setRecentTasksError('');
        const recentTasksQuery = query(
            collection(db, `artifacts/${appId}/users/${effectiveUidForTasks}/tasks`), 
            orderBy("createdAt", "desc"),
            limit(5) 
        );
        const unsubscribeRecent = onSnapshot(recentTasksQuery, (querySnapshot) => {
            const fetchedRecentTasks = [];
            querySnapshot.forEach((doc) => { fetchedRecentTasks.push({ id: doc.id, ...doc.data() }); });
            setRecentTasks(fetchedRecentTasks);
            setIsLoadingRecentTasks(false);
        }, (error) => {
            console.error("Error fetching recent tasks:", error);
            setRecentTasksError(`Failed to fetch recent tasks for ${viewMode === 'companionTasks' ? 'companion' : 'user'}: ${error.message}`);
            setIsLoadingRecentTasks(false);
        });
        return () => unsubscribeRecent();
    }, [db, effectiveUidForTasks, appId, viewMode]); 


    // --- Update Days when Year/Month Changes ---
    useEffect(() => {
        if (selectedYear !== null && selectedMonth !== null) {
            setDaysInSelectedMonth(getDaysInMonth(selectedYear, selectedMonth));
            setSelectedDay(null);
        } else {
            setDaysInSelectedMonth([]);
        }
    }, [selectedYear, selectedMonth]);

    // --- Fetch Date-Specific Tasks (adapts to effectiveUidForTasks) ---
    useEffect(() => {
        if (!isAuthReady || !db || !effectiveUidForTasks || selectedYear === null || selectedMonth === null || selectedDay === null) { 
            setTasks([]);
            return;
        }
        setIsLoadingTasks(true); setGeneralError('');
        const tasksCollectionPath = `artifacts/${appId}/users/${effectiveUidForTasks}/tasks`; 
        const q = query( collection(db, tasksCollectionPath), where("year", "==", selectedYear), where("month", "==", MONTHS[selectedMonth]), where("day", "==", selectedDay) );
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const fetchedTasks = [];
            querySnapshot.forEach((doc) => { fetchedTasks.push({ id: doc.id, ...doc.data() }); });
            fetchedTasks.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
            setTasks(fetchedTasks); setIsLoadingTasks(false);
        }, (err) => { 
            console.error("Error fetching tasks:", err); 
            setGeneralError(`Failed to fetch tasks for ${viewMode === 'companionTasks' ? 'companion' : 'user'}: ${err.message}.`); 
            setIsLoadingTasks(false); 
        });
        return () => unsubscribe();
    }, [isAuthReady, db, effectiveUidForTasks, selectedYear, selectedMonth, selectedDay, appId, viewMode]); 

    // --- Auth Event Handlers ---
    const handleAuthAction = async (e) => { 
        e.preventDefault(); setAuthError('');
        if (!auth) { setAuthError("Firebase Auth not initialized."); return; }
        if (!email || !password) { setAuthError("Email and password cannot be empty."); return; }
        if (!isLoginView && !displayName.trim()) { setAuthError("Display name cannot be empty for registration."); return; }
        try {
            if (isLoginView) { await signInWithEmailAndPassword(auth, email, password); } 
            else { 
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                if (userCredential.user) { 
                    await updateProfile(userCredential.user, { displayName: displayName.trim() }); 
                    const prefDocRef = doc(db, `artifacts/${appId}/users/${userCredential.user.uid}/userConfiguration`, "appPreferencesDoc");
                    const defaultPrefs = { theme: 'dark', nickname: 'Task Manager Deluxe', companions: [] }; 
                    await setDoc(prefDocRef, defaultPrefs);
                }
            }
        } catch (error) { 
            console.error("Auth error:", error); 
            if (error.code === 'auth/email-already-in-use') { setAuthError('This email address is already in use.'); }
            else if (error.code === 'auth/weak-password') { setAuthError('The password is too weak (at least 6 characters).'); }
            else if (error.code === 'auth/invalid-email') { setAuthError('The email address is not valid.'); }
            else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') { setAuthError('Invalid email or password.'); }
            else { setAuthError(error.message); }
        }
    };
    const handleLogout = async () => { 
        setAuthError(''); if (!auth) { setAuthError("Firebase Auth not initialized."); return; }
        try { await signOut(auth); setSelectedYear(null); setSelectedMonth(null); setSelectedDay(null); setTasks([]); } 
        catch (error) { console.error("Logout error:", error); setAuthError(error.message); }
    };

    // --- Year Management Functions ---
    const handleAddYear = async () => { 
        setYearManagementError(''); const yearToAdd = parseInt(newYearToAdd);
        if (isNaN(yearToAdd) || yearToAdd < 1900 || yearToAdd > 2200) { setYearManagementError("Please enter a valid year (e.g., 2025)."); return; }
        if (manageableYears.includes(yearToAdd)) { setYearManagementError(`Year ${yearToAdd} already exists.`); setNewYearToAdd(''); return; }
        if (!db || !user || !appId) { setYearManagementError("Cannot add year: user or database not available."); return; }
        const yearsDocRef = doc(db, `artifacts/${appId}/users/${user.uid}/userConfiguration`, "manageableYearsDoc");
        try { await setDoc(yearsDocRef, { list: arrayUnion(yearToAdd) }, { merge: true }); setNewYearToAdd(''); } 
        catch (error) { console.error("Error adding year:", error); setYearManagementError(`Failed to add year: ${error.message}`); }
    };
    const handleDeleteYear = async (yearToDelete) => { 
        setYearManagementError('');
        if (manageableYears.length <= 1) { setYearManagementError("Cannot delete the last year. Add another year first."); return; }
        if (!db || !user || !appId) { setYearManagementError("Cannot delete year: user or database not available."); return; }

        if (window.customConfirm) {
            const confirmed = await window.customConfirm(`Are you sure you want to delete the year ${yearToDelete}? This action cannot be undone.`);
            if (!confirmed) return; 
        } else {
            console.warn("customConfirm not found, using native confirm as fallback.");
            if (!window.confirm(`Are you sure you want to delete the year ${yearToDelete}? (Fallback)`)) return;
        }

        const yearsDocRef = doc(db, `artifacts/${appId}/users/${user.uid}/userConfiguration`, "manageableYearsDoc");
        try { 
            await setDoc(yearsDocRef, { list: arrayRemove(yearToDelete) }, { merge: true });
            if (selectedYear === yearToDelete) { setSelectedYear(null); setSelectedMonth(null); setSelectedDay(null); }
        } catch (error) { console.error("Error deleting year:", error); setYearManagementError(`Failed to delete year: ${error.message}`); }
    };

    // --- Task Event Handlers ---
    const handleYearChange = (e) => { setSelectedYear(parseInt(e.target.value)); setSelectedMonth(null); setSelectedDay(null); setGeneralError(''); };
    const handleMonthChange = (e) => { setSelectedMonth(parseInt(e.target.value)); setSelectedDay(null); setGeneralError(''); };
    const handleDayChange = (e) => { setSelectedDay(parseInt(e.target.value)); setGeneralError(''); };
    const handleAddTask = async (e) => { 
        if (viewMode === 'companionTasks') {
            setGeneralError("Cannot add tasks for your companion (read-only view).");
            return;
        }
        e.preventDefault(); if (!newTaskText.trim()) { setGeneralError("Task description cannot be empty."); return; }
        if (!db || !user || selectedYear === null || selectedMonth === null || selectedDay === null) { setGeneralError("Please select a full date."); return; }
        setGeneralError(''); const tasksCollectionPath = `artifacts/${appId}/users/${user.uid}/tasks`; 
        const newTaskData = { text: newTaskText.trim(), completed: false, year: selectedYear, month: MONTHS[selectedMonth], day: selectedDay, createdAt: serverTimestamp(), userId: user.uid };
        try { const newDocRef = doc(collection(db, tasksCollectionPath)); await setDoc(newDocRef, newTaskData); setNewTaskText(''); } 
        catch (err) { console.error("Error adding task:", err); setGeneralError(`Failed to add task: ${err.message}.`); }
    };
    const handleToggleTaskComplete = async (taskId, currentStatus) => { 
        if (viewMode === 'companionTasks') return; 
        if (!db || !user) return; setGeneralError(''); const taskDocRef = doc(db, `artifacts/${appId}/users/${user.uid}/tasks`, taskId);
        try { await setDoc(taskDocRef, { completed: !currentStatus }, { merge: true }); } 
        catch (err) { console.error("Error updating task:", err); setGeneralError(`Failed to update task: ${err.message}.`); }
    };
    const handleDeleteTask = async (taskId) => { 
        if (viewMode === 'companionTasks') return; 
        if (!db || !user) return; setGeneralError('');
        if (window.customConfirm) { const confirmed = await window.customConfirm("Are you sure you want to delete this task?"); if (!confirmed) return; }
        else { if(!window.confirm("Are you sure you want to delete this task?")) return;}
        const taskDocRef = doc(db, `artifacts/${appId}/users/${user.uid}/tasks`, taskId);
        try { await deleteDoc(taskDocRef); } 
        catch (err) { console.error("Error deleting task:", err); setGeneralError(`Failed to delete task: ${err.message}.`); }
    };
    
    // --- Custom Confirmation Modal ---
    useEffect(() => { 
        window.customConfirm = async (message) => {
            const existingModal = document.getElementById('custom-confirm-modal'); if (existingModal) existingModal.remove();
            const modal = document.createElement('div'); modal.id = 'custom-confirm-modal'; modal.className = 'confirm-modal-overlay'; 
            const content = document.createElement('div'); content.className = 'confirm-modal-content'; 
            content.innerHTML = `<p class="confirm-modal-message">${message}</p><div class="confirm-modal-buttons"><button id="confirmOk" class="button button-danger">OK</button><button id="confirmCancel" class="button button-secondary">Cancel</button></div>`;
            modal.appendChild(content); document.body.appendChild(modal);
            return new Promise((resolve) => {
                document.getElementById('confirmOk').onclick = () => { document.body.removeChild(modal); resolve(true); };
                document.getElementById('confirmCancel').onclick = () => { document.body.removeChild(modal); resolve(false); };
            });
        };
        return () => { const modal = document.getElementById('custom-confirm-modal'); if (modal) modal.remove(); delete window.customConfirm;  };
    }, []);

    // --- Recent Task Click Handler ---
    const handleRecentTaskClick = (task) => {
        if (task.year && typeof task.month === 'string' && task.day) {
            const monthIndex = MONTHS.indexOf(task.month);
            if (monthIndex > -1) {
                setSelectedYear(task.year);
                setSelectedMonth(monthIndex); 
                const daysForNewMonth = getDaysInMonth(task.year, monthIndex);
                if (daysForNewMonth.includes(task.day)) {
                    setSelectedDay(task.day);
                } else {
                    setSelectedDay(null); 
                    console.warn(`Day ${task.day} not valid for ${task.month} ${task.year}. Day reset.`);
                }
            } else {
                console.warn("Could not find month index for recent task:", task.month);
            }
        }
    };

    // --- Settings Handlers ---
    const handleToggleTheme = async () => {
        const newTheme = appTheme === 'dark' ? 'light' : 'dark';
        if (!db || !user || !appId) {
            setSettingsMessage("Cannot save theme: user or database not available.");
            return;
        }
        const prefDocRef = doc(db, `artifacts/${appId}/users/${user.uid}/userConfiguration`, "appPreferencesDoc");
        try {
            await setDoc(prefDocRef, { theme: newTheme }, { merge: true });
            setSettingsMessage("Theme saved!"); 
            setTimeout(() => setSettingsMessage(''), 2000);
        } catch (error) {
            console.error("Error saving theme:", error);
            setSettingsMessage("Failed to save theme.");
        }
    };

    const handleSaveNickname = async () => {
        const trimmedNickname = newNicknameInput.trim();
        if (!trimmedNickname) {
            setSettingsMessage("Nickname cannot be empty.");
            return;
        }
        if (!db || !user || !appId) {
            setSettingsMessage("Cannot save nickname: user or database not available.");
            return;
        }
        const prefDocRef = doc(db, `artifacts/${appId}/users/${user.uid}/userConfiguration`, "appPreferencesDoc");
        try {
            await setDoc(prefDocRef, { nickname: trimmedNickname }, { merge: true });
            setSettingsMessage("Nickname saved!"); 
            setTimeout(() => setSettingsMessage(''), 2000);
        } catch (error) {
            console.error("Error saving nickname:", error);
            setSettingsMessage("Failed to save nickname.");
        }
    };

    const handleAddCompanion = async () => {
        const trimmedCompanionUid = newCompanionUidInput.trim();
        const trimmedCompanionNickname = newCompanionNicknameInput.trim();

        if (!trimmedCompanionUid) {
            setSettingsMessage("Companion User ID cannot be empty."); return;
        }
        if (!trimmedCompanionNickname) {
            setSettingsMessage("Companion Nickname cannot be empty."); return;
        }
        if (user && trimmedCompanionUid === user.uid) { 
            setSettingsMessage("You cannot add yourself as a companion."); return;
        }
        if (companions.find(c => c.uid === trimmedCompanionUid)) { 
            setSettingsMessage("This user is already a companion.");
            setNewCompanionUidInput(''); 
            setNewCompanionNicknameInput('');
            return;
        }
        if (!db || !user || !appId) {
            setSettingsMessage("Cannot add companion: user or database not available."); return;
        }
        const prefDocRef = doc(db, `artifacts/${appId}/users/${user.uid}/userConfiguration`, "appPreferencesDoc");
        const newCompanion = { uid: trimmedCompanionUid, nickname: trimmedCompanionNickname };
        try {
            await setDoc(prefDocRef, { companions: arrayUnion(newCompanion) }, { merge: true });
            setNewCompanionUidInput(''); 
            setNewCompanionNicknameInput('');
            setSettingsMessage("Companion added successfully!");
            setTimeout(() => setSettingsMessage(''), 2000);
        } catch (error) {
            console.error("Error adding companion:", error);
            setSettingsMessage("Failed to add companion.");
        }
    };

    const handleRemoveCompanion = async (companionUidToRemove) => {
        if (!db || !user || !appId) {
            setSettingsMessage("Cannot remove companion: user or database not available."); return;
        }
        const prefDocRef = doc(db, `artifacts/${appId}/users/${user.uid}/userConfiguration`, "appPreferencesDoc");
        const companionToRemove = companions.find(c => c.uid === companionUidToRemove);
        if (!companionToRemove) {
            setSettingsMessage("Companion not found in your list.");
            return;
        }
        try {
            await setDoc(prefDocRef, { companions: arrayRemove(companionToRemove) }, { merge: true });
            if (selectedCompanionForViewing && selectedCompanionForViewing.uid === companionUidToRemove) {
                setSelectedCompanionForViewing(null); 
                setViewMode('myTasks'); 
            }
            setSettingsMessage("Companion removed.");
            setTimeout(() => setSettingsMessage(''), 2000);
        } catch (error) {
            console.error("Error removing companion:", error);
            setSettingsMessage("Failed to remove companion.");
        }
    };

    const toggleViewMode = () => {
        if (viewMode === 'myTasks') {
            if (companions && companions.length > 0) {
                setViewMode('companionTasks');
                if (!selectedCompanionForViewing && companions[0]) {
                    setSelectedCompanionForViewing(companions[0]);
                } else if (selectedCompanionForViewing && !companions.find(c => c.uid === selectedCompanionForViewing.uid)){
                    setSelectedCompanionForViewing(companions[0] || null);
                }
            } else {
                setGeneralError("You don't have any companions set up to view their tasks.");
                 setTimeout(() => setGeneralError(''), 3000);
            }
        } else { 
            setViewMode('myTasks');
            setSelectedCompanionForViewing(null); 
        }
        setSelectedYear(null); setSelectedMonth(null); setSelectedDay(null); setTasks([]); 
    };

    const selectCompanionToView = (companionObject) => { 
        setSelectedCompanionForViewing(companionObject);
        setSelectedYear(null); setSelectedMonth(null); setSelectedDay(null); setTasks([]);
    };


    // --- Render Logic ---
    if (!isAuthReady && !generalError) { return (<div className="loading-screen"><div className="loading-text">Initializing...</div><div className="loading-spinner"></div></div>); }
    
    // Auth View
    if (!user) { 
        return (
            <div className="auth-screen">
                <div className="auth-container">
                    <h1 className="auth-title">{isLoginView ? 'Login to Task Manager' : 'Register for Task Manager'}</h1>
                    {authError && <div className="error-message auth-error">{authError}</div>}
                    {generalError && <div className="error-message auth-error">{generalError}</div>}
                    <form onSubmit={handleAuthAction} className="auth-form">
                        {!isLoginView && (
                            <div className="form-group">
                                <label htmlFor="displayName">Display Name</label>
                                <input type="text" id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required={!isLoginView} placeholder="Your Name" className="form-group-input"/>
                            </div>
                        )}
                        <div className="form-group">
                            <label htmlFor="email">Email Address</label>
                            <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" className="form-group-input"/>
                        </div>
                        <div className="form-group">
                            <label htmlFor="password">Password</label>
                            <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" className="form-group-input"/>
                        </div>
                        <button type="submit" className="button button-primary button-full-width">
                            {isLoginView ? 'Login' : 'Register'}
                        </button>
                    </form>
                    <button onClick={() => { setIsLoginView(!isLoginView); setAuthError(''); setEmail(''); setPassword(''); setDisplayName(''); }} className="auth-toggle-button">
                        {isLoginView ? 'Need an account? Register' : 'Already have an account? Login'}
                    </button>
                </div>
                <footer className="app-footer auth-footer"><p>&copy; {CURRENT_YEAR} {appNickname}</p></footer>
            </div>
        ); 
    }
    
    // Main App View
    return (
        <div className="app-layout"> 
            <SettingsModal 
                isOpen={isSettingsModalOpen}
                onClose={() => {setIsSettingsModalOpen(false); setSettingsMessage('');}}
                appTheme={appTheme}
                onToggleTheme={handleToggleTheme}
                currentAppNickname={appNickname}
                newNicknameInput={newNicknameInput}
                onNewNicknameInputChange={setNewNicknameInput} 
                onSaveNickname={handleSaveNickname}
                manageableYears={manageableYears}
                isLoadingYears={isLoadingYears}
                yearManagementError={yearManagementError}
                newYearToAdd={newYearToAdd}
                onNewYearToAddChange={setNewYearToAdd} 
                onAddYear={handleAddYear}
                onDeleteYear={handleDeleteYear}
                companions={companions} 
                newCompanionUidInput={newCompanionUidInput}
                onNewCompanionUidInputChange={setNewCompanionUidInput} 
                newCompanionNicknameInput={newCompanionNicknameInput} 
                onNewCompanionNicknameInputChange={setNewCompanionNicknameInput} 
                onAddCompanion={handleAddCompanion} 
                onRemoveCompanion={handleRemoveCompanion}
                settingsMessage={settingsMessage}
                currentUserUid={user?.uid} 
            /> 
            <aside className="sidebar">
                <h2 className="sidebar-title">
                    {viewMode === 'companionTasks' && selectedCompanionForViewing ? `${selectedCompanionForViewing.nickname}'s Tasks` : appNickname}
                </h2>
                <div className="view-mode-toggle">
                    <button 
                        onClick={toggleViewMode} 
                        className={`button button-secondary ${viewMode === 'myTasks' ? 'active' : ''}`}
                        disabled={!companions || companions.length === 0} 
                    >
                        {viewMode === 'myTasks' ? "View Companion's Tasks" : "View My Tasks"}
                    </button>
                </div>

                {viewMode === 'companionTasks' && companions && companions.length > 0 && (
                    <div className="companion-selection-sidebar">
                        <h3 className="sidebar-subtitle">Select Companion:</h3>
                        <ul className="companion-list-sidebar">
                            {companions.map(comp => ( 
                                <li 
                                    key={comp.uid} 
                                    onClick={() => selectCompanionToView(comp)} 
                                    className={`companion-list-item ${selectedCompanionForViewing?.uid === comp.uid ? 'active' : ''}`}
                                >
                                    {comp.nickname}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                
                { (viewMode === 'myTasks' || (viewMode === 'companionTasks' && selectedCompanionForViewing)) && (
                    <>
                        <h3 className="sidebar-subtitle">Recent Tasks
                            {viewMode === 'companionTasks' && selectedCompanionForViewing && ` (for ${selectedCompanionForViewing.nickname})`}
                        </h3>
                        {isLoadingRecentTasks && <p className="sidebar-loading">Loading recent tasks...</p>}
                        {recentTasksError && <div className="error-message sidebar-error">{recentTasksError}</div>}
                        {!isLoadingRecentTasks && recentTasks.length === 0 && !recentTasksError && (
                            <p className="sidebar-empty">No recent tasks found.</p>
                        )}
                        {!isLoadingRecentTasks && recentTasks.length > 0 && (
                            <ul className="recent-tasks-list">
                                {recentTasks.map(task => (
                                    <li key={task.id} className="recent-task-item" onClick={() => handleRecentTaskClick(task)} title={`Go to task: ${task.text}`}>
                                        <span className="recent-task-text">{task.text}</span>
                                        <span className="recent-task-date">{task.month} {task.day}, {task.year}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </>
                )}


            </aside>

            <main className="main-content-area">
                <div className="main-container"> 
                    <header className="app-header">
                        <div>
                            <h1 className="main-title">
                                {viewMode === 'companionTasks' && selectedCompanionForViewing ? `${selectedCompanionForViewing.nickname}'s Tasks` : appNickname}
                            </h1>
                            {user && <p className="user-email-display">Logged in as: {user.displayName || user.email}</p>}
                            {user && <p className="user-uid-display">My User ID: {user.uid}</p>}
                            <p className="created-by-display">Created by MOHD SHAHRUKH</p>
                        </div>
                        <div className="header-actions"> 
                            <button onClick={() => setIsSettingsModalOpen(true)} className="button-icon settings-button" title="App Settings">
                                <svg xmlns="http://www.w3.org/2000/svg" className="icon" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                                </svg>
                                <span>Options</span>
                            </button>
                            <button onClick={handleLogout} className="button button-logout">Logout</button>
                        </div>
                    </header>

                    {generalError && <div className="error-message main-error">{generalError}</div>}

                    <section className="date-selection-section card">
                        <h2 className="section-title">Select Date</h2> 
                        <div className="date-selectors-grid"> 
                            <div className="form-group">
                                <label htmlFor="year-select">Year</label>
                                <select id="year-select" value={selectedYear ?? ''} onChange={handleYearChange} disabled={isLoadingYears || manageableYears.length === 0}>
                                    <option value="" disabled>{isLoadingYears ? "Loading..." : "Select Year"}</option>
                                    {manageableYears.map(year => <option key={year} value={year}>{year}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label htmlFor="month-select">Month</label>
                                <select id="month-select" value={selectedMonth ?? ''} onChange={handleMonthChange} disabled={selectedYear === null}>
                                    <option value="" disabled>Select Month</option>
                                    {MONTHS.map((month, index) => <option key={index} value={index}>{month}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label htmlFor="day-select">Day</label>
                                <select id="day-select" value={selectedDay ?? ''} onChange={handleDayChange} disabled={selectedMonth === null || daysInSelectedMonth.length === 0}>
                                    <option value="" disabled>Select Day</option>
                                    {daysInSelectedMonth.map(day => <option key={day} value={day}>{day}</option>)}
                                </select>
                            </div>
                        </div>
                    </section>

                    {selectedYear !== null && selectedMonth !== null && selectedDay !== null && (
                        <section className="tasks-section">
                            <h2 className="section-title">
                                Tasks for {MONTHS[selectedMonth]} {selectedDay}, {selectedYear}
                                {viewMode === 'companionTasks' && selectedCompanionForViewing && ` (${selectedCompanionForViewing.nickname}'s Tasks - Read Only)`}
                            </h2>
                            <form onSubmit={handleAddTask} className="add-task-form">
                                <input 
                                    type="text" 
                                    value={newTaskText} 
                                    onChange={(e) => setNewTaskText(e.target.value)} 
                                    placeholder="Enter new task..." 
                                    className="task-input-field form-group-input"
                                    disabled={viewMode === 'companionTasks'} 
                                />
                                <button 
                                    type="submit" 
                                    className="button button-primary add-task-button"
                                    disabled={viewMode === 'companionTasks'} 
                                >
                                    Add Task
                                </button>
                            </form>
                            {isLoadingTasks && <p className="loading-text-tasks">Loading tasks...</p>}
                            {!isLoadingTasks && tasks.length === 0 && <p className="no-tasks-message">No tasks for this date. {viewMode !== 'companionTasks' && "Add one!"}</p>}
                            {!isLoadingTasks && tasks.length > 0 && (
                                <ul className="task-list">
                                    {tasks.map(task => (
                                        <li key={task.id} className={`task-item ${task.completed ? 'completed' : ''}`}>
                                            <div className="task-item-content">
                                                <input 
                                                    type="checkbox" 
                                                    checked={task.completed} 
                                                    onChange={() => handleToggleTaskComplete(task.id, task.completed)} 
                                                    className="task-checkbox"
                                                    disabled={viewMode === 'companionTasks'} 
                                                />
                                                <span className="task-text">{task.text}</span>
                                            </div>
                                            <button 
                                                onClick={() => handleDeleteTask(task.id)} 
                                                className="button-icon delete-task-button" 
                                                title="Delete task"
                                                disabled={viewMode === 'companionTasks'} 
                                                style={{ visibility: viewMode === 'companionTasks' ? 'hidden' : 'visible' }} 
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="icon" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>
                    )}
                    {selectedYear !== null && selectedMonth !== null && selectedDay === null && daysInSelectedMonth.length > 0 && (
                        <p className="info-message">Please select a day to view or add tasks.</p>
                    )}
                    {selectedYear !== null && selectedMonth === null && (
                        <p className="info-message">Please select a month.</p>
                    )}
                    {selectedYear === null && manageableYears.length > 0 && ( 
                        <p className="info-message">Please select a year to begin.</p>
                    )}
                </div> 
                <footer className="app-footer main-app-footer">
                    <p>&copy; {CURRENT_YEAR} {appNickname}</p> 
                </footer>
            </main> 
        </div> 
    );
}

export default App;
