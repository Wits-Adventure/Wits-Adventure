/**
 * Validates password strength
 * @param {string} password - The password to check
 * @returns {object} strength result
 */
export const validatePasswordStrength = (password) => {
  const result = {
    length: false,
    lowercase: false,
    uppercase: false,
    number: false,
    specialChar: false,
    score: 0,
    feedback: []
  };

  // Rules
  if (password.length >= 8) {
    result.length = true;
    result.score++;
  } else {
    result.feedback.push("Password should be at least 8 characters long.");
  }

  if (/[a-z]/.test(password)) {
    result.lowercase = true;
    result.score++;
  } else {
    result.feedback.push("Include at least one lowercase letter.");
  }

  if (/[A-Z]/.test(password)) {
    result.uppercase = true;
    result.score++;
  } else {
    result.feedback.push("Include at least one uppercase letter.");
  }

  if (/[0-9]/.test(password)) {
    result.number = true;
    result.score++;
  } else {
    result.feedback.push("Include at least one number.");
  }

  if (/[^A-Za-z0-9]/.test(password)) {
    result.specialChar = true;
    result.score++;
  } else {
    result.feedback.push("Include at least one special character.");
  }

  // Strength level
  let strength = "Weak";
  if (result.score >= 4) strength = "Strong";
  else if (result.score === 3) strength = "Medium";

  result.strength = strength;

  return result;
};
