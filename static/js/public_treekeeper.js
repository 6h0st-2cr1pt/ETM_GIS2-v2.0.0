// State management
let selectedCoordinates = null;
let selectedImageBlob = null;
let map = null;
let mapMarker = null;
let cameraStream = null;
const L = window.L; // Declare the L variable

// PAGE NAVIGATION
function goToHome() {
    const homePage = document.getElementById('homePage');
    const uploadPage = document.getElementById('uploadPage');
    if (homePage) homePage.classList.add('active');
    if (uploadPage) uploadPage.classList.remove('active');
}

function goToUpload() {
    const homePage = document.getElementById('homePage');
    const uploadPage = document.getElementById('uploadPage');
    if (homePage) homePage.classList.remove('active');
    if (uploadPage) uploadPage.classList.add('active');
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
    const userName = document.getElementById('userName');
    const treeDescription = document.getElementById('treeDescription');
    const latitude = document.getElementById('latitude');
    const longitude = document.getElementById('longitude');
    const imageInput = document.getElementById('imageInput');

    if (!userName || !treeDescription || !latitude || !longitude) {
        console.log('Some form elements not found, allowing Django validation');
        return true; // Let Django handle validation if elements don't exist
    }

    // Check if image is selected - check both imageInput and selectedImageBlob
    let imageError = '';
    const hasImage = (imageInput && imageInput.files && imageInput.files.length > 0) || selectedImageBlob;
    if (!hasImage) {
        imageError = 'Image is required';
        showError('imageError', imageError);
    } else {
        showError('imageError', '');
    }

    const errors = {
        name: validateField('name', userName.value),
        description: validateField('description', treeDescription.value),
        image: imageError,
        latitude: validateField('latitude', latitude.value),
        longitude: validateField('longitude', longitude.value)
    };

    const hasErrors = Object.values(errors).some(error => error);
    console.log('Validation errors:', errors);
    
    if (hasErrors) {
        // Scroll to first error
        const firstErrorField = Object.keys(errors).find(key => errors[key]);
        if (firstErrorField) {
            const errorElement = document.getElementById(firstErrorField + 'Error');
            if (errorElement) {
                errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
        return false;
    }

    return true;
}

// FORM HANDLING - Wait for DOM to be ready
(function() {
    function attachFormHandler() {
        const treeForm = document.getElementById('treeForm');
        if (treeForm) {
            console.log('Form found, attaching submit handler');
            treeForm.addEventListener('submit', function(e) {
                console.log('Form submit event triggered');
                
                // Basic validation - check required fields
                const userName = document.getElementById('userName');
                const treeDescription = document.getElementById('treeDescription');
                const latitude = document.getElementById('latitude');
                const longitude = document.getElementById('longitude');
                const imageInput = document.getElementById('imageInput');
                
                let hasErrors = false;
                let errorMessage = 'Please fill in the following fields:\n';
                
                if (!userName || !userName.value.trim()) {
                    hasErrors = true;
                    errorMessage += '- Your Name\n';
                }
                if (!treeDescription || !treeDescription.value.trim()) {
                    hasErrors = true;
                    errorMessage += '- Tree Description\n';
                }
                if (!latitude || !latitude.value.trim()) {
                    hasErrors = true;
                    errorMessage += '- Latitude\n';
                }
                if (!longitude || !longitude.value.trim()) {
                    hasErrors = true;
                    errorMessage += '- Longitude\n';
                }
                if (!imageInput || !imageInput.files || imageInput.files.length === 0) {
                    hasErrors = true;
                    errorMessage += '- Tree Image\n';
                }
                
                if (hasErrors) {
                    e.preventDefault();
                    alert(errorMessage);
                    return false;
                }
                
                // Show confirmation dialog
                const confirmed = confirm(
                    'Are you sure you want to submit this tree documentation?\n\n' +
                    'This will save the data to the database. Please confirm to proceed.'
                );
                
                if (!confirmed) {
                    e.preventDefault();
                    return false;
                }
                
                // Show loading state
                const submitBtn = this.querySelector('button[type="submit"]');
                if (submitBtn) {
                    const originalText = submitBtn.innerHTML;
                    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
                    submitBtn.disabled = true;
                    
                    // Re-enable after a delay in case of error
                    setTimeout(() => {
                        submitBtn.innerHTML = originalText;
                        submitBtn.disabled = false;
                    }, 10000);
                }
                
                // Allow form to submit
                console.log('Form submission proceeding...');
                return true;
            });
        } else {
            console.log('Form not found yet, will retry...');
            setTimeout(attachFormHandler, 100);
        }
    }
    
    // Try to attach immediately
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', attachFormHandler);
    } else {
        attachFormHandler();
    }
})();

// Real-time validation
const userNameInput = document.getElementById('userName');
if (userNameInput) {
    userNameInput.addEventListener('blur', function() {
        validateField('name', this.value);
    });
}

const treeDescriptionInput = document.getElementById('treeDescription');
if (treeDescriptionInput) {
    treeDescriptionInput.addEventListener('blur', function() {
        validateField('description', this.value);
    });
}

const latitudeInput = document.getElementById('latitude');
if (latitudeInput) {
    latitudeInput.addEventListener('blur', function() {
        validateField('latitude', this.value);
    });
}

const longitudeInput = document.getElementById('longitude');
if (longitudeInput) {
    longitudeInput.addEventListener('blur', function() {
        validateField('longitude', this.value);
    });
}

// IMAGE HANDLING
const imageInput = document.getElementById('imageInput');
if (imageInput) {
    imageInput.addEventListener('change', async function(e) {
        const file = e.target.files[0];
        if (file) {
            await handleImageFile(file);
        }
    });
}

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
        if (preview) {
            preview.innerHTML = `<img src="${e.target.result}" alt="Tree preview">`;
            showError('imageError', '');
        }
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
    if (!modal) return;

    modal.classList.add('active');

    try {
        cameraStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' }
        });

        const video = document.getElementById('cameraVideo');
        if (video) {
            video.srcObject = cameraStream;
        }
    } catch (error) {
        console.error('Camera access denied:', error);
        alert('Unable to access camera. Please check permissions.');
        modal.classList.remove('active');
    }
}

function capturePhoto() {
    const video = document.getElementById('cameraVideo');
    const canvas = document.getElementById('cameraCanvas');
    if (!video || !canvas) return;

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
        
        // Set the file on the image input
        const imageInput = document.getElementById('imageInput');
        if (imageInput) {
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            imageInput.files = dataTransfer.files;
        }
        
        await handleImageFile(file);
        closeCameraModal();
    }, 'image/jpeg', 0.9);
}

function closeCameraModal() {
    const modal = document.getElementById('cameraModal');
    if (modal) {
        modal.classList.remove('active');
    }

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

    const latInput = document.getElementById('latitude');
    const lonInput = document.getElementById('longitude');
    if (!latInput || !lonInput) return;

    // Show loading state
    latInput.value = 'Getting location...';
    lonInput.value = 'Getting location...';

    navigator.geolocation.getCurrentPosition(
        function(position) {
            const { latitude, longitude } = position.coords;

            // Format to 6 decimal places
            const lat = latitude.toFixed(6);
            const lon = longitude.toFixed(6);

            // Check if coordinates are within Negros Island bounds
            if (lat >= 8 && lat <= 11 && lon >= 122 && lon <= 125) {
                latInput.value = lat;
                lonInput.value = lon;
                selectedCoordinates = { latitude: lat, longitude: lon };
                showError('latError', '');
                showError('longError', '');
            } else {
                latInput.value = '';
                lonInput.value = '';
                showError('latError', 'Location is outside Negros Island bounds');
                showError('longError', 'Location is outside Negros Island bounds');
            }
        },
        function(error) {
            latInput.value = '';
            lonInput.value = '';

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
    if (!modal) return;

    modal.classList.add('active');

    // Initialize map if not already done
    if (!map && L) {
        const mapElement = document.getElementById('map');
        if (mapElement) {
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
        }
    } else if (map) {
        // Trigger resize to ensure proper rendering
        setTimeout(() => {
            map.invalidateSize();
        }, 100);
    }
}

function confirmMapLocation() {
    if (selectedCoordinates) {
        const latInput = document.getElementById('latitude');
        const lonInput = document.getElementById('longitude');
        if (latInput && lonInput) {
            latInput.value = selectedCoordinates.latitude;
            lonInput.value = selectedCoordinates.longitude;
            showError('latError', '');
            showError('longError', '');
        }
        closeMapModal();
    } else {
        alert('Please click on the map to select a location');
    }
}

function closeMapModal() {
    const modal = document.getElementById('mapModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// SUCCESS MODAL
function showSuccessModal() {
    const modal = document.getElementById('successModal');
    if (modal) {
        modal.classList.add('active');
    }
}

function clearForm() {
    // Reset form
    const form = document.getElementById('treeForm');
    if (form) {
        form.reset();
    }
    selectedImageBlob = null;
    selectedCoordinates = null;

    // Reset image preview
    const preview = document.getElementById('imagePreview');
    if (preview) {
        preview.innerHTML = `<i class="fas fa-image"></i><p>No image selected</p>`;
    }

    // Clear input fields
    const latInput = document.getElementById('latitude');
    const lonInput = document.getElementById('longitude');
    const userName = document.getElementById('userName');
    const treeDescription = document.getElementById('treeDescription');
    const imageInput = document.getElementById('imageInput');
    
    if (latInput) latInput.value = '';
    if (lonInput) lonInput.value = '';
    if (userName) userName.value = '';
    if (treeDescription) treeDescription.value = '';
    if (imageInput) imageInput.value = '';

    // Clear all error messages
    document.querySelectorAll('.error-msg').forEach(el => {
        el.textContent = '';
        el.style.display = 'none';
    });

    // Reset map marker if exists
    if (mapMarker && map) {
        map.removeLayer(mapMarker);
        mapMarker = null;
    }
}

function resetForm() {
    // Close modal
    const successModal = document.getElementById('successModal');
    if (successModal) {
        successModal.classList.remove('active');
    }

    // Use clearForm function
    clearForm();
}

// Close modals when clicking outside
window.addEventListener('click', function(event) {
    const mapModal = document.getElementById('mapModal');
    const cameraModal = document.getElementById('cameraModal');
    const successModal = document.getElementById('successModal');

    if (event.target === mapModal && mapModal) {
        mapModal.classList.remove('active');
    }
    if (event.target === cameraModal && cameraModal) {
        closeCameraModal();
    }
    if (event.target === successModal && successModal) {
        successModal.classList.remove('active');
    }
});

// Initialize on page load
window.addEventListener('load', function() {
    console.log('TreeKeeper app initialized');
});

