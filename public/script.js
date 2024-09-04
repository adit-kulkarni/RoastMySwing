// script.js

// Simulate a database
const users = {}; // Object to store user details
const posts = []; // Array to store all posts
let currentUser = null; // Track the currently logged in user

// Helper function to display different sections
function showSection(sectionId) {
    const sections = document.querySelectorAll('main > section');
    sections.forEach(section => {
        section.classList.add('hidden');
    });
    document.getElementById(sectionId).classList.remove('hidden');
}

function showFeed() {
    showSection('feed');
    renderPosts();
}

function showProfile() {
    if (currentUser) {
        showSection('profile-section');
        renderUserPosts();
    } else {
        alert("Please log in to view your profile.");
    }
}

function showLogin() {
    showSection('login-section');
}

function showRegistration() {
    showSection('registration-section');
}

function logout() {
    currentUser = null;
    document.getElementById('profile').style.display = 'none';
    document.getElementById('logout').style.display = 'none';
    document.getElementById('login').style.display = 'block';
    showFeed();
}

// Register new user
document.getElementById('registration-form').addEventListener('submit', function(event) {
    event.preventDefault();
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;

    if (users[username]) {
        alert('Username already taken.');
    } else {
        users[username] = { email, password, posts: [] };
        currentUser = username;
        alert('Registration successful!');
        document.getElementById('profile').style.display = 'block';
        document.getElementById('logout').style.display = 'block';
        document.getElementById('login').style.display = 'none';
        showFeed();
    }
});

// Login user
document.getElementById('login-form').addEventListener('submit', function(event) {
    event.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    if (users[username] && users[username].password === password) {
        currentUser = username;
        alert('Login successful!');
        document.getElementById('profile').style.display = 'block';
        document.getElementById('logout').style.display = 'block';
        document.getElementById('login').style.display = 'none';
        showFeed();
    } else {
        alert('Invalid username or password.');
    }
});

// Upload new post
document.getElementById('upload-form').addEventListener('submit', function(event) {
    event.preventDefault();
    if (!currentUser) {
        alert("Please log in to post a video.");
        return;
    }

    const video = document.getElementById('video-upload').files[0];
    const feedbackType = document.getElementById('feedback-type').value;

    const newPost = {
        username: currentUser,
        videoURL: URL.createObjectURL(video),
        feedbackType,
        comments: []
    };

    posts.push(newPost);
    users[currentUser].posts.push(newPost);
    renderPosts();
    renderUserPosts();
});

// Render posts to the feed
function renderPosts() {
    const container = document.getElementById('posts-container');
    container.innerHTML = '';

    posts.forEach((post, index) => {
        const postElement = document.createElement('div');
        postElement.className = 'post';
        postElement.innerHTML = `
            <video controls>
                <source src="${post.videoURL}" type="video/mp4">
                Your browser does not support the video tag.
            </video>
            <p>Feedback Type: <span class="feedback-type">${post.feedbackType}</span></p>
            <div class="comments" id="comments-${index}">
                <h3>Comments</h3>
                ${renderComments(post.comments, index)}
            </div>
            <form class="comment-form" onsubmit="addComment(event, ${index})">
                <input type="text" placeholder="Add a comment..." required>
                <input type="text" placeholder="Your username" required>
                <input type="text" placeholder="Your handicap" required>
                <button type="submit">Post Comment</button>
            </form>
        `;
        container.appendChild(postElement);
    });
}

// Render comments
function renderComments(comments, postIndex) {
    return comments.map(comment => `
        <div class="comment">
            <p><strong>${comment.username}</strong> (Handicap: ${comment.handicap}): ${comment.text}</p>
        </div>
    `).join('');
}

// Add a comment
function addComment(event, postIndex) {
    event.preventDefault();
    const form = event.target;
    const text = form.querySelector('input[type="text"]').value;
    const username = form.querySelector('input[placeholder="Your username"]').value;
    const handicap = form.querySelector('input[placeholder="Your handicap"]').value;

    const comment = { username, text, handicap };
    posts[postIndex].comments.push(comment);
    renderPosts();
}

// Render user-specific posts
function renderUserPosts() {
    const container = document.getElementById('user-posts-container');
    container.innerHTML = '';

    users[currentUser].posts.forEach((post, index) => {
        const postElement = document.createElement('div');
        postElement.className = 'post';
        postElement.innerHTML = `
            <video controls>
                <source src="${post.videoURL}" type="video/mp4">
                Your browser does not support the video tag.
            </video>
            <p>Feedback Type: <span class="feedback-type">${post.feedbackType}</span></p>
            <div class="comments" id="user-comments-${index}">
                <h3>Comments</h3>
                ${renderComments(post.comments, index)}
            </div>
        `;
        container.appendChild(postElement);
    });
}

// Initial setup
document.addEventListener('DOMContentLoaded', function() {
    if (currentUser) {
        document.getElementById('profile').style.display = 'block';
        document.getElementById('logout').style.display = 'block';
    } else {
        document.getElementById('login').style.display = 'block';
    }
    showFeed();
});


function signUp(email, password) {
    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            console.log('User signed up:', userCredential.user);
        })
        .catch((error) => {
            console.error('Sign-up error:', error.message);
        });
}

function login(email, password) {
    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            console.log('User logged in:', userCredential.user);
        })
        .catch((error) => {
            console.error('Login error:', error.message);
        });
}

function logout() {
    auth.signOut().then(() => {
        console.log('User logged out');
    }).catch((error) => {
        console.error('Logout error:', error.message);
    });
}

function uploadVideo(file, feedbackType) {
    const user = auth.currentUser;
    if (user) {
        const storageRef = storage.ref(`videos/${user.uid}/${file.name}`);
        const uploadTask = storageRef.put(file);

        uploadTask.on('state_changed',
            (snapshot) => {
                // Observe state change events like progress, pause, and resume
            },
            (error) => {
                console.error('Upload error:', error);
            },
            () => {
                // Handle successful uploads on complete
                uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
                    console.log('File available at', downloadURL);

                    // Save video metadata to Firestore
                    db.collection('videos').add({
                        userId: user.uid,
                        feedbackType: feedbackType,
                        videoUrl: downloadURL,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    }).then(() => {
                        console.log('Video metadata saved to Firestore');
                    }).catch((error) => {
                        console.error('Error saving video metadata:', error);
                    });
                });
            }
        );
    } else {
        console.log('No user is signed in');
    }
}

function displayVideos() {
    db.collection('videos').orderBy('createdAt', 'desc').get().then((querySnapshot) => {
        const postsContainer = document.getElementById('posts-container');
        postsContainer.innerHTML = ''; // Clear any existing content

        querySnapshot.forEach((doc) => {
            const videoData = doc.data();
            const postElement = document.createElement('div');
            postElement.classList.add('post');

            // Video element
            const videoElement = document.createElement('video');
            videoElement.src = videoData.videoUrl;
            videoElement.controls = true;
            postElement.appendChild(videoElement);

            // Feedback type
            const feedbackElement = document.createElement('p');
            feedbackElement.classList.add('feedback-type');
            feedbackElement.textContent = `Feedback Type: ${videoData.feedbackType}`;
            postElement.appendChild(feedbackElement);

            // Append post to container
            postsContainer.appendChild(postElement);
        });
    }).catch((error) => {
        console.error('Error fetching videos:', error);
    });
}

// Call displayVideos() when you want to load the feed, e.g., on page load
document.addEventListener('DOMContentLoaded', displayVideos);

