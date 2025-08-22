/**
 * @jest-environment node
 */
const add = require('../react_components/Addition_test'); 

describe('add function', () => {
    test('should add two positive integers correctly', () => {
        expect(add(2, 3)).toBe(5);
    });

    test('should add two floating point numbers correctly', () => {
        expect(add(1.5, 2.7)).toBeCloseTo(4.2);
    });

    test('should add a negative and a positive number correctly', () => {
        expect(add(-1, 1)).toBe(0);
    });

    test('should add two zeros correctly', () => {
        expect(add(0, 0)).toBe(0);
    });
});