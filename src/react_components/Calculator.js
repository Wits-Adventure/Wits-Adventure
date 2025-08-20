/**
 * Simple Calculator component for testing purposes
 */
export class Calculator {
  add(a, b) {
    return a + b;
  }

  subtract(a, b) {
    return a - b;
  }

  multiply(a, b) {
    return a * b;
  }

  divide(a, b) {
    if (b === 0) {
      throw new Error('Division by zero is not allowed');
    }
    return a / b;
  }

  isEven(number) {
    return number % 2 === 0;
  }

  factorial(n) {
    if (n < 0) return undefined;
    if (n === 0 || n === 1) return 1;
    return n * this.factorial(n - 1);
  }
}

// React component version
import React, { useState } from 'react';

export const CalculatorComponent = () => {
  const [result, setResult] = useState(0);
  const [input, setInput] = useState('');
  const calculator = new Calculator();

  const handleAdd = () => {
    const nums = input.split(',').map(Number);
    if (nums.length === 2) {
      setResult(calculator.add(nums[0], nums[1]));
    }
  };

  return (
    <div data-testid="calculator">
      <h2>Simple Calculator</h2>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Enter two numbers separated by comma"
        data-testid="calculator-input"
      />
      <button onClick={handleAdd} data-testid="add-button">
        Add
      </button>
      <div data-testid="result">Result: {result}</div>
    </div>
  );
};