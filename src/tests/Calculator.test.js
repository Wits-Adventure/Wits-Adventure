import { Calculator, CalculatorComponent } from '../pages/Calculator';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

describe('Calculator Class', () => {
  let calculator;

  beforeEach(() => {
    calculator = new Calculator();
  });

  describe('Basic Operations', () => {
    test('should add two numbers correctly', () => {
      expect(calculator.add(2, 3)).toBe(5);
      expect(calculator.add(-1, 1)).toBe(0);
      expect(calculator.add(0, 0)).toBe(0);
    });

    test('should subtract two numbers correctly', () => {
      expect(calculator.subtract(5, 3)).toBe(2);
      expect(calculator.subtract(1, 1)).toBe(0);
      expect(calculator.subtract(0, 5)).toBe(-5);
    });

    test('should multiply two numbers correctly', () => {
      expect(calculator.multiply(3, 4)).toBe(12);
      expect(calculator.multiply(0, 5)).toBe(0);
      expect(calculator.multiply(-2, 3)).toBe(-6);
    });

    test('should divide two numbers correctly', () => {
      expect(calculator.divide(10, 2)).toBe(5);
      expect(calculator.divide(7, 2)).toBe(3.5);
      expect(calculator.divide(0, 5)).toBe(0);
    });

    test('should throw error when dividing by zero', () => {
      expect(() => calculator.divide(5, 0)).toThrow('Division by zero is not allowed');
    });
  });

  describe('Utility Functions', () => {
    test('should check if number is even', () => {
      expect(calculator.isEven(2)).toBe(true);
      expect(calculator.isEven(3)).toBe(false);
      expect(calculator.isEven(0)).toBe(true);
      expect(calculator.isEven(-2)).toBe(true);
    });

    test('should calculate factorial correctly', () => {
      expect(calculator.factorial(0)).toBe(1);
      expect(calculator.factorial(1)).toBe(1);
      expect(calculator.factorial(5)).toBe(120);
      expect(calculator.factorial(-1)).toBeUndefined();
    });
  });
});

describe('Calculator Component', () => {
  test('renders calculator component', () => {
    render(<CalculatorComponent />);
    expect(screen.getByTestId('calculator')).toBeInTheDocument();
    expect(screen.getByText('Simple Calculator')).toBeInTheDocument();
  });

  test('handles user input correctly', () => {
    render(<CalculatorComponent />);
    const input = screen.getByTestId('calculator-input');
    
    fireEvent.change(input, { target: { value: '5,3' } });
    expect(input.value).toBe('5,3');
  });

  test('performs addition when add button is clicked', () => {
    render(<CalculatorComponent />);
    const input = screen.getByTestId('calculator-input');
    const addButton = screen.getByTestId('add-button');
    const result = screen.getByTestId('result');

    fireEvent.change(input, { target: { value: '5,3' } });
    fireEvent.click(addButton);

    expect(result).toHaveTextContent('Result: 8');
  });

  test('shows initial result as 0', () => {
    render(<CalculatorComponent />);
    const result = screen.getByTestId('result');
    expect(result).toHaveTextContent('Result: 0');
  });
});