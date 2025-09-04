import React, { useEffect } from 'react';

/**
 * Loads Ethereal CSS+JS only when this wrapper is mounted (Tutorial route),
 * and cleans up on unmount so other pages aren't affected.
 */
export default function EtherealStyles({ children }) {
  useEffect(() => {
    const addedLinks = [];
    const addedScripts = [];

    const base = (process.env.PUBLIC_URL || '');

    const addLink = (id, href) => {
      let el = document.getElementById(id);
      if (el) return null;
      el = document.createElement('link');
      el.id = id;
      el.rel = 'stylesheet';
      el.href = base + href;
      document.head.appendChild(el);
      return el;
    };

    const addScript = (id, src) => {
      return new Promise((resolve, reject) => {
        if (document.getElementById(id)) return resolve(null);
        const s = document.createElement('script');
        s.id = id;
        s.src = base + src;
        s.async = false;
        s.onload = () => resolve(s);
        s.onerror = reject;
        document.body.appendChild(s);
      });
    };

    // 1) Inject CSS first
    const fa = addLink('ethereal-fontawesome-css', '/assets/ethereal/css/fontawesome-all.min.css');
    const mainCss = addLink('ethereal-main-css', '/assets/ethereal/css/main.css');
    if (fa) addedLinks.push(fa);
    if (mainCss) addedLinks.push(mainCss);

    // 2) Add a marker class to body and ensure initial preload class
    document.body.classList.add('ethereal-active');
    document.body.classList.add('is-preload');
    // In case main.js binds after window load and doesn't remove it, do it ourselves shortly
    const preloadTimer = window.setTimeout(() => {
      document.body.classList.remove('is-preload');
    }, 200);

    // 3) Inject JS in order to enable horizontal scrolling
    let mounted = true;
    (async () => {
      try {
        const jq = await addScript('ethereal-jquery', '/assets/ethereal/js/jquery.min.js');
        if (jq) addedScripts.push(jq);

        const browser = await addScript('ethereal-browser', '/assets/ethereal/js/browser.min.js');
        if (browser) addedScripts.push(browser);

        const bps = await addScript('ethereal-breakpoints', '/assets/ethereal/js/breakpoints.min.js');
        if (bps) addedScripts.push(bps);

        const main = await addScript('ethereal-main', '/assets/ethereal/js/main.js');
        if (main) addedScripts.push(main);
      } catch (e) {
        // Swallow errors; page will just not have enhanced scrolling
        // console.warn('Ethereal scripts failed to load', e);
      }
    })();

    return () => {
      // Try to remove event handlers and artifacts created by main.js
      try {
        const $ = window.jQuery || window.$;
        if ($) {
          $(window).off('keydown');
          $(window).off('resize');
          $(window).off('load');
          $('body').off('wheel');
          $('#wrapper').off();
          $('.scrollZone').remove();
          $('html').css('width', '');
          $('body').css('overflow-x', '');
          $('body').removeClass('is-ie');
        }
      } catch (_) {}

  window.clearTimeout(preloadTimer);
  document.body.classList.remove('ethereal-active');
      document.body.classList.remove('is-preload');

      // Remove injected scripts and links
      addedScripts.forEach((s) => s && s.parentNode && s.parentNode.removeChild(s));
      addedLinks.forEach((l) => l && l.parentNode && l.parentNode.removeChild(l));
    };
  }, []);

  return <>{children}</>;
}
