import axios from "axios";

// Base URL for API calls
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:1337/api";

// Authentication service functions
const login = async (cccd, password, recaptchaToken, device_name = null, login_type = "password", location = null, otp = null) => {

    try {
        const payload = {
            "cccd": cccd,
            "password": password,
            "recaptchaToken": recaptchaToken
        };

        // Add optional fields if provided
        if (device_name) payload.device_name = device_name;
        if (login_type) payload.login_type = login_type;
        if (location) payload.location = location;
        if (otp) payload.otp = otp;

        const response = await axios.post(
            `${API_URL}/auth/login`,
            payload
        );

        // Check for soft error (200 OK but contains error data)
        if (response.data?.error) {
            return response; // Return response so caller can handle specific error codes
        }

        // Reset attempts on successful login
        return response;
    } catch (error) {
        throw error;
    }
};

const getMe = async (token) => {
    const response = await axios.get(
        `${API_URL}/auth/me`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );
    return response;
}

/**
 * Change user password
 * @param {string} cccd - User's CCCD number
 * @param {string} currentPassword - User's current password
 * @param {string} newPassword - User's new password
 * @param {string} confirmPassword - Confirmation of new password
 * @returns {Promise<Object>} - The response from the API
 */
const changePassword = async (cccd, newPassword, confirmPassword) => {
    try {
        const response = await axios.post(
            `${API_URL}/auth/change-password`,
            {
                "cccd": cccd,
                "new_password": newPassword,
                "confirm_password": confirmPassword
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
        return response;
    } catch (error) {
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            throw new Error(error.response.data?.error?.message || "Password change failed");
        } else if (error.request) {
            // The request was made but no response was received
            throw new Error("No response from server");
        } else {
            // Something happened in setting up the request that triggered an Error
            throw new Error("Error setting up password change request");
        }
    }
};

/**
 * Verify bank account number with bank name and account name
 * @param {string} bankNumber
 * @param {string} bankName
 * @param {string} accountName
 * @returns {Promise<Object>} axios response
 */
const verifyBankNumber = async (bankNumber, bankName, accountName = "ABC") => {
    const response = await axios.post(
        `${API_URL}/auth/verify-bank-number`,
        { bankNumber, bankName, accountName },
        { headers: { 'Content-Type': 'application/json' } }
    );
    return response;
};

const generateQrSession = async (deviceInfo, ipAddress = null) => {
    try {
        const payload = { deviceInfo };
        if (ipAddress) payload.ipAddress = ipAddress;
        const response = await axios.post(
            `${API_URL}/auth/generate-qr`,
            payload,
            { headers: { 'Content-Type': 'application/json' } }
        );
        return response;
    } catch (error) {
        if (error.response) {
            throw new Error(error.response.data?.error?.message || "QR generation failed");
        } else if (error.request) {
            throw new Error("No response from server");
        } else {
            throw new Error("Error setting up QR generate request");
        }
    }
};

const generateQrSessionInfo = async () => {
    try {
        const token = localStorage.getItem("authToken");
        if (!token) {
            return null;
        }

        const response = await axios.post(
            `${API_URL}/auth/generate-qr-info`,
            {},
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );
        return response;
    } catch (error) {
        if (error.response) {
            throw new Error(error.response.data?.error?.message || "QR generation failed");
        } else if (error.request) {
            throw new Error("No response from server");
        } else {
            throw new Error("Error setting up QR generate request");
        }
    }
};

const checkQrStatus = async (sessionId) => {
    try {
        const response = await axios.post(
            `${API_URL}/auth/check-qr`,
            { sessionId },
            { headers: { 'Content-Type': 'application/json' } }
        );
        return response;
    } catch (error) {
        // Return null or throw depending on how we want to handle polling errors
        // For polling, we might just want to return null/error status without throwing hard
        return error.response;
    }
};

const verifyQrSession = async (sessionId) => {
    try {
        const token = localStorage.getItem("authToken");
        if (!token) {
            return null;
        }

        const response = await axios.post(
            `${API_URL}/auth/verify-qr`,
            { sessionId },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        return response;
    } catch (error) {
        if (error.response) {
            throw new Error(error.response.data?.error?.message || "QR verification failed");
        } else if (error.request) {
            throw new Error("No response from server");
        } else {
            throw new Error("Error setting up QR verification request");
        }
    }
};

/**
 * Update user information
 * @param {string} token - User's authentication token
 * @param {Object} userData - User data to update
 * @returns {Promise<Object>} - The response from the API
 */
const updateUser = async (token, userData) => {
    const response = await axios.put(
        `${API_URL}/auth/update`,
        userData,
        {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        }
    );
    return response;
};

const updateAvatar = async (avatarUrl) => {
    const token = await localStorage.getItem("authToken");
    if (!token) {
        alert("Please login first");
        return null;
    }
    const response = await axios.put(
        `${API_URL}/auth/update`,
        { avt: avatarUrl },
        {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        }
    );
    return response;
};

/**
 * Cập nhật avatar bằng cách upload file thật qua Strapi (multipart).
 * @param {string} token - The authentication token
 * @param {File} file - File ảnh avatar
 * @returns {Promise<Object>} - The response from the API (user đã cập nhật, avt là URL string)
 */
const updateAvatarFile = async (token, file) => {
    const fd = new FormData();
    fd.append('avt', file, file.name);
    const response = await axios.put(
        `${API_URL}/auth/update`,
        fd,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return response;
};

const recoverLogin = async (cccd, recoveryCharacter) => {
    const response = await axios.post(
        `${API_URL}/auth/verify-recovery-character`,
        {
            "cccd": cccd,
            "recovery_character": recoveryCharacter
        },
        { headers: { 'Content-Type': 'application/json' } }
    );
    return response;
}

const verifyOtp = async (cccd, otp) => {
    const response = await axios.post(
        `${API_URL}/auth/verify-otp`,
        {
            "cccd": cccd,
            "otp": otp
        },
        { headers: { 'Content-Type': 'application/json' } }
    );
    return response;
}

/**
 * Verify recovery string for password reset
 * POST /api/v1/auth/recover/verify
 * @param {string} bankAccountId - User's bank account ID
 * @param {string} recoveryString - User's recovery string
 * @returns {Promise<Object>} - { verificationResult: "PASS", resetToken: "RST-xxx" }
 */
const verifyRecoveryString = async (bankAccountId, recoveryString, recaptchaToken = null) => {
    try {
        const payload = { bankAccountId, recoveryString };
        if (recaptchaToken) payload.recaptchaToken = recaptchaToken;
        const response = await axios.post(
            `${API_URL}/v1/auth/recover/verify`,
            payload,
            { headers: { 'Content-Type': 'application/json' } }
        );
        return response;
    } catch (error) {
        if (error.response) {
            throw error;
        } else if (error.request) {
            throw new Error("No response from server");
        } else {
            throw new Error("Error setting up recovery verification request");
        }
    }
};

/**
 * Reset password using reset token
 * POST /api/v1/auth/recover/reset
 * @param {string} resetToken - Reset token received from verify endpoint
 * @param {string} newPassword - User's new password
 * @returns {Promise<Object>} - { success: true, message: "..." }
 */
const resetPasswordWithToken = async (resetToken, newPassword) => {
    try {
        const response = await axios.post(
            `${API_URL}/v1/auth/recover/reset`,
            {
                resetToken,
                newPassword
            },
            { headers: { 'Content-Type': 'application/json' } }
        );
        return response;
    } catch (error) {
        if (error.response) {
            throw error;
        } else if (error.request) {
            throw new Error("No response from server");
        } else {
            throw new Error("Error setting up password reset request");
        }
    }
};

/**
 * Verify OTP for password recovery
 * POST /api/v1/auth/recover/verify-otp
 * @param {string} resetToken - Reset token received from recovery verify endpoint
 * @param {string} otp - OTP code entered by user
 * @returns {Promise<Object>} - { verificationResult: "PASS", resetToken: "..." }
 * Errors: INVALID_OTP, INVALID_RESET_TOKEN, RESET_TOKEN_EXPIRED
 */
const verifyRecoveryOtp = async (resetToken, otp) => {
    try {
        const response = await axios.post(
            `${API_URL}/v1/auth/recover/verify-otp`,
            {
                resetToken,
                otp
            },
            { headers: { 'Content-Type': 'application/json' } }
        );
        return response;
    } catch (error) {
        if (error.response) {
            throw error;
        } else if (error.request) {
            throw new Error("No response from server");
        } else {
            throw new Error("Error setting up OTP verification request");
        }
    }
};

/**
 * Get all login sessions for the authenticated user
 * GET /auth/sessions
 * @returns {Promise<Object>} - { data: [{ id, user_id, device_name, location, is_familiar, login_type, status, last_login_at }] }
 */
const getSessions = async () => {
    try {
        const token = localStorage.getItem("authToken");
        if (!token) {
            throw new Error("No authentication token found");
        }

        const response = await axios.get(
            `${API_URL}/auth/sessions`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        return response;
    } catch (error) {
        if (error.response) {
            throw error;
        } else if (error.request) {
            throw new Error("No response from server");
        } else {
            throw new Error("Error fetching sessions");
        }
    }
};

/**
 * Toggle session status (login <-> logout)
 * POST /auth/sessions/toggle-status
 * @param {number} sessionId - Session ID to toggle
 * @param {string} otp - OTP code for verification
 * @returns {Promise<Object>} - { success, message, session_id, new_status }
 */
const toggleSessionStatus = async (sessionId, otp) => {
    try {
        const token = localStorage.getItem("authToken");
        if (!token) {
            throw new Error("No authentication token found");
        }

        const response = await axios.post(
            `${API_URL}/auth/sessions/toggle-status`,
            {
                session_id: sessionId,
                otp: otp
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        return response;
    } catch (error) {
        if (error.response) {
            throw error;
        } else if (error.request) {
            throw new Error("No response from server");
        } else {
            throw new Error("Error toggling session status");
        }
    }
};

const changeOtp = async (otp) => {
    try {
        const token = localStorage.getItem("authToken");
        if (!token) {
            throw new Error("No authentication token found");
        }

        const response = await axios.post(
            `${API_URL}/auth/change-otp`,
            {
                otp: otp
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        return response;
    } catch (error) {
        if (error.response) {
            throw error;
        } else if (error.request) {
            throw new Error("No response from server");
        } else {
            throw new Error("Error changing OTP");
        }
    }
};

/**
 * Set/update the recovery string for the authenticated user.
 * Requires the current password for security.
 * POST /auth/set-recovery-string
 * @param {string} currentPassword
 * @param {string} recoveryString
 * @returns {Promise<Object>} - axios response
 */
const setRecoveryString = async (currentPassword, recoveryString) => {
    const token = localStorage.getItem("authToken");
    if (!token) {
        throw new Error("No authentication token found");
    }

    const response = await axios.post(
        `${API_URL}/auth/set-recovery-string`,
        { currentPassword, recoveryString },
        {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        }
    );
    return response;
};

const verifyRecoveryAccount = async (accountId) => {
    const response = await axios.post(
        `${API_URL}/auth/recovery/verify-account`,
        { accountId },
        { headers: { 'Content-Type': 'application/json' } }
    );
    return response;
};

const verifyRecoveryKey = async (accountId, recoveryKey) => {
    const response = await axios.post(
        `${API_URL}/auth/recovery/verify-recovery`,
        { accountId, recoveryKey },
        { headers: { 'Content-Type': 'application/json' } }
    );
    return response;
};

const verifyRecoveryOtpStep = async (accountId, otp) => {
    const response = await axios.post(
        `${API_URL}/auth/recovery/verify-otp`,
        { accountId, otp },
        { headers: { 'Content-Type': 'application/json' } }
    );
    return response;
};

const verifyRecoveryBalance = async (accountId, balance) => {
    const response = await axios.post(
        `${API_URL}/auth/recovery/verify-balance`,
        { accountId, balance },
        { headers: { 'Content-Type': 'application/json' } }
    );
    return response;
};

const verifyRecoveryCccd = async (accountId, fullName, idNumber) => {
    const response = await axios.post(
        `${API_URL}/auth/recovery/verify-cccd`,
        { accountId, fullName, idNumber },
        { headers: { 'Content-Type': 'application/json' } }
    );
    return response;
};

/**
 * Update the current address of the logged in user. Confirmed with the account OTP.
 * @param {{ address_no?: string, address_on_map?: string }} address
 * @param {string} otp
 */
const updateCurrentAddress = async (address, otp) => {
    const token = localStorage.getItem("authToken");
    if (!token) {
        throw new Error("No authentication token found");
    }

    const response = await axios.post(
        `${API_URL}/auth/update-address`,
        { ...address, otp },
        {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        }
    );
    return response;
};

export {
    login, getMe, changePassword, verifyBankNumber, generateQrSession, generateQrSessionInfo,
    updateUser, updateAvatar, updateAvatarFile, checkQrStatus, verifyQrSession, recoverLogin, verifyOtp,
    verifyRecoveryString, resetPasswordWithToken, verifyRecoveryOtp, getSessions, toggleSessionStatus, changeOtp,
    verifyRecoveryAccount, verifyRecoveryKey, verifyRecoveryOtpStep, verifyRecoveryBalance, verifyRecoveryCccd,
    setRecoveryString, updateCurrentAddress
};
