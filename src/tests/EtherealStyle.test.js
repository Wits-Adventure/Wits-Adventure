import React from 'react';
import { render, waitFor } from '@testing-library/react';
import EtherealStyles from '../react_components/EtherealStyles';

describe('EtherealStyles', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    document.body.className = '';
    delete window.jQuery;
    delete window.$;
    jest.clearAllTimers();
  });

  test('renders children', () => {
    const { getByText } = render(
      <EtherealStyles>
        <div>Test Content</div>
      </EtherealStyles>
    );
    expect(getByText('Test Content')).toBeInTheDocument();
  });

  test('adds CSS links and body classes', () => {
    render(<EtherealStyles><div>Test</div></EtherealStyles>);
    
    expect(document.getElementById('ethereal-fontawesome-css')).toBeInTheDocument();
    expect(document.getElementById('ethereal-main-css')).toBeInTheDocument();
    expect(document.body.classList.contains('ethereal-active')).toBe(true);
    expect(document.body.classList.contains('is-preload')).toBe(true);
  });

  test('loads scripts asynchronously', async () => {
    render(<EtherealStyles><div>Test</div></EtherealStyles>);
    
    await waitFor(() => {
      expect(document.getElementById('ethereal-jquery')).toBeInTheDocument();
    });
  });

  test('cleans up with jQuery available', () => {
    const mockJQuery = {
      off: jest.fn().mockReturnThis(),
      remove: jest.fn().mockReturnThis(),
      css: jest.fn().mockReturnThis(),
      removeClass: jest.fn().mockReturnThis()
    };
    const mockWindow = { off: jest.fn().mockReturnThis() };
    const mockBody = { off: jest.fn().mockReturnThis() };
    const mockWrapper = { off: jest.fn().mockReturnThis() };
    
    window.jQuery = jest.fn(() => {
      const selector = arguments[0];
      if (selector === window) return mockWindow;
      if (selector === 'body') return mockBody;
      if (selector === '#wrapper') return mockWrapper;
      if (selector === '.scrollZone') return mockJQuery;
      if (selector === 'html') return mockJQuery;
      return mockJQuery;
    });
    window.$ = window.jQuery;
    
    const { unmount } = render(<EtherealStyles><div>Test</div></EtherealStyles>);
    unmount();
    
    expect(document.body.classList.contains('ethereal-active')).toBe(false);
  });

  test('handles cleanup without jQuery', () => {
    const { unmount } = render(<EtherealStyles><div>Test</div></EtherealStyles>);
    unmount();
    
    expect(document.body.classList.contains('ethereal-active')).toBe(false);
    expect(document.getElementById('ethereal-fontawesome-css')).toBeNull();
  });
});
  test('handles script loading errors', async () => {
    // Mock script loading to fail
    const originalCreateElement = document.createElement;
    document.createElement = jest.fn((tagName) => {
      if (tagName === 'script') {
        const script = originalCreateElement.call(document, tagName);
        setTimeout(() => script.onerror(new Error('Script failed')), 10);
        return script;
      }
      return originalCreateElement.call(document, tagName);
    });

    render(<EtherealStyles><div>Test</div></EtherealStyles>);
    
    await waitFor(() => {
      expect(document.getElementById('ethereal-jquery')).toBeInTheDocument();
    });

    document.createElement = originalCreateElement;
  });

  test('handles async script loading with mounted check', async () => {
    let scriptResolve;
    const scriptPromise = new Promise((resolve) => {
      scriptResolve = resolve;
    });

    const originalCreateElement = document.createElement;
    document.createElement = jest.fn((tagName) => {
      if (tagName === 'script') {
        const script = originalCreateElement.call(document, tagName);
        setTimeout(() => {
          script.onload();
          scriptResolve();
        }, 10);
        return script;
      }
      return originalCreateElement.call(document, tagName);
    });

    const { unmount } = render(<EtherealStyles><div>Test</div></EtherealStyles>);
    
    // Unmount before scripts finish loading to test mounted check
    unmount();
    
    await scriptPromise;
    document.createElement = originalCreateElement;
  });

  test('handles script loading sequence', async () => {
    let loadOrder = [];
    
    const originalCreateElement = document.createElement;
    document.createElement = jest.fn((tagName) => {
      if (tagName === 'script') {
        const script = originalCreateElement.call(document, tagName);
        const originalOnload = script.onload;
        script.onload = () => {
          loadOrder.push(script.src);
          if (originalOnload) originalOnload();
        };
        setTimeout(() => script.onload(), 10);
        return script;
      }
      return originalCreateElement.call(document, tagName);
    });

    render(<EtherealStyles><div>Test</div></EtherealStyles>);
    
    await waitFor(() => {
      expect(loadOrder.length).toBeGreaterThan(0);
    });

    document.createElement = originalCreateElement;
  });