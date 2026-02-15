const app = document.getElementById("app");
const noCodeLink = document.getElementById("noCodeLink");
const backToCodeLink = document.getElementById("backToCodeLink");
const codeInput = document.getElementById("code");
const nameInput = document.getElementById("name");
const continueBtn = document.querySelector(".code-page .btn");

const DEMO_STORAGE_KEY = "sdl_demo_access";
const DASHBOARD_URL = "./SDL-APPS/dashboard.html";
const DEMO_CODES = {
  "DEMO-ALPHA": {
    label: "Code 1",
    mode: "all_except",
    apps: ["Admin Panel"]
  },
  "DEMO-BETA": {
    label: "Code 2",
    mode: "all_except",
    apps: ["Finance App"]
  }
};

function showForm(event) {
  event.preventDefault();
  app.classList.add("form-mode");
  nameInput.focus();
}

function showCode(event) {
  event.preventDefault();
  app.classList.remove("form-mode");
  codeInput.focus();
}

function getDemoAccessFromCode(codeInputValue) {
  const normalizedCode = (codeInputValue || "").trim().toUpperCase();
  const rule = DEMO_CODES[normalizedCode];

  if (!rule) return null;

  return {
    isDemo: true,
    email: "demo@sdlclient.com",
    code: normalizedCode,
    label: rule.label,
    mode: rule.mode,
    apps: rule.apps
  };
}

function handleCodeContinue() {
  const demoAccess = getDemoAccessFromCode(codeInput.value);
  if (!demoAccess) {
    alert("Invalid code. Please use the provided demo code.");
    return;
  }

  localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(demoAccess));
  window.location.href = `${DASHBOARD_URL}?demo_code=${encodeURIComponent(demoAccess.code)}`;
}

noCodeLink.addEventListener("click", showForm);
backToCodeLink.addEventListener("click", showCode);
continueBtn.addEventListener("click", handleCodeContinue);
codeInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    handleCodeContinue();
  }
});
