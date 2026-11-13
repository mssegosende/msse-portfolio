// The contact form's longest value per field. Same limits as the backend
// (backend/server.py ContactMessage, max_length; backend/tests checks they
// match); email is email-validator's 254. Longer text can't be typed, so it
// never reaches the server's 422.
export const MAX_LEN = {
  name: 100,
  email: 254,
  company: 100,
  linkedin: 200,
  message: 2000,
  website: 200,
} as const;
