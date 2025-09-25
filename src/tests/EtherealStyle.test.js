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