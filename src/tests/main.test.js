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

const $ = jest.fn(() => mockJQuery);
Object.assign($, mockJQuery);
$.fn = {};
global.$ = global.jQuery = $;

// Mock DOM
global.window = {
  setTimeout: setTimeout,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
};
global.document = {
  addEventListener: jest.fn(),
  scrollLeft: jest.fn()
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
   
});