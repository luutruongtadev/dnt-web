import axios from "axios";

// Base URL for API calls
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:1337/api";

const createIdempotencyKey = (prefix = "wallet") => {
  const randomPart = window.crypto?.randomUUID?.() || Math.random().toString(36).slice(2);
  return `${prefix}_${Date.now()}_${randomPart}`;
};

const authHeaders = (authToken = localStorage.getItem("authToken"), idempotencyKey = null) => {
  const headers = {
    Authorization: `Bearer ${authToken}`,
  };
  if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;
  return headers;
};


const getWalletFromToken = async (authToken=localStorage.getItem("authToken")) => {
  try {
    const response = await axios.get(`${API_URL}/wallets/my-wallet`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    return response;
  } catch (error) {
    throw new Error("Invalid token");
  }
};

const getFavoriteWallets = async (authToken) => {
  try {
    const response = await axios.get(`${API_URL}/wallets/favorite-wallets`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    return response;
  } catch (error) {
    throw new Error("Invalid token");
  }
};

/**
 * Transfer funds from the authenticated user's wallet to another wallet
 * @param {string} authToken - The authentication token
 * @param {string|number} toWalletId - The ID of the recipient wallet
 * @param {number} amount - The amount to transfer
 * @returns {Promise<Object>} - The response from the API
 */
const transferFunds = async (authToken, toWalletId, amount) => {
  try {
    const idempotencyKey = createIdempotencyKey("transfer");
    const response = await axios.post(
      `${API_URL}/wallets/transfer`,
      {
        toWalletId: toWalletId,
        amount: amount,
        idempotencyKey,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(authToken, idempotencyKey),
        }
      }
    );
    return response;
  } catch (error) {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      throw new Error(error.response.data?.error?.message || "Transfer failed");
    } else if (error.request) {
      // The request was made but no response was received
      throw new Error("No response from server");
    } else {
      // Something happened in setting up the request that triggered an Error
      throw new Error("Error setting up transfer request");
    }
  }
};

const internalTransfer = async (authToken, accountType, amount) => {
  const idempotencyKey = createIdempotencyKey("internal");
  const response = await axios.post(
    `${API_URL}/wallets/internal-transfer`,
    { accountType, amount, idempotencyKey },
    {
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(authToken, idempotencyKey),
      },
    }
  );
  return response;
};

const getMyLedger = async (authToken = localStorage.getItem("authToken"), params = {}) => {
  const response = await axios.get(`${API_URL}/wallets/my-ledger`, {
    headers: authHeaders(authToken),
    params,
  });
  return response;
};

const createDeposit = async ({ authToken = localStorage.getItem("authToken"), wallet, amount, bill }) => {
  const idempotencyKey = createIdempotencyKey("deposit");
  const data = {
    cccd: wallet?.cccd,
    full_name: wallet?.name,
    amount,
  };

  const formData = new FormData();
  formData.append("data", JSON.stringify(data));
  if (bill) formData.append("files.bill", bill, bill.name);

  const response = await axios.post(`${API_URL}/additional-transactions`, formData, {
    headers: authHeaders(authToken, idempotencyKey),
  });

  return response;
};

const createSePayDepositIntent = async ({
  authToken = localStorage.getItem("authToken"),
  amount,
}) => {
  const response = await axios.post(
    `${API_URL}/payment/deposit-intent/sepay`,
    { amount: Number(amount) },
    {
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(authToken),
      },
    }
  );
  return response;
};

const createWithdrawal = async ({ authToken = localStorage.getItem("authToken"), wallet, amount, note = "" }) => {
  const idempotencyKey = createIdempotencyKey("withdraw");
  const response = await axios.post(
    `${API_URL}/with-drawth-transactions`,
    {
      data: {
        cccd: wallet?.cccd,
        full_name: wallet?.name,
        amount,
        note,
      },
    },
    {
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(authToken, idempotencyKey),
      },
    }
  );

  return response;
};

export {
  getWalletFromToken,
  getFavoriteWallets,
  transferFunds,
  internalTransfer,
  getMyLedger,
  createDeposit,
  createSePayDepositIntent,
  createWithdrawal,
};
