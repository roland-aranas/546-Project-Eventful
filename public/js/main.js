// client-side validation that throws in the same format as the data.js checks

// events.js

function validateGetEventById(id) {
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
        throw 'Error: You must provide a valid event id';
    }

    id = id.trim();
    return id;
}

function validateCreateEvent({
    title,
    link,
    description,
    registrationUrl,
    registrationDescription,
    startDate,
    endDate,
    startTime,
    endTime,
    contactPhone,
    location,
    image,
    cost,
    eventType
}) {
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
        throw 'Error: You must provide a valid title';
    }
    if (!link || typeof link !== 'string' || link.trim().length === 0) {
        throw 'Error: You must provide a valid link';
    }
    if (!description || typeof description !== 'string' || description.trim().length === 0) {
        throw 'Error: You must provide a valid description';
    }
    if (!startDate || typeof startDate !== 'string' || startDate.trim().length === 0) {
        throw 'Error: You must provide a valid start date';
    }
    if (!endDate || typeof endDate !== 'string' || endDate.trim().length === 0) {
        throw 'Error: You must provide a valid end date';
    }
    if (!startTime || typeof startTime !== 'string' || startTime.trim().length === 0) {
        throw 'Error: You must provide a valid start time';
    }
    if (!endTime || typeof endTime !== 'string' || endTime.trim().length === 0) {
        throw 'Error: You must provide a valid end time';
    }
    if (!location || typeof location !== 'object' || Array.isArray(location)) {
        throw 'Error: You must provide a valid location object';
    }
    if (!location.parkNames || typeof location.parkNames !== 'string' || location.parkNames.trim().length === 0) {
        throw 'Error: You must provide a valid park name';
    }
    if (!location.location || typeof location.location !== 'string' || location.location.trim().length === 0) {
        throw 'Error: You must provide a valid location';
    }
    if (!location.coordinates || typeof location.coordinates !== 'object'
    ) {
        throw 'Error: You must provide valid coordinates';
    }
    if (typeof location.coordinates.lat !== 'number' ||typeof location.coordinates.lng !== 'number') {
        throw 'Error: Coordinates must include numeric lat and lng';
    }
    if (cost === undefined || typeof cost !== 'number' || cost < 0) {
        throw 'Error: You must provide a valid cost';
    }

    title = title.trim();
    link = link.trim();
    description = description.trim();
    startDate = startDate.trim();
    endDate = endDate.trim();
    startTime = startTime.trim();
    endTime = endTime.trim();
    location.parkNames = location.parkNames.trim();
    location.location = location.location.trim();

    return {
        title,
        link,
        description,
        registrationUrl,
        registrationDescription,
        startDate,
        endDate,
        startTime,
        endTime,
        contactPhone,
        location,
        image,
        cost,
        eventType
    };
}

function validateUpdateEvent(id, updates) {
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
        throw 'Error: You must provide a valid event id';
    }

    if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
        throw 'Error: You must provide a valid updates object';
    }

    for (let key of Object.keys(updates)) {
        if (key === 'location') {
            if (typeof updates[key] !== 'object' || Array.isArray(updates[key]) || updates[key] === null) {
                throw 'Error: Update value for location must be an object';
            }
            continue;
        }

        if (
            typeof updates[key] !== 'string' &&
            key !== 'cost' &&
            key !== 'likeCount' &&
            key !== 'comments' &&
            key !== 'reviewList' &&
            key !== 'checkedInList' &&
            key !== 'registeredList'
        ) {
            throw `Error: Update value for ${key} must be a string`;
        }

        if (key === 'cost' || key === 'likeCount') {
            let num = Number(updates[key]);
            if (typeof num !== 'number' || isNaN(num)) {
                throw `Error: Update value for ${key} must be a number`;
            }
            updates[key] = num;
        }

        if (
            (key === 'comments' ||
            key === 'reviewList' ||
            key === 'checkedInList' ||
            key === 'registeredList') &&
            !Array.isArray(updates[key])
        ) {
            throw `Error: Update value for ${key} must be an array`;
        }
    }

    return { id: id.trim(), updates };
}

function validateAddComment(eventId, userId, textContent) {
    if (!eventId || typeof eventId !== 'string' || eventId.trim().length === 0) {
        throw 'Invalid IDs';
    }

    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
        throw 'Invalid IDs';
    }

    if (!textContent || typeof textContent !== 'string' || !textContent.trim()) {
        throw 'Invalid comment text';
    }

    return {
        eventId: eventId.trim(),
        userId: userId.trim(),
        textContent: textContent.trim()
    };
}

function validateAddReview(eventId, userId, username, rating, textContent, eventData) {
    if (!eventId || typeof eventId !== 'string' || eventId.trim().length === 0) {
        throw 'Invalid IDs';
    }

    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
        throw 'Invalid IDs';
    }

    rating = Number(rating);
    if (typeof rating !== 'number' || isNaN(rating) || rating < 1 || rating > 5) {
        throw 'Rating must be between 1 and 5';
    }

    const checkedIn = eventData.checkedInList.some(
        (id) => id.toString() === userId
    );

    if (!checkedIn) {
        throw 'User must check in before reviewing';
    }

    if (eventData.reviewList.some((r) => r.userID.toString() === userId)) {
        throw 'User already reviewed this event';
    }

    return {
        eventId: eventId.trim(),
        userId: userId.trim(),
        username,
        rating,
        textContent
    };
}

function validateLikeComment(eventData, commentId, userId) {
    if (!eventData || !Array.isArray(eventData.comments)) {
        throw 'Invalid event data';
    }

    const comment = eventData.comments.find(
        (c) => c._id.toString() === commentId
    );

    if (!comment) {
        throw 'Comment not found';
    }

    if (comment.likedBy.some((id) => id.toString() === userId)) {
        throw 'User already liked this comment';
    }

    return { eventData, commentId: commentId.trim(), userId: userId.trim() };
}

function validateLikeReview(eventData, reviewId, userId) {
    if (!eventData || !Array.isArray(eventData.reviewList)) {
        throw 'Invalid event data';
    }

    const review = eventData.reviewList.find(
        (r) => r._id.toString() === reviewId
    );

    if (!review) {
        throw 'Review not found';
    }

    if (review.likedBy && review.likedBy.some((id) => id.toString() === userId)) {
        throw 'User already liked this review';
    }

    return { eventData, reviewId: reviewId.trim(), userId: userId.trim() };
}

// location.js


function validateLocation(location) {
    if (!location || typeof location !== 'object' || Array.isArray(location)) {
        throw 'Error: You must provide a valid location object';
    }

    if (!location.parknames || typeof location.parknames !== 'string') {
        throw 'Error: You must provide a valid parknames';
    }
    if (!location.location || typeof location.location !== 'string') {
        throw 'Error: You must provide a valid location';
    }
    if (!location.coordinates || typeof location.coordinates !== 'object'
    ) {
        throw 'Error: You must provide valid coordinates';
    }
    if (typeof location.coordinates.lat !== 'number' ||typeof location.coordinates.lng !== 'number') {
        throw 'Error: Coordinates must include numeric lat and lng';
    }

    return {
        parknames: location.parknames.trim(),
        location: location.location.trim(),
        coordinates: location.coordinates
    };
}

// users.js

function validateUserId(id) {
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
        throw 'Error: User id cannot be an empty string';
    }
    return id.trim();
}

function validateEmail(email) {
    let regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (typeof email !== 'string') {
        throw 'Error: Invalid email';
    }

    email = email.trim().toLowerCase();

    if (!regex.test(email)) {
        throw 'Error: You must provide a valid email';
    }

    return email;
}

function validateUsername(username) {
    if (!username || typeof username !== 'string') {
        throw 'Error: You must provide a valid username string';
    }

    username = username.trim();

    if (username.length === 0) {
        throw 'Error: Username cannot be an empty string';
    }

    return username;
}

function validatePassword(password) {
    if (!password || typeof password !== 'string') {
        throw 'Password must be supplied';
    }
    if (password.trim().length === 0) {
        throw 'Password cannot be empty';
    }
    if (/\s/.test(password)) {
        throw 'Password cannot contain spaces';
    }
    if (!/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])\S{8,}$/.test(password)) {
        throw 'Password must be at least 8 characters and contain an uppercase letter, a number, and a special character';
    }
    return password;
}

(function () {
    function showClientError(form, message) {
        let oldError = form.querySelector('.client-error');
        if (oldError) {
            oldError.remove();
        }
        let error = document.createElement('p');
        error.className = 'client-error error';
        error.textContent = message;
        form.prepend(error);
    }

    // SIGNUP
    let signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', (event) => {
            try {
                let firstName = validateUsername(document.getElementById('firstName').value);
                let lastName = validateUsername(document.getElementById('lastName').value);
                let email = validateEmail(document.getElementById('email').value);
                let username = validateUsername(document.getElementById('username').value);
                let age = Number(document.getElementById('age').value);
                let password = validatePassword(document.getElementById('password').value);
                let borough = document.getElementById('borough').value;

                if (isNaN(age) || age < 13) {
                    throw 'You must be at least 13 years old to create an account';
                }
                if (!borough || borough.trim().length === 0) {
                    throw 'You must select a borough';
                }
            } catch (e) {
                event.preventDefault();
                showClientError(signupForm, e);
            }
        });
    }

    // LOGIN
    let loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (event) => {
            try {
                validateUsername(document.getElementById('username').value);
                let password = document.getElementById('password').value;
                if (!password || password.trim().length === 0) {
                    throw 'Password cannot be empty';
                }
            } catch (e) {
                event.preventDefault();
                showClientError(loginForm, e);
            }
        });
    }

    // REVIEW
    let reviewForm = document.getElementById('review-form');
    if (reviewForm) {
        reviewForm.addEventListener('submit', (event) => {
            try {
                let rating = Number(document.getElementById('rating').value);
                let textContent = document.getElementById('textContent').value;
                if (isNaN(rating) || rating < 1 || rating > 5) {
                    throw 'Rating must be between 1 and 5';
                }
                if (!textContent || textContent.trim().length === 0) {
                    throw 'Review cannot be empty';
                }
            } catch (e) {
                event.preventDefault();
                showClientError(reviewForm, e);
            }
        });
    }

    // COMMENT
    let commentForm = document.getElementById('comment-form');
    if (commentForm) {
        commentForm.addEventListener('submit', (event) => {
            let commentInput = document.getElementById('commentInput');
            let commentError = document.getElementById('commentError');
            if (!commentInput || commentInput.value.trim().length === 0) {
                event.preventDefault();
                if (commentError) {
                    commentError.textContent = 'Comment cannot be empty';
                }
            } else {
                if (commentError) {
                    commentError.textContent = '';
                }
            }
        });
    }
})();

