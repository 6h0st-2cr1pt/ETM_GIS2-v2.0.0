// State management
let selectedCoordinates = null;
let selectedImageBlob = null;
let map = null;
let mapMarker = null;
let cameraStream = null;
const L = window.L; // Declare the L variable

// PAGE NAVIGATION
function goToHome() {
    document.getElementById('homePage').classList.add('active');
    document.getElementById('uploadPage').classList.remove('active');
}

function goToUpload() {
    document.getElementById('homePage').classList.remove('active');
    document.getElementById('uploadPage').classList.add('active');
}

// FORM VALIDATION
const validators = {
    name: (value) => {
        if (!value.trim()) return 'Name is required';
        if (value.trim().length < 2) return 'Name must be at least 2 characters';
        if (value.trim().length > 100) return 'Name must not exceed 100 characters';
        return '';
    },

    description: (value) => {
        if (!value.trim()) return 'Tree description is required';
        if (value.trim().length < 10) return 'Description must be at least 10 characters';
        if (value.trim().length > 1000) return 'Description must not exceed 1000 characters';
        return '';
    },

    image: () => {
        if (!selectedImageBlob) return 'Image is required';
        return '';
    },

    latitude: (value) => {
        if (!value.trim()) return 'Latitude is required';
        const lat = parseFloat(value);
        if (isNaN(lat)) return 'Latitude must be a valid number';
        if (lat < 8 || lat > 11) return 'Latitude must be within Negros Island range (8-11)';
        if (!isValidDecimalDegrees(lat)) return 'Invalid decimal degrees format';
        return '';
    },

    longitude: (value) => {
        if (!value.trim()) return 'Longitude is required';
        const lon = parseFloat(value);
        if (isNaN(lon)) return 'Longitude must be a valid number';
        if (lon < 122 || lon > 125) return 'Longitude must be within Negros Island range (122-125)';
        if (!isValidDecimalDegrees(lon)) return 'Invalid decimal degrees format';
        return '';
    }
};

function isValidDecimalDegrees(value) {
    // Check if value has at most 6 decimal places
    const decimalPart = String(value).split('.')[1];
    return !decimalPart || decimalPart.length <= 8;
}

function validateField(fieldName, value) {
    const validator = validators[fieldName];
    if (!validator) return '';

    const error = validator(value);
    const errorElement = document.getElementById(`${fieldName}Error`);

    if (errorElement) {
        errorElement.textContent = error;
        errorElement.style.display = error ? 'block' : 'none';
    }

    return error;
}

function validateForm() {
    const userName = document.getElementById('userName').value;
    const treeDescription = document.getElementById('treeDescription').value;
    const latitude = document.getElementById('latitude').value;
    const longitude = document.getElementById('longitude').value;

    const errors = {
        name: validateField('name', userName),
        description: validateField('description', treeDescription),
        image: validateField('image'),
        latitude: validateField('latitude', latitude),
        longitude: validateField('longitude', longitude)
    };

    return !Object.values(errors).some(error => error);
}

// FORM HANDLING
document.getElementById('treeForm')?.addEventListener('submit', function(e) {
    e.preventDefault();

    if (validateForm()) {
        showSuccessModal();
    }
});

// Real-time validation
document.getElementById('userName')?.addEventListener('blur', function() {
    validateField('name', this.value);
});

document.getElementById('treeDescription')?.addEventListener('blur', function() {
    validateField('description', this.value);
});

document.getElementById('latitude')?.addEventListener('blur', function() {
    validateField('latitude', this.value);
});

document.getElementById('longitude')?.addEventListener('blur', function() {
    validateField('longitude', this.value);
});

// IMAGE HANDLING
document.getElementById('imageInput')?.addEventListener('change', async function(e) {
    const file = e.target.files[0];
    if (file) {
        await handleImageFile(file);
    }
});

async function handleImageFile(file) {
    // Validate file type
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
        showError('imageError', 'Only JPEG and PNG images are allowed');
        return;
    }

    // Validate file size (2MB = 2097152 bytes)
    if (file.size > 2097152) {
        showError('imageError', 'Image size must not exceed 2MB');
        return;
    }

    // Convert file to blob and create preview
    selectedImageBlob = file;
    const reader = new FileReader();

    reader.onload = function(e) {
        const preview = document.getElementById('imagePreview');
        preview.innerHTML = `<img src="${e.target.result}" alt="Tree preview">`;
        showError('imageError', '');
    };

    reader.readAsDataURL(file);
}

function showError(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.style.display = message ? 'block' : 'none';
    }
}

// CAMERA FUNCTIONALITY
async function captureImage() {
    const modal = document.getElementById('cameraModal');
    modal.classList.add('active');

    try {
        cameraStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' }
        });

        const video = document.getElementById('cameraVideo');
        video.srcObject = cameraStream;
    } catch (error) {
        console.error('Camera access denied:', error);
        alert('Unable to access camera. Please check permissions.');
        modal.classList.remove('active');
    }
}

function capturePhoto() {
    const video = document.getElementById('cameraVideo');
    const canvas = document.getElementById('cameraCanvas');
    const ctx = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(async function(blob) {
        if (blob.size > 2097152) {
            alert('Image size exceeds 2MB. Please adjust your camera angle or quality.');
            return;
        }

        // Create a File object from the blob
        const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
        await handleImageFile(file);
        closeCameraModal();
    }, 'image/jpeg', 0.9);
}

function closeCameraModal() {
    const modal = document.getElementById('cameraModal');
    modal.classList.remove('active');

    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
    }
}

// GPS FUNCTIONALITY
function getGPSLocation() {
    if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser');
        return;
    }

    // Show loading state
    document.getElementById('latitude').value = 'Getting location...';
    document.getElementById('longitude').value = 'Getting location...';

    navigator.geolocation.getCurrentPosition(
        function(position) {
            const { latitude, longitude } = position.coords;

            // Format to 6 decimal places
            const lat = latitude.toFixed(6);
            const lon = longitude.toFixed(6);

            // Check if coordinates are within Negros Island bounds
            if (lat >= 8 && lat <= 11 && lon >= 122 && lon <= 125) {
                document.getElementById('latitude').value = lat;
                document.getElementById('longitude').value = lon;
                selectedCoordinates = { latitude: lat, longitude: lon };
                showError('latError', '');
                showError('longError', '');
            } else {
                document.getElementById('latitude').value = '';
                document.getElementById('longitude').value = '';
                showError('latError', 'Location is outside Negros Island bounds');
                showError('longError', 'Location is outside Negros Island bounds');
            }
        },
        function(error) {
            document.getElementById('latitude').value = '';
            document.getElementById('longitude').value = '';

            let errorMessage = 'Unable to get location';
            if (error.code === error.PERMISSION_DENIED) {
                errorMessage = 'Location permission denied. Please enable location access.';
            }

            showError('latError', errorMessage);
            showError('longError', errorMessage);
        }
    );
}

// MAP MODAL FUNCTIONALITY
function openMapModal() {
    const modal = document.getElementById('mapModal');
    modal.classList.add('active');

    // Initialize map if not already done
    if (!map) {
        map = L.map('map').setView([10.2938, 123.8854], 10); // Center of Negros Island

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(map);

        // Add click event to map
        map.on('click', function(e) {
            const { lat, lng } = e.latlng;

            // Remove previous marker
            if (mapMarker) {
                map.removeLayer(mapMarker);
            }

            // Add new marker
            mapMarker = L.marker([lat, lng]).addTo(map);
            selectedCoordinates = { latitude: lat.toFixed(6), longitude: lng.toFixed(6) };
        });
    } else {
        // Trigger resize to ensure proper rendering
        setTimeout(() => {
            map.invalidateSize();
        }, 100);
    }
}

function confirmMapLocation() {
    if (selectedCoordinates) {
        document.getElementById('latitude').value = selectedCoordinates.latitude;
        document.getElementById('longitude').value = selectedCoordinates.longitude;
        showError('latError', '');
        showError('longError', '');
        closeMapModal();
    } else {
        alert('Please click on the map to select a location');
    }
}

function closeMapModal() {
    const modal = document.getElementById('mapModal');
    modal.classList.remove('active');
}

// SUCCESS MODAL
function showSuccessModal() {
    const modal = document.getElementById('successModal');
    modal.classList.add('active');
}

function resetForm() {
    // Close modal
    document.getElementById('successModal').classList.remove('active');

    // Reset form
    document.getElementById('treeForm').reset();
    selectedImageBlob = null;
    selectedCoordinates = null;

    // Reset image preview
    const preview = document.getElementById('imagePreview');
    preview.innerHTML = `<i class="fas fa-image"></i><p>No image selected</p>`;

    // Clear input fields
    document.getElementById('latitude').value = '';
    document.getElementById('longitude').value = '';
    document.getElementById('userName').value = '';
    document.getElementById('treeDescription').value = '';

    // Clear all error messages
    document.querySelectorAll('.error-msg').forEach(el => el.textContent = '');
}

// Close modals when clicking outside
window.addEventListener('click', function(event) {
    const mapModal = document.getElementById('mapModal');
    const cameraModal = document.getElementById('cameraModal');
    const successModal = document.getElementById('successModal');

    if (event.target === mapModal) {
        mapModal.classList.remove('active');
    }
    if (event.target === cameraModal) {
        closeCameraModal();
    }
    if (event.target === successModal) {
        successModal.classList.remove('active');
    }
});

// Initialize on page load
window.addEventListener('load', function() {
    console.log('TreeKeeper app initialized');
});