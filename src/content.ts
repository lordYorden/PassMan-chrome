console.log("[PassMan] Content script loaded on:", window.location.href);

/**
 * Listen for form submissions to capture login details
 */
function setupFormListeners() {
  const forms = document.querySelectorAll("form");

  forms.forEach((form) => {
    form.addEventListener("submit", handleFormSubmit, true);
    console.log("[PassMan] Listening for submit on form:", form);
  });

  const submitButtons = document.querySelectorAll(SUBMIT_BUTTON_SELECTOR);

  submitButtons.forEach((button) => {
    button.addEventListener("click", handleButtonClick, true);
    console.log("[PassMan] Listening for click on button:", button);
  });

  observeDynamicElements();
}

/**
 * Observe for dynamically added forms and buttons
 */
function observeDynamicElements() {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element;
          
          //Check if the added node itself is a form
          if (element.tagName === "FORM") {
            (element as HTMLFormElement).addEventListener(
              "submit",
              handleFormSubmit,
              true
            );
          }
          
          //Check if the added node itself is a submit button
          if (element.tagName === "BUTTON" || element.tagName === "INPUT") {
            const btn = element as HTMLButtonElement | HTMLInputElement;
            if (btn.matches(SUBMIT_BUTTON_SELECTOR)) {
              btn.addEventListener("click", handleButtonClick, true);
            }
          }
          
          //Check for forms within the added node
          const nestedForms = element.querySelectorAll("form");
          nestedForms.forEach((form) => {
            form.addEventListener("submit", handleFormSubmit, true);
          });
          
          //Check for submit buttons within the added node
          const nestedButtons = element.querySelectorAll(SUBMIT_BUTTON_SELECTOR);
          nestedButtons.forEach((button) => {
            button.addEventListener("click", handleButtonClick, true);
          });
        }
      });
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

/**
 * Handle submit button clicks
 * @param _event onclick event 
 */
function handleButtonClick(_event: Event) {
  setTimeout(() => {
    captureCredentials();
  }, 100);
}

/**
 * Handle form submission
 * @param event form submit event
 */
function handleFormSubmit(event: Event) {
  const form = event.target as HTMLFormElement;

  const usernameField = findUsernameFieldInForm(form);
  const passwordField = findPasswordFieldInForm(form);

  if (
    usernameField &&
    passwordField &&
    usernameField.value &&
    passwordField.value
  ) {
    storeCredentials(usernameField.value, passwordField.value);
  }
}

/**
 * Capture credentials from anywhere on the page
 */
function captureCredentials() {
  const usernameField = findUsernameField();
  const passwordField = findPasswordField();

  if (
    usernameField &&
    passwordField &&
    usernameField.value &&
    passwordField.value
  ) {
    storeCredentials(usernameField.value, passwordField.value);
  } else {
    console.error(
      "[PassMan] Could not find both username and password fields with values"
    );
  }
}

/**
 * Store user credentials in Chrome local storage
 * @param username The username to store
 * @param password The password to store
 */
function storeCredentials(username: string, password: string) {
  const domain = window.location.hostname;

  const pendingCredentials = {
    domain,
    username,
    password,
    timestamp: Date.now(),
  };

  chrome.storage.local.set({ pendingCredentials: pendingCredentials }, () => {
    //Send message to background script to open popup
    chrome.runtime.sendMessage({ action: "openPopup" }, () => {
      if (chrome.runtime.lastError) {
        console.error(
          "[PassMan] Could not send message to background:",
          chrome.runtime.lastError
        );
      } else {
      }
    });
  });
}


const SUBMIT_BUTTON_SELECTOR = 
  'button[type="submit"], button[id*="submit" i], button[class*="submit" i], ' +
  'input[type="submit"], button[id*="login" i], button[class*="login" i], ' +
  'button[id*="signin" i], button[class*="signin" i]';

const USERNAME_SELECTORS = [
  'input[type="email"]',
  'input[type="text"][name*="user" i]',
  'input[type="text"][name*="email" i]',
  'input[type="text"][id*="user" i]',
  'input[type="text"][id*="email" i]',
  'input[type="text"][placeholder*="user" i]',
  'input[type="text"][placeholder*="email" i]',
  'input[type="text"][autocomplete="username"]',
  'input[type="text"][autocomplete="email"]',
  'input[name="username"]',
  'input[name="email"]',
  'input[id="username"]',
  'input[id="email"]',
  'input[type="text"]',
  //Fallback: first text input in a form
  'form input[type="text"]:first-of-type',
];

const PASSWORD_SELECTORS = [
  'input[type="password"]',
  'input[name*="pass" i]',
  'input[id*="pass" i]',
];

/**
 * Find a form field within a specific container.
 * @param selectors - Array of CSS selectors to match the field.
 * @param container - The container element to search within.
 * @param requireValue - Whether to require the field to have a value.
 * @returns The found input field or null.
 */
function findField(
  selectors: string[],
  container: HTMLElement | Document = document,
  requireValue: boolean = false
): HTMLInputElement | null {
  for (const selector of selectors) {
    const field = container.querySelector<HTMLInputElement>(selector);
    if (field && isVisible(field)) {
      //If requireValue is true, check that field has a value
      if (!requireValue || field.value) {
        return field;
      }
    }
  }
  return null;
}

/**
 * Find the username field within a specific form.
 * @param container - The form element to search within.
 * @returns The found username input field or null.
 */
function findUsernameFieldInForm(
  container: HTMLElement
): HTMLInputElement | null {
  return findField(USERNAME_SELECTORS, container, true);
}

/**
 * Find the password field within a specific form.
 * @param container - The form element to search within.
 * @returns The found password input field or null.
 */
function findPasswordFieldInForm(
  container: HTMLElement
): HTMLInputElement | null {
  return findField(PASSWORD_SELECTORS, container, true);
}

//Initialize form listeners when page loads
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", setupFormListeners);
} else {
  setupFormListeners();
}

//Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === "autofill") {
    const { username, password } = message;

    let filledFields: string[] = [];
    let errors: string[] = [];

    //Find and fill username/email field
    const usernameField = findUsernameField();

    if (usernameField) {
      fillField(usernameField, username);
      triggerInputEvent(usernameField);
      filledFields.push("username");
    } else {
      errors.push("Could not find username field");
      console.warn("[PassMan] Could not find username field");
    }

    //Find and fill password field
    const passwordField = findPasswordField();

    if (passwordField) {
      fillField(passwordField, password);
      triggerInputEvent(passwordField);
      filledFields.push("password");
    } else {
      errors.push("Could not find password field");
      console.warn("[PassMan] Could not find password field");
    }

    //Send response based on what was filled
    if (filledFields.length > 0) {
      const message =
        `Filled ${filledFields.join(" and ")} field${
          filledFields.length > 1 ? "s" : ""
        }` + (errors.length > 0 ? `. Note: ${errors.join(", ")}` : "");
      sendResponse({ success: true, message });
    } else {
      sendResponse({
        success: false,
        message: "Could not find any login fields on this page",
      });
    }
  }

  return true;
});

/**
 * Find the username field within a specific form.
 * @param container - The form element to search within.
 * @returns The found username input field or null.
 */
function findUsernameField(): HTMLInputElement | null {
  return findField(USERNAME_SELECTORS, document, false);
}

/**
 * Find the password field within a specific form.
 * @param container - The form element to search within.
 * @returns The found password input field or null.
 */
function findPasswordField(): HTMLInputElement | null {
  return findField(PASSWORD_SELECTORS, document, false);
}

/**
 * Check if an element is visible on the page.
 * @param element - The element to check.
 * @returns True if the element is visible, false otherwise.
 */
function isVisible(element: HTMLElement): boolean {
  const style = window.getComputedStyle(element);
  return (
    style.display !== "none" &&
    style.visibility !== "hidden" &&
    style.opacity !== "0" &&
    element.offsetParent !== null
  );
}

/**
 * Fill a form field with a value.
 * @param field - The input field to fill.
 * @param value - The value to set.
 */
function fillField(field: HTMLInputElement, value: string): void {
  field.value = value;
  field.setAttribute("value", value);
  field.focus();
}

/**
 * Trigger input events so frameworks like React/Vue detect the change.
 * @param field - The input field to trigger events on.
 */
function triggerInputEvent(field: HTMLInputElement): void {
  //Create and dispatch various events
  const events = [
    new Event("input", { bubbles: true, cancelable: true }),
    new Event("change", { bubbles: true, cancelable: true }),
    new KeyboardEvent("keydown", { bubbles: true, cancelable: true }),
    new KeyboardEvent("keyup", { bubbles: true, cancelable: true }),
  ];

  events.forEach((event) => field.dispatchEvent(event));

  //For React specifically
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value"
  )?.set;

  if (nativeInputValueSetter) {
    nativeInputValueSetter.call(field, field.value);
    field.dispatchEvent(new Event("input", { bubbles: true }));
  }
}
