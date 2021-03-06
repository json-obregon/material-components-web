/**
 * @license
 * Copyright 2017 Google Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

import {assert} from 'chai';
import bel from 'bel';
import domEvents from 'dom-events';
import td from 'testdouble';

import {MDCTopAppBar} from '../../../packages/mdc-top-app-bar/index';
import {strings} from '../../../packages/mdc-top-app-bar/constants';
import {MDCTopAppBarFoundation} from '../../../packages/mdc-top-app-bar/standard/foundation';
import {MDCFixedTopAppBarFoundation} from '../../../packages/mdc-top-app-bar/fixed/foundation';
import {MDCShortTopAppBarFoundation} from '../../../packages/mdc-top-app-bar/short/foundation';

const MENU_ICONS_COUNT = 3;

function getFixture(removeIcon) {
  const html = bel`
    <div>
      <header class="mdc-top-app-bar">
      <div class="mdc-top-app-bar__row">
        <section class="mdc-top-app-bar__section mdc-top-app-bar__section--align-start">
          <a href="#" class="material-icons mdc-top-app-bar__navigation-icon">menu</a>
          <span class="mdc-top-app-bar__title">Title</span>
        </section>
        <section class="mdc-top-app-bar__section mdc-top-app-bar__section--align-end"
        role="top-app-bar">
          <a href="#" class="material-icons mdc-top-app-bar__action-item" aria-label="Download" alt="Download">
          file_download</a>
          <a href="#" class="material-icons mdc-top-app-bar__action-item"
             aria-label="Print this page" alt="Print this page">
          print</a>
          <a href="#" class="material-icons mdc-top-app-bar__action-item" aria-label="Bookmark this page"
          alt="Bookmark this page">bookmark</a>
          <div class="mdc-menu-anchor">
            <div class="mdc-menu" tabindex="-1" id="demo-menu">
              <ul class="mdc-menu__items mdc-list" role="menu" aria-hidden="true" style="transform: scale(1, 1);">
              </ul>
            </div>
          </section>
        </div>
      </header>
      <main class="mdc-top-app-bar-fixed-adjust">
      </main>
    </div>
  `;

  if (removeIcon) {
    const icon = html.querySelector(strings.NAVIGATION_ICON_SELECTOR);
    icon.parentNode.removeChild(icon);
  }

  return html;
}

class FakeRipple {
  constructor(root) {
    this.root = root;
    this.destroy = td.func('.destroy');
    this.unbounded = null;
  }
}

function setupTest(removeIcon = false, rippleFactory = (el) => new FakeRipple(el)) {
  const fixture = getFixture(removeIcon);
  const root = fixture.querySelector(strings.ROOT_SELECTOR);
  const MockFoundationConstructor = td.constructor(MDCTopAppBarFoundation);
  const mockFoundation = new MockFoundationConstructor();
  mockFoundation.handleTargetScroll = td.func();
  mockFoundation.handleWindowResize = td.func();

  const icon = root.querySelector(strings.NAVIGATION_ICON_SELECTOR);
  const component = new MDCTopAppBar(root, mockFoundation, rippleFactory);

  return {root, component, icon, mockFoundation, fixture};
}

suite('MDCTopAppBar');

test('attachTo initializes and returns an MDCTopAppBar instance', () => {
  assert.isTrue(MDCTopAppBar.attachTo(getFixture()) instanceof MDCTopAppBar);
});

test('constructor instantiates icon ripples for all icons', () => {
  const rippleFactory = td.function();
  // Including navigation icon.
  const totalIcons = MENU_ICONS_COUNT + 1;

  td.when(rippleFactory(td.matchers.anything()), {times: totalIcons}).thenReturn((el) => new FakeRipple(el));
  setupTest(/** removeIcon */ false, rippleFactory);
});

test('constructor does not instantiate ripple for nav icon when not present', () => {
  const rippleFactory = td.function();
  const totalIcons = MENU_ICONS_COUNT;

  td.when(rippleFactory(td.matchers.anything()), {times: totalIcons}).thenReturn((el) => new FakeRipple(el));
  setupTest(/** removeIcon */ true, rippleFactory);
});

test('navIcon click event calls #foundation.handleNavigationClick', () => {
  const {root, mockFoundation} = setupTest();
  const navIcon = root.querySelector('.mdc-top-app-bar__navigation-icon');
  domEvents.emit(navIcon, 'click');
  td.verify(mockFoundation.handleNavigationClick(td.matchers.isA(Object)), {times: 1});
});

test('scroll event triggers #foundation.handleTargetScroll', () => {
  const {mockFoundation} = setupTest();
  domEvents.emit(window, 'scroll');
  td.verify(mockFoundation.handleTargetScroll(td.matchers.isA(Object)), {times: 1});
});

test('resize event triggers #foundation.handleWindowResize', () => {
  const {mockFoundation} = setupTest();
  domEvents.emit(window, 'resize');
  td.verify(mockFoundation.handleWindowResize(td.matchers.isA(Object)), {times: 1});
});

test('destroy destroys icon ripples', () => {
  const {component} = setupTest();
  component.destroy();
  component.iconRipples_.forEach((icon) => {
    td.verify(icon.destroy());
  });
});

test('destroy destroys scroll event handler', () => {
  const {mockFoundation, component} = setupTest();
  component.destroy();
  domEvents.emit(window, 'scroll');
  td.verify(mockFoundation.handleTargetScroll(td.matchers.isA(Object)), {times: 0});
});

test('destroy destroys resize event handler', () => {
  const {mockFoundation, component} = setupTest();
  component.destroy();
  domEvents.emit(window, 'resize');
  td.verify(mockFoundation.handleWindowResize(td.matchers.isA(Object)), {times: 0});
});

test('destroy destroys handleNavigationClick handler', () => {
  const {mockFoundation, component, root} = setupTest();
  const navIcon = root.querySelector('.mdc-top-app-bar__navigation-icon');
  component.destroy();
  domEvents.emit(navIcon, 'resize');
  td.verify(mockFoundation.handleNavigationClick(td.matchers.isA(Object)), {times: 0});
});

test('#setScrollTarget deregisters and registers scroll handler on provided target', () => {
  const {component} = setupTest();
  const fakeTarget1 = document.createElement('div');
  const fakeTarget2 = document.createElement('div');

  component.setScrollTarget(fakeTarget1);
  assert.equal(component.scrollTarget_, fakeTarget1);

  component.setScrollTarget(fakeTarget2);

  assert.equal(component.scrollTarget_, fakeTarget2);
});

test('getDefaultFoundation returns the appropriate foundation for default', () => {
  const fixture = getFixture();
  const root = fixture.querySelector(strings.ROOT_SELECTOR);
  const component = new MDCTopAppBar(root, undefined, (el) => new FakeRipple(el));
  assert.isTrue(component.foundation_ instanceof MDCTopAppBarFoundation);
  assert.isFalse(component.foundation_ instanceof MDCShortTopAppBarFoundation);
  assert.isFalse(component.foundation_ instanceof MDCFixedTopAppBarFoundation);
});

test('getDefaultFoundation returns the appropriate foundation for fixed', () => {
  const fixture = getFixture();
  const root = fixture.querySelector(strings.ROOT_SELECTOR);
  root.classList.add(MDCTopAppBarFoundation.cssClasses.FIXED_CLASS);
  const component = new MDCTopAppBar(root, undefined, (el) => new FakeRipple(el));
  assert.isFalse(component.foundation_ instanceof MDCShortTopAppBarFoundation);
  assert.isTrue(component.foundation_ instanceof MDCFixedTopAppBarFoundation);
});

test('getDefaultFoundation returns the appropriate foundation for short', () => {
  const fixture = getFixture();
  const root = fixture.querySelector(strings.ROOT_SELECTOR);
  root.classList.add(MDCTopAppBarFoundation.cssClasses.SHORT_CLASS);
  const component = new MDCTopAppBar(root, undefined, (el) => new FakeRipple(el));
  assert.isTrue(component.foundation_ instanceof MDCShortTopAppBarFoundation);
  assert.isFalse(component.foundation_ instanceof MDCFixedTopAppBarFoundation);
});

test('adapter#hasClass returns true if the root element has specified class', () => {
  const {root, component} = setupTest();
  root.classList.add('foo');
  assert.isTrue(component.getDefaultFoundation().adapter_.hasClass('foo'));
});

test('adapter#hasClass returns false if the root element does not have specified class', () => {
  const {component} = setupTest();
  assert.isFalse(component.getDefaultFoundation().adapter_.hasClass('foo'));
});

test('adapter#addClass adds a class to the root element', () => {
  const {root, component} = setupTest();
  component.getDefaultFoundation().adapter_.addClass('foo');
  assert.isTrue(root.classList.contains('foo'));
});

test('adapter#removeClass removes a class from the root element', () => {
  const {root, component} = setupTest();
  root.classList.add('foo');
  component.getDefaultFoundation().adapter_.removeClass('foo');
  assert.isFalse(root.classList.contains('foo'));
});

test('adapter#setStyle sets a style attribute on the root element', () => {
  const {root, component} = setupTest();
  assert.isFalse(root.style.getPropertyValue('top') === '1px');
  component.getDefaultFoundation().adapter_.setStyle('top', '1px');
  assert.isTrue(root.style.getPropertyValue('top') === '1px');
});

test('adapter#getViewportScrollY returns scroll distance', () => {
  const {component} = setupTest();
  assert.equal(component.getDefaultFoundation().adapter_.getViewportScrollY(), window.pageYOffset);
});

test('adapter#getViewportScrollY returns scroll distance when scrollTarget_ is not window', () => {
  const {component} = setupTest();
  const mockContent = {addEventListener: () => {}, scrollTop: 20};
  component.setScrollTarget(mockContent);
  assert.equal(component.getDefaultFoundation().adapter_.getViewportScrollY(), mockContent.scrollTop);
});

test('adapter#getTotalActionItems returns the number of action items on the opposite side of the menu', () => {
  const {root, component} = setupTest();
  const adapterReturn = component.getDefaultFoundation().adapter_.getTotalActionItems();
  const actual = root.querySelectorAll(strings.ACTION_ITEM_SELECTOR).length;
  assert.isTrue(adapterReturn === actual);
});

test('adapter#notifyNavigationIconClicked emits the NAVIGATION_EVENT', () => {
  const {component} = setupTest();
  const callback = td.func();
  component.listen(strings.NAVIGATION_EVENT, callback);
  component.getDefaultFoundation().adapter_.notifyNavigationIconClicked();
  td.verify(callback(td.matchers.isA(Object)), {times: 1});
});
