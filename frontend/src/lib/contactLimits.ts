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

// A LinkedIn profile URL: linkedin.com/in/<handle>, with or without https://,
// www. or a country subdomain (ar.linkedin.com). Same rule as the backend's
// LINKEDIN_PROFILE (backend/server.py), with the same test cases on both sides.
export const LINKEDIN_PROFILE =
  /^(https?:\/\/)?([a-z]{2,3}\.)?linkedin\.com\/in\/[A-Za-z0-9_%-]{3,100}\/?$/i;
