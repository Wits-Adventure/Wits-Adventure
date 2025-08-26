const { validatePasswordStrength } = require('../react_components/PasswordValidator'); // Adjust path as needed

describe('validatePasswordStrength', () => {
  test('should return weak strength for empty password', () => {
    const result = validatePasswordStrength('');
    expect(result).toEqual({
      length: false,
      lowercase: false,
      uppercase: false,
      number: false,
      specialChar: false,
      score: 0,
      feedback: [
        'Password should be at least 8 characters long.',
        'Include at least one lowercase letter.',
        'Include at least one uppercase letter.',
        'Include at least one number.',
        'Include at least one special character.',
      ],
      strength: 'Weak',
    });
  });

  test('should return weak strength for short password with only lowercase', () => {
    const result = validatePasswordStrength('abc');
    expect(result).toEqual({
      length: false,
      lowercase: true,
      uppercase: false,
      number: false,
      specialChar: false,
      score: 1,
      feedback: [
        'Password should be at least 8 characters long.',
        'Include at least one uppercase letter.',
        'Include at least one number.',
        'Include at least one special character.',
      ],
      strength: 'Weak',
    });
  });

  test('should return weak strength for password with length and lowercase only', () => {
    const result = validatePasswordStrength('abcdefgh');
    expect(result).toEqual({
      length: true,
      lowercase: true,
      uppercase: false,
      number: false,
      specialChar: false,
      score: 2,
      feedback: [
        'Include at least one uppercase letter.',
        'Include at least one number.',
        'Include at least one special character.',
      ],
      strength: 'Weak',
    });
  });

  test('should return medium strength for password with length, lowercase, and uppercase', () => {
    const result = validatePasswordStrength('Abcdefgh');
    expect(result).toEqual({
      length: true,
      lowercase: true,
      uppercase: true,
      number: false,
      specialChar: false,
      score: 3,
      feedback: [
        'Include at least one number.',
        'Include at least one special character.',
      ],
      strength: 'Medium',
    });
  });

  test('should return strong strength for password with all criteria except special character', () => {
    const result = validatePasswordStrength('Abcdefgh123');
    expect(result).toEqual({
      length: true,
      lowercase: true,
      uppercase: true,
      number: true,
      specialChar: false,
      score: 4,
      feedback: ['Include at least one special character.'],
      strength: 'Strong',
    });
  });

  test('should return strong strength for password meeting all criteria', () => {
    const result = validatePasswordStrength('Abcd1234!');
    expect(result).toEqual({
      length: true,
      lowercase: true,
      uppercase: true,
      number: true,
      specialChar: true,
      score: 5,
      feedback: [],
      strength: 'Strong',
    });
  });

  test('should handle complex password with multiple special characters', () => {
    const result = validatePasswordStrength('Ab1@#$%^');
    expect(result).toEqual({
      length: true,
      lowercase: true,
      uppercase: true,
      number: true,
      specialChar: true,
      score: 5,
      feedback: [],
      strength: 'Strong',
    });
  });

  test('should return weak strength for password with only numbers', () => {
    const result = validatePasswordStrength('12345678');
    expect(result).toEqual({
      length: true,
      lowercase: false,
      uppercase: false,
      number: true,
      specialChar: false,
      score: 2,
      feedback: [
        'Include at least one lowercase letter.',
        'Include at least one uppercase letter.',
        'Include at least one special character.',
      ],
      strength: 'Weak',
    });
  });
});