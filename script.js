let state = {
    cardNumber: '',
    deviceId: '',
    timerInterval: null
};

let profiles = [];

document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);

    const storedProfiles = localStorage.getItem('bf_profiles');
    if (storedProfiles) {
        profiles = JSON.parse(storedProfiles);
        updateProfileSelect();
    }

    const legacyCard = localStorage.getItem('bf_card');
    const legacyDevice = localStorage.getItem('bf_device');
    if (legacyCard && legacyDevice && profiles.length === 0) {
        profiles.push({ name: 'Mon Profil', card: legacyCard, device: legacyDevice });
        saveProfilesToStorage();
        updateProfileSelect();
        localStorage.removeItem('bf_card');
        localStorage.removeItem('bf_device');
    }

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('card') && urlParams.has('device')) {
        state.cardNumber = urlParams.get('card');
        state.deviceId = urlParams.get('device');
        showQrView();
    } else {
        const favIndex = profiles.findIndex(p => p.favorite);
        if (favIndex !== -1) {
            document.getElementById('profileSelect').value = favIndex;
            loadProfile();
            handleLogin();
        } else if (profiles.length > 0) {
            document.getElementById('profileSelect').value = 0;
            loadProfile();
            loadProfile();
        }
    }
    updateUiState();
});

function updateProfileSelect() {
    const select = document.getElementById('profileSelect');
    select.innerHTML = '<option value="">Nouveau profil</option>';

    profiles.forEach((p, index) => {
        const option = document.createElement('option');
        option.value = index;
        const star = p.favorite ? ' ⭐' : '';
        option.textContent = (p.name || `Carte ${p.card}`) + star;
        select.appendChild(option);
    });
}

function loadProfile() {
    const index = document.getElementById('profileSelect').value;
    const favBtn = document.getElementById('favBtn');

    if (index !== "") {
        const p = profiles[index];
        document.getElementById('cardNumber').value = p.card;
        document.getElementById('deviceId').value = p.device;

        favBtn.textContent = p.favorite ? '⭐' : '☆';

        validateCard();
        validateDevice();
    } else {
        document.getElementById('cardNumber').value = '';
        document.getElementById('deviceId').value = '';
        favBtn.textContent = '☆';
        resetValidation();
    }
    updateUiState();
}

function handleMagicUrlInput(input) {
    const urlStr = input.value.trim();
    if (!urlStr) return;

    try {
        // Try to create a URL object, but handle if it's just a query string or partial
        let url;
        if (urlStr.startsWith('http')) {
            url = new URL(urlStr);
        } else {
            // Assume it might be a partial URL or just params
            url = new URL('http://dummy.com/' + (urlStr.startsWith('?') ? urlStr : '?' + urlStr));
        }

        const params = url.searchParams;
        let found = false;

        // Look for parameters (case insensitive for keys slightly tricky with searchParams, 
        // but parameters are usually standard. We'll check specific variations found in documentation/users)

        // deviceID
        let newDevice = params.get('deviceID') || params.get('deviceId') || params.get('device_id');

        // card-Number
        let newCard = params.get('card-Number') || params.get('cardNumber') || params.get('card_number');

        if (newDevice) {
            document.getElementById('deviceId').value = newDevice;
            validateDevice();
            found = true;
        }

        if (newCard) {
            document.getElementById('cardNumber').value = newCard;
            validateCard();
            found = true;
        }

        if (found) {
            const msg = document.getElementById('magicUrlMsg');
            msg.style.display = 'block';
            setTimeout(() => {
                msg.style.display = 'none';
                input.value = ''; // Clear input on success
            }, 2000);

            // If both found, maybe we could auto-save or something, but let's just populate for now.
        }

    } catch (e) {
        // Not a valid URL, ignore or could validate
        console.log("Invalid URL input", e);
    }
}

function toggleFavorite() {
    const index = document.getElementById('profileSelect').value;
    if (index === "") return;

    const isFav = profiles[index].favorite;

    profiles.forEach(p => p.favorite = false);

    if (!isFav) {
        profiles[index].favorite = true;
    }

    saveProfilesToStorage();
    updateProfileSelect();

    document.getElementById('profileSelect').value = index;
    loadProfile();
}

function saveProfile() {
    const card = document.getElementById('cardNumber').value.trim();
    const device = document.getElementById('deviceId').value.trim();
    const index = document.getElementById('profileSelect').value;

    if (!card || !device) {
        alert("Veuillez remplir les champs.");
        return;
    }

    if (!validateCard() || !validateDevice()) {
        alert("Les données semblent invalides. Vérifiez les formats.");
        return;
    }

    const name = prompt("Nom du profil :", index !== "" ? profiles[index].name : "Mon Profil");
    if (!name) return;

    let isFav = false;
    if (index !== "") {
        isFav = profiles[index].favorite || false;
    }

    const newProfile = { name, card, device, favorite: isFav };

    if (index !== "") {
        profiles[index] = newProfile;
    } else {
        profiles.push(newProfile);
    }

    saveProfilesToStorage();
    updateProfileSelect();

    if (index === "") {
        document.getElementById('profileSelect').value = profiles.length - 1;
    } else {
        document.getElementById('profileSelect').value = index;
    }
    loadProfile();
}

function deleteProfile() {
    const index = document.getElementById('profileSelect').value;
    if (index === "") return;

    if (confirm("Supprimer ce profil ?")) {
        profiles.splice(index, 1);
        saveProfilesToStorage();
        updateProfileSelect();
        loadProfile();
    }
}

function saveProfilesToStorage() {
    localStorage.setItem('bf_profiles', JSON.stringify(profiles));
}

function toggleInput(id, btn) {
    const input = document.getElementById(id);
    if (input.type === "password") {
        input.type = "text";
        btn.textContent = "🙈";
    } else {
        input.type = "password";
        btn.textContent = "👁️";
    }
}

function validateCard() {
    const input = document.getElementById('cardNumber');
    const error = document.getElementById('cardError');
    const regex = /^V\d+$/i;
    const valid = regex.test(input.value.trim());

    setValidationState(input, error, valid);
    updateUiState();
    return valid;
}

function validateDevice() {
    const input = document.getElementById('deviceId');
    const error = document.getElementById('deviceError');
    const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const valid = regex.test(input.value.trim());

    setValidationState(input, error, valid);
    updateUiState();
    return valid;
}

function updateUiState() {
    const cardVal = document.getElementById('cardNumber').value.trim();
    const deviceVal = document.getElementById('deviceId').value.trim();
    const magicSection = document.getElementById('magicUrlSection');
    const resetBtn = document.getElementById('resetBtn');

    if (cardVal && deviceVal) {
        magicSection.classList.add('hidden');
        resetBtn.classList.remove('hidden');
    } else {
        magicSection.classList.remove('hidden');
        resetBtn.classList.add('hidden');
    }
}

function resetForm() {
    document.getElementById('cardNumber').value = '';
    document.getElementById('deviceId').value = '';
    document.getElementById('magicUrl').value = '';

    // Reset Select to default if it was on a profile? 
    // Actually user might want to clear a profile's data but keep selection? 
    // Let's just clear fields. If they select a profile again, it reloads.
    document.getElementById('profileSelect').value = ""; // Set to "Nouveau profil"

    resetValidation();
    updateUiState();
}

function setValidationState(input, errorMsg, isValid) {
    if (input.value.length === 0) {
        input.classList.remove('valid', 'invalid');
        errorMsg.style.display = 'none';
        return;
    }

    if (isValid) {
        input.classList.add('valid');
        input.classList.remove('invalid');
        errorMsg.style.display = 'none';
        errorMsg.classList.remove('error');
    } else {
        input.classList.add('invalid');
        input.classList.remove('valid');
        errorMsg.classList.add('error');
    }
}

function resetValidation() {
    ['cardNumber', 'deviceId'].forEach(id => {
        const input = document.getElementById(id);
        input.classList.remove('valid', 'invalid');
    });
    document.querySelectorAll('.validation-msg').forEach(el => el.classList.remove('error'));
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const newTheme = current === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    document.getElementById('themeBtn').textContent = theme === 'dark' ? '☀️' : '🌙';
    localStorage.setItem('theme', theme);
}

function handleLogin() {
    const cardInput = document.getElementById('cardNumber').value.trim();
    const deviceInput = document.getElementById('deviceId').value.trim();

    if (!cardInput || !deviceInput) {
        alert("Veuillez remplir tous les champs");
        return;
    }

    const isCardValid = validateCard();
    const isDeviceValid = validateDevice();

    if (!isCardValid || !isDeviceValid) {
        alert("Veuillez corriger les erreurs de format avant de générer.");
        return;
    }

    state.cardNumber = cardInput;
    state.deviceId = deviceInput;

    showQrView();
}

function logout() {
    clearInterval(state.timerInterval);
    document.getElementById('qrDisplay').classList.add('hidden');
    document.getElementById('loginForm').classList.remove('hidden');

    document.getElementById('cardNumber').value = state.cardNumber;
    document.getElementById('deviceId').value = state.deviceId;

    window.history.pushState({}, document.title, window.location.pathname);
}

function showQrView() {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('qrDisplay').classList.remove('hidden');

    startTimer();
}

function shareUrl() {
    const url = new URL(window.location.href);
    url.searchParams.set('card', state.cardNumber);
    url.searchParams.set('device', state.deviceId);

    navigator.clipboard.writeText(url.toString()).then(() => {
        showToast("URL copiée dans le presse-papier !");
    });
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

function toggleModal(show) {
    const modal = document.getElementById('helpModal');
    if (show) {
        modal.classList.add('show');
    } else {
        modal.classList.remove('show');
    }
}

function handleOverlayClick(event) {
    if (event.target === event.currentTarget) {
        toggleModal(false);
    }
}

async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

function generateGUID() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 3; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

async function generateQR() {
    const { cardNumber, deviceId } = state;
    const guid = generateGUID();
    const timestamp = Math.floor(Date.now() / 1000);

    const dataToHash = `${cardNumber}${guid}${timestamp}${deviceId}`;
    const fullHash = await sha256(dataToHash);
    const hashLast8 = fullHash.slice(-8).toUpperCase();

    const content = `GM2:${cardNumber}:${guid}:${timestamp}:${hashLast8}`;

    console.log("Génération:", content);

    const container = document.getElementById('qrcode');
    container.innerHTML = '';

    new QRCode(container, {
        text: content,
        width: 256,
        height: 256,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.M
    });
}

function startTimer() {
    generateQR();
    if (state.timerInterval) clearInterval(state.timerInterval);
    state.timerInterval = setInterval(generateQR, 5000);

    const bar = document.getElementById('progress');
    bar.style.animation = 'none';
    bar.offsetHeight;
    bar.style.animation = 'progress 5s linear infinite';
}

function toggleFullscreen() {
    const display = document.getElementById('qrDisplay');
    display.classList.toggle('fullscreen');
}

// PWA Service Worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
        .then(() => console.log('Service Worker Registered'))
        .catch(err => console.error('Service Worker Failed', err));
}
