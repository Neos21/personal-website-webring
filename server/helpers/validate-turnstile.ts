export const validateTurnstile = async (turnstileSecretKey: string, turnstileToken: string, userIp: string): Promise<boolean> => {
  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: `secret=${encodeURIComponent(turnstileSecretKey)}&response=${encodeURIComponent(turnstileToken)}&remoteip=${encodeURIComponent(userIp)}`,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    const json: { success: boolean; } = await response.json();
    return json.success;
  }
  catch {
    return false;
  }
};
