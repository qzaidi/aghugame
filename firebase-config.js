// Firebase configuration
// Replace these values with your actual Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyDnSIPfPSQsh8csL1XU9xBg4RZ8OglL8-I",
  authDomain: "aghugame.firebaseapp.com",
  projectId: "aghugame",
  storageBucket: "aghugame.firebasestorage.app",
  messagingSenderId: "730711168764",
  appId: "1:730711168764:web:b05640d14f885c533ea979",
  databaseURL: "https://aghugame-default-rtdb.firebaseio.com"
};

// Initialize Firebase
function initializeFirebase() {
  // Check if Firebase is already loaded
  if (typeof firebase === 'undefined') {
    console.error('Firebase SDK not loaded. Make sure to include the Firebase scripts.');
    return false;
  }
  
  try {
    // Check if Firebase is already initialized
    if (firebase.apps && firebase.apps.length > 0) {
      console.log('Firebase already initialized, using existing instance');
      return true;
    }
    
    // Log Firebase version
    console.log('Firebase SDK version:', firebase.SDK_VERSION);
    
    // Initialize Firebase app
    firebase.initializeApp(firebaseConfig);
    console.log('Firebase initialized successfully with config:', JSON.stringify({
      projectId: firebaseConfig.projectId,
      authDomain: firebaseConfig.authDomain,
      databaseURL: firebaseConfig.databaseURL
    }));
    
    // Verify auth is available
    if (firebase.auth) {
      console.log('Firebase Auth is available');
    } else {
      console.error('Firebase Auth is not available');
    }
    
    return true;
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    return false;
  }
}

// Authentication functions
async function signInAnonymously() {
  try {
    console.log('Attempting to sign in anonymously with Firebase config:', JSON.stringify(firebaseConfig));
    const userCredential = await firebase.auth().signInAnonymously();
    console.log('User signed in anonymously:', userCredential.user.uid);
    return userCredential.user;
  } catch (error) {
    console.error('Error signing in anonymously:', error);
    // Log more details about the error
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    return null;
  }
}

async function createUserWithNameAndPlay(userName) {
  try {
    // First sign in anonymously
    const user = await signInAnonymously();
    if (!user) return null;
    
    // Save the user name to the database
    const userRef = firebase.database().ref('users/' + user.uid);
    await userRef.set({
      name: userName,
      createdAt: firebase.database.ServerValue.TIMESTAMP
    });
    
    console.log('User profile created for:', userName);
    return user;
  } catch (error) {
    console.error('Error creating user profile:', error);
    return null;
  }
}

// High score functions
async function saveHighScore(userId, userName, score) {
  if (!userId || !userName) return false;

  try {
    // Get reference to high scores in database
    const highScoresRef = firebase.database().ref('highScores');
    
    // Get all current high scores, ordered by score
    const snapshot = await highScoresRef.orderByChild('score').once('value');
    const currentHighScores = [];
    
    // Convert snapshot to array of high score objects
    snapshot.forEach((childSnapshot) => {
      currentHighScores.push({
        id: childSnapshot.key,
        ...childSnapshot.val()
      });
    });

    // Sort in ascending order (lowest scores first)
    currentHighScores.sort((a, b) => a.score - b.score);
    console.log('Current high scores:', currentHighScores.map(s => s.score));

    const MAX_HIGH_SCORES = 5;

    // If less than MAX_HIGH_SCORES, always add the score
    if (currentHighScores.length < MAX_HIGH_SCORES) {
      console.log(`Adding score ${score} (less than ${MAX_HIGH_SCORES} high scores exist)`);
      const newScoreRef = highScoresRef.push();
      await newScoreRef.set({
        userId: userId,
        userName: userName,
        score: score,
        timestamp: firebase.database.ServerValue.TIMESTAMP
      });
      console.log('Score added successfully');
      return true;
    } else if (score > currentHighScores[0].score) {
      // If we have MAX_HIGH_SCORES or more, only add if score is higher than the lowest
      console.log(`New score ${score} is higher than lowest ${currentHighScores[0].score}, replacing it`);
      
      // Remove the lowest score
      await highScoresRef.child(currentHighScores[0].id).remove();

      // Add the new higher score
      const newScoreRef = highScoresRef.push();
      await newScoreRef.set({
        userId: userId,
        userName: userName,
        score: score,
        timestamp: firebase.database.ServerValue.TIMESTAMP
      });
      console.log('New high score added successfully, replaced lowest score');
      return true;
    } else {
      console.log(`Score ${score} not high enough to be in top ${MAX_HIGH_SCORES}`);
      return false;
    }

    // Also update the user's personal best if this is higher
    const userRef = firebase.database().ref('users/' + userId);
    const userSnapshot = await userRef.once('value');
    const userData = userSnapshot.val() || {};

    if (!userData.highScore || score > userData.highScore) {
      await userRef.update({
        highScore: score,
        lastPlayed: firebase.database.ServerValue.TIMESTAMP
      });
    }

    return true;
  } catch (error) {
    console.error('Error saving high score:', error);
    return false;
  }
}

async function getTopHighScores(limit = 10) {
  try {
    const highScoresRef = firebase.database().ref('highScores');
    const snapshot = await highScoresRef.orderByChild('score')
      .limitToLast(limit)
      .once('value');
    
    const highScores = [];
    snapshot.forEach((childSnapshot) => {
      highScores.push({
        id: childSnapshot.key,
        ...childSnapshot.val()
      });
    });
    
    // Sort in descending order (highest first)
    return highScores.sort((a, b) => b.score - a.score);
  } catch (error) {
    console.error('Error getting high scores:', error);
    return [];
  }
}

// Export the functions
window.firebaseHelper = {
  initializeFirebase,
  signInAnonymously,
  createUserWithNameAndPlay,
  saveHighScore,
  getTopHighScores
};