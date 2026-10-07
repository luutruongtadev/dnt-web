// Placeholder lookup until a real bank account-name API is integrated.
// TODO: replace with the real bank API call once it's available.
export async function getBankAccountName(bankCode, accountNumber) {
  if (!bankCode || !accountNumber) {
    throw new Error("Missing bankCode or accountNumber")
  }
  await new Promise((resolve) => setTimeout(resolve, 500))
  return "NGUYEN VAN A"
}
