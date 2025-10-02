console.log("[PassMan] Content script loaded on:", window.location.href);

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === "autofill") {
    
    const { username, password } = message;
    
    let filledFields: string[] = [];
    let errors: string[] = [];
    
    // Find and fill username/email field
    const usernameField = findUsernameField();
    
    
    if (usernameField) {
      fillField(usernameField, username);
      triggerInputEvent(usernameField);
      filledFields.push("username");
      
    } else {
      errors.push("Could not find username field");
      console.warn("[PassMan] Could not find username field");
    }
    
    // Find and fill password field
    const passwordField = findPasswordField();
    
    
    if (passwordField) {
      fillField(passwordField, password);
      triggerInputEvent(passwordField);
      filledFields.push("password");
      
    } else {
      errors.push("Could not find password field");
      console.warn("[PassMan] Could not find password field");
    }
    
    // Send response based on what was filled
    if (filledFields.length > 0) {
      const message = `Filled ${filledFields.join(" and ")} field${filledFields.length > 1 ? 's' : ''}` +
        (errors.length > 0 ? `. Note: ${errors.join(", ")}` : '');
      sendResponse({ success: true, message });
    } else {
      sendResponse({ 
        success: false, 
        message: "Could not find any login fields on this page"
      });
    }
  }
  
  return true; // Keep message channel open for async response
});

// Find username/email input field
function findUsernameField(): HTMLInputElement | null {
  const selectors = [
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
    // Fallback: first text input in a form
    'form input[type="text"]:first-of-type',
  ];
  
  for (const selector of selectors) {
    const field = document.querySelector<HTMLInputElement>(selector);
    if (field && isVisible(field)) {
      return field;
    }
  }
  
  return null;
}

// Find password input field
function findPasswordField(): HTMLInputElement | null {
  const selectors = [
    'input[type="password"]',
    'input[name*="pass" i]',
    'input[id*="pass" i]',
  ];
  
  //
  //
  
  for (const selector of selectors) {
    const field = document.querySelector<HTMLInputElement>(selector);
    //
    if (field) {
      const visible = isVisible(field);
      //
      if (visible) {
        return field;
      }
    }
  }
  
  return null;
}

// Check if element is visible
function isVisible(element: HTMLElement): boolean {
  const style = window.getComputedStyle(element);
  return (
    style.display !== "none" &&
    style.visibility !== "hidden" &&
    style.opacity !== "0" &&
    element.offsetParent !== null
  );
}

// Fill a form field with a value
function fillField(field: HTMLInputElement, value: string): void {
  // Set the value using multiple methods to ensure compatibility
  field.value = value;
  field.setAttribute("value", value);
  
  // Focus the field briefly
  field.focus();
}

// Trigger input events so frameworks like React/Vue detect the change
function triggerInputEvent(field: HTMLInputElement): void {
  // Create and dispatch various events
  const events = [
    new Event("input", { bubbles: true, cancelable: true }),
    new Event("change", { bubbles: true, cancelable: true }),
    new KeyboardEvent("keydown", { bubbles: true, cancelable: true }),
    new KeyboardEvent("keyup", { bubbles: true, cancelable: true }),
  ];
  
  events.forEach((event) => field.dispatchEvent(event));
  
  // For React specifically
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value"
  )?.set;
  
  if (nativeInputValueSetter) {
    nativeInputValueSetter.call(field, field.value);
    field.dispatchEvent(new Event("input", { bubbles: true }));
  }
}
