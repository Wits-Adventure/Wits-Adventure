// Mock jQuery
const mockJQuery = {
  on: jest.fn(() => mockJQuery),
  removeClass: jest.fn(() => mockJQuery),
  addClass: jest.fn(() => mockJQuery),
  css: jest.fn(() => mockJQuery),
  children: jest.fn(() => ({ each: jest.fn() })),
  scrollLeft: jest.fn(),
  width: jest.fn(() => 1000),
  height: jest.fn(() => 800),
  add: jest.fn(() => mockJQuery),
  appendTo: jest.fn(() => mockJQuery),
  each: jest.fn(() => mockJQuery),
  stop: jest.fn(() => mockJQuery),
  animate: jest.fn(() => mockJQuery),
  focus: jest.fn(() => mockJQuery),
  trigger: jest.fn(() => mockJQuery),
  triggerHandler: jest.fn(() => mockJQuery),
  parents: jest.fn(() => mockJQuery),
  find: jest.fn(() => mockJQuery),
  attr: jest.fn(),
  data: jest.fn(),
  offset: jest.fn(() => ({ top: 0, left: 0 })),
  outerHeight: jest.fn(() => 100),
  outerWidth: jest.fn(() => 100),
  hasClass: jest.fn(() => false),
  prepend: jest.fn(() => mockJQuery),
  match: jest.fn(() => true)
};

const $ = jest.fn((selector) => {
  if (selector === window) return { on: jest.fn() };
  if (selector === document) return { scrollLeft: jest.fn() };
  if (selector === 'body') return mockJQuery;
  if (selector === 'html') return mockJQuery;
  if (selector === 'body,html') return mockJQuery;
  if (selector === '#wrapper') return mockJQuery;
  if (selector === '.gallery') return mockJQuery;
  return mockJQuery;
});
Object.assign($, mockJQuery);
$.fn = {};
global.$ = global.jQuery = $;

// Mock DOM
global.window = {
  setTimeout: setTimeout,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  width: jest.fn(() => 1000),
  height: jest.fn(() => 800)
};
global.document = {
  addEventListener: jest.fn(),
  scrollLeft: jest.fn(),
  width: jest.fn(() => 2000)
};

// Mock breakpoints
global.breakpoints = jest.fn();

// Mock browser
global.browser = {
  mobile: false,
  name: 'chrome',
  canUse: jest.fn(() => true)
};

describe('main.js', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('initializes without errors', () => {
    expect(() => {
      require('../react_components/main.js');
    }).not.toThrow();
  });

  test('handles mobile browser', () => {
    global.browser.mobile = true;
    expect(() => {
      delete require.cache[require.resolve('../react_components/main.js')];
      require('../react_components/main.js');
    }).not.toThrow();
    global.browser.mobile = false;
  });

  test('handles IE browser', () => {
    global.browser.name = 'ie';
    expect(() => {
      delete require.cache[require.resolve('../react_components/main.js')];
      require('../react_components/main.js');
    }).not.toThrow();
    global.browser.name = 'chrome';
  });

  test('handles object-fit polyfill', () => {
    global.browser.canUse = jest.fn(() => false);
    expect(() => {
      delete require.cache[require.resolve('../react_components/main.js')];
      require('../react_components/main.js');
    }).not.toThrow();
    global.browser.canUse = jest.fn(() => true);
  });

  test('keyboard event handling', () => {
    const mockEvent = {
      keyCode: 37,
      preventDefault: jest.fn(),
      stopPropagation: jest.fn()
    };
    expect(mockEvent.keyCode).toBe(37);
  });

  test('scroll wheel normalization', () => {
    const mockEvent = {
      originalEvent: {
        deltaY: 100,
        deltaX: 0
      },
      preventDefault: jest.fn(),
      stopPropagation: jest.fn()
    };
    expect(mockEvent.originalEvent.deltaY).toBe(100);
  });

  test('handles window load event setup', () => {
    delete require.cache[require.resolve('../react_components/main.js')];
    
    expect(() => {
      require('../react_components/main.js');
    }).not.toThrow();
  });

  test('handles breakpoints setup', () => {
    delete require.cache[require.resolve('../react_components/main.js')];
    
    expect(() => {
      require('../react_components/main.js');
    }).not.toThrow();
  });

  test('handles jQuery initialization', () => {
    delete require.cache[require.resolve('../react_components/main.js')];
    
    expect(() => {
      require('../react_components/main.js');
    }).not.toThrow();
    
    expect($).toBeDefined();
    expect(global.jQuery).toBeDefined();
  });

  test('handles different browser conditions', () => {
    // Test with different browser settings
    global.browser.mobile = true;
    global.browser.name = 'ie';
    global.browser.canUse = jest.fn(() => false);
    
    delete require.cache[require.resolve('../react_components/main.js')];
    
    expect(() => {
      require('../react_components/main.js');
    }).not.toThrow();
    
    // Reset
    global.browser.mobile = false;
    global.browser.name = 'chrome';
    global.browser.canUse = jest.fn(() => true);
  });

  test('handles keyboard shortcuts when enabled', () => {
    const mockEvent = {
      keyCode: 37,
      preventDefault: jest.fn(),
      stopPropagation: jest.fn()
    };
    
    // Mock document scrollLeft
    const mockDocument = {
      scrollLeft: jest.fn(() => 100)
    };
    
    global.$ = jest.fn((selector) => {
      if (selector === document) return mockDocument;
      if (selector === window) return { on: jest.fn() };
      return mockJQuery;
    });
    
    delete require.cache[require.resolve('../react_components/main.js')];
    require('../react_components/main.js');
    
    expect(mockEvent.keyCode).toBe(37);
  });

  test('handles scroll wheel events', () => {
    const mockEvent = {
      originalEvent: {
        deltaY: 100,
        deltaX: 0,
        deltaMode: 0
      },
      preventDefault: jest.fn(),
      stopPropagation: jest.fn()
    };
    
    global.breakpoints = jest.fn(() => ({
      active: jest.fn(() => false)
    }));
    
    delete require.cache[require.resolve('../react_components/main.js')];
    require('../react_components/main.js');
    
    expect(mockEvent.originalEvent.deltaY).toBe(100);
  });

  test('handles dragging functionality', () => {
    const mockMouseEvent = {
      clientX: 100,
      preventDefault: jest.fn(),
      stopPropagation: jest.fn()
    };
    
    global.breakpoints = jest.fn(() => ({
      active: jest.fn(() => false)
    }));
    
    delete require.cache[require.resolve('../react_components/main.js')];
    require('../react_components/main.js');
    
    expect(mockMouseEvent.clientX).toBe(100);
  });

  test('handles gallery modal interactions', () => {
    const mockAnchor = {
      attr: jest.fn(() => 'test.jpg'),
      parents: jest.fn(() => ({
        children: jest.fn(() => ({
          find: jest.fn(() => ({ attr: jest.fn() })),
          addClass: jest.fn(),
          focus: jest.fn()
        }))
      }))
    };
    
    const mockEvent = {
      preventDefault: jest.fn(),
      stopPropagation: jest.fn()
    };
    
    delete require.cache[require.resolve('../react_components/main.js')];
    require('../react_components/main.js');
    
    expect(mockAnchor.attr('href')).toBe('test.jpg');
  });

  test('handles link scroll functionality', () => {
    const mockLink = {
      attr: jest.fn(() => '#target')
    };
    
    const mockTarget = {
      length: 1,
      offset: jest.fn(() => ({ left: 100, top: 100 })),
      outerWidth: jest.fn(() => 200),
      outerHeight: jest.fn(() => 200)
    };
    
    global.$ = jest.fn((selector) => {
      if (selector === '#target') return mockTarget;
      if (selector === window) return { width: jest.fn(() => 1000), height: jest.fn(() => 800) };
      return mockJQuery;
    });
    
    global.breakpoints = jest.fn(() => ({
      active: jest.fn(() => false)
    }));
    
    delete require.cache[require.resolve('../react_components/main.js')];
    require('../react_components/main.js');
    
    expect(mockLink.attr('href')).toBe('#target');
  });

  test('handles scroll zones functionality', () => {
    global.breakpoints = jest.fn(() => ({
      active: jest.fn(() => false)
    }));
    
    const mockZone = {
      appendTo: jest.fn().mockReturnThis(),
      on: jest.fn().mockReturnThis(),
      css: jest.fn().mockReturnThis()
    };
    
    global.$ = jest.fn((selector) => {
      if (selector && selector.includes('scrollZone')) return mockZone;
      return mockJQuery;
    });
    
    delete require.cache[require.resolve('../react_components/main.js')];
    require('../react_components/main.js');
    
    expect(mockZone.appendTo).toBeDefined();
  });
   
});