<script>
  import { onMount } from 'svelte';

  // View modes: 'signin' | 'signup' | 'forgot'
  let mode = $state('signin');

  // Form fields
  let fullName = $state('');
  let email = $state('');
  let password = $state('');
  let confirmPassword = $state('');
  let keepSignedIn = $state(true);
  let showPassword = $state(false);

  // Validation & user feedback states
  let errors = $state({ fullName: '', email: '', password: '', confirmPassword: '' });
  let statusMessage = $state('');
  let statusType = $state(''); // 'error' | 'success'
  let isSubmitting = $state(false);

  // Restore saved email if user previously checked "Keep me signed in"
  onMount(() => {
    const savedEmail = localStorage.getItem('pennywise_saved_email');
    if (savedEmail) {
      email = savedEmail;
      keepSignedIn = true;
    }
  });

  function switchMode(newMode) {
    mode = newMode;
    errors = { fullName: '', email: '', password: '', confirmPassword: '' };
    statusMessage = '';
    statusType = '';
    password = '';
    confirmPassword = '';
  }

  function validateForm() {
    let valid = true;
    const newErrors = { fullName: '', email: '', password: '', confirmPassword: '' };

    if (mode === 'signup' && fullName.trim().length < 2) {
      newErrors.fullName = 'Please enter your full name.';
      valid = false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address.';
      valid = false;
    }

    if (mode !== 'forgot' && password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters.';
      valid = false;
    }

    if (mode === 'signup' && password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
      valid = false;
    }

    errors = newErrors;
    return valid;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    statusMessage = '';

    if (!validateForm()) {
      statusType = 'error';
      statusMessage = 'Please fix the highlighted fields to continue.';
      return;
    }

    isSubmitting = true;
    await new Promise((resolve) => setTimeout(resolve, 500));
    isSubmitting = false;

    if (mode === 'forgot') {
      statusType = 'success';
      statusMessage = `Password reset link sent to ${email.trim()}. Check your inbox.`;
      return;
    }

    // Handle "Keep me signed in on this computer"
    if (keepSignedIn) {
      localStorage.setItem('pennywise_saved_email', email.trim());
    } else {
      localStorage.removeItem('pennywise_saved_email');
    }

    // Store active user session for the rest of the PennyWise budget app
    const userSession = {
      name: mode === 'signup' ? fullName.trim() : email.split('@')[0],
      email: email.trim(),
      currency: 'NGN'
    };
    localStorage.setItem('pennywise_active_user', JSON.stringify(userSession));

    statusType = 'success';
    statusMessage =
      mode === 'signin'
        ? `Welcome back! Signed in as ${email.trim()}.`
        : `Account created for ${fullName.trim()}! Welcome to PennyWise.`;
  }
</script>

<svelte:head>
  <title>PennyWise — {mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Reset Password'}</title>
</svelte:head>

<main class="page-wrapper">
  <section class="auth-card" aria-labelledby="auth-title">
    <!-- PennyWise Logo (accessible inline SVG replacing broken image) -->
    <div class="brand-header">
      <svg
        class="brand-icon"
        width="30"
        height="30"
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden="true"
      >
        <rect width="32" height="32" rx="8" fill="#047857" />
        <path
          d="M11 22V10H17.5C19.9853 10 22 12.0147 22 14.5C22 16.9853 19.9853 19 17.5 19H11"
          stroke="white"
          stroke-width="2.6"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <line x1="9" y1="14.5" x2="23" y2="14.5" stroke="#A7F3D0" stroke-width="2" />
      </svg>
      <span class="brand-name">PennyWise</span>
    </div>

    <!-- Dynamic Header -->
    <header class="card-header">
      <h1 id="auth-title">
        {#if mode === 'signin'}
          Welcome back
        {:else if mode === 'signup'}
          Create your account
        {:else}
          Reset your password
        {/if}
      </h1>
      <p class="subtitle">
        {#if mode === 'signin'}
          Sign in to manage your money in Naira
        {:else if mode === 'signup'}
          Start managing and budgeting your money in Naira
        {:else}
          Enter your email to receive a password reset link
        {/if}
      </p>
    </header>

    <!-- Screen-reader live status feedback -->
    {#if statusMessage}
      <div
        class="status-banner {statusType}"
        role={statusType === 'error' ? 'alert' : 'status'}
        aria-live="polite"
      >
        {statusMessage}
      </div>
    {/if}

    <!-- Actionable & Accessible Form -->
    <form onsubmit={handleSubmit} novalidate>
      {#if mode === 'signup'}
        <div class="field-group">
          <label for="full-name">Full name</label>
          <input
            id="full-name"
            type="text"
            bind:value={fullName}
            placeholder="e.g. Tunde Adebayo"
            autocomplete="name"
            aria-invalid={!!errors.fullName}
            aria-describedby={errors.fullName ? 'name-error' : undefined}
          />
          {#if errors.fullName}
            <span id="name-error" class="field-error">{errors.fullName}</span>
          {/if}
        </div>
      {/if}

      <div class="field-group">
        <label for="email">Email address</label>
        <input
          id="email"
          type="email"
          bind:value={email}
          placeholder="tunde.adebayo@gmail.com"
          autocomplete="email"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'email-error' : undefined}
        />
        {#if errors.email}
          <span id="email-error" class="field-error">{errors.email}</span>
        {/if}
      </div>

      {#if mode !== 'forgot'}
        <div class="field-group">
          <div class="label-row">
            <label for="password">Password</label>
            {#if mode === 'signin'}
              <button
                type="button"
                class="text-link small"
                onclick={() => switchMode('forgot')}
              >
                Forgot password?
              </button>
            {/if}
          </div>

          <div class="password-input-wrap">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              bind:value={password}
              placeholder="••••••••••••••"
              autocomplete={mode === 'signin' ? 'current-password' : 'new-password'}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'password-error' : undefined}
            />
            <button
              type="button"
              class="toggle-visibility"
              onclick={() => (showPassword = !showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>

          {#if errors.password}
            <span id="password-error" class="field-error">{errors.password}</span>
          {/if}
        </div>
      {/if}

      {#if mode === 'signup'}
        <div class="field-group">
          <label for="confirm-password">Confirm password</label>
          <input
            id="confirm-password"
            type={showPassword ? 'text' : 'password'}
            bind:value={confirmPassword}
            placeholder="••••••••••••••"
            autocomplete="new-password"
            aria-invalid={!!errors.confirmPassword}
            aria-describedby={errors.confirmPassword ? 'confirm-error' : undefined}
          />
          {#if errors.confirmPassword}
            <span id="confirm-error" class="field-error">{errors.confirmPassword}</span>
          {/if}
        </div>
      {/if}

      {#if mode === 'signin'}
        <div class="checkbox-row">
          <input
            id="keep-signed-in"
            type="checkbox"
            bind:checked={keepSignedIn}
          />
          <label for="keep-signed-in">Keep me signed in on this computer</label>
        </div>
      {/if}

      <button type="submit" class="primary-btn" disabled={isSubmitting}>
        {#if isSubmitting}
          Please wait...
        {:else if mode === 'signin'}
          Sign in
        {:else if mode === 'signup'}
          Create account
        {:else}
          Send reset link
        {/if}
      </button>
    </form>

    <hr class="divider" />

    <!-- Toggle Between Sign In and Create Account -->
    <footer class="card-footer">
      {#if mode === 'signin'}
        <p>
          Don't have an account?
          <button type="button" class="text-link" onclick={() => switchMode('signup')}>
            Create account
          </button>
        </p>
      {:else}
        <p>
          Already have an account?
          <button type="button" class="text-link" onclick={() => switchMode('signin')}>
            Sign in
          </button>
        </p>
      {/if}
    </footer>
  </section>
</main>

<style>
  :global(body) {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
    background-color: #f3f4f6;
    color: #111827;
  }

  .page-wrapper {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.25rem;
  }

  .auth-card {
    background: #ffffff;
    width: 100%;
    max-width: 420px;
    padding: 2.5rem 2.25rem;
    border-radius: 14px;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.05);
    box-sizing: border-box;
  }

  .brand-header {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.6rem;
    margin-bottom: 1.5rem;
  }

  .brand-name {
    font-size: 1.35rem;
    font-weight: 700;
    color: #111827;
    letter-spacing: -0.02em;
  }

  .card-header {
    text-align: center;
    margin-bottom: 1.75rem;
  }

  .card-header h1 {
    margin: 0 0 0.4rem;
    font-size: 1.45rem;
    font-weight: 700;
    color: #111827;
  }

  .subtitle {
    margin: 0;
    font-size: 0.9rem;
    color: #6b7280;
  }

  .status-banner {
    padding: 0.75rem 0.9rem;
    border-radius: 8px;
    font-size: 0.875rem;
    margin-bottom: 1.25rem;
    font-weight: 500;
  }

  .status-banner.error {
    background-color: #fef2f2;
    color: #b91c1c;
    border: 1px solid #fecaca;
  }

  .status-banner.success {
    background-color: #ecfdf5;
    color: #065f46;
    border: 1px solid #a7f3d0;
  }

  .field-group {
    margin-bottom: 1.15rem;
    display: flex;
    flex-direction: column;
  }

  .label-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.4rem;
  }

  label {
    font-size: 0.875rem;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 0.4rem;
  }

  .label-row label {
    margin-bottom: 0;
  }

  input[type='text'],
  input[type='email'],
  input[type='password'] {
    width: 100%;
    padding: 0.75rem 0.9rem;
    background-color: #f3f4f6;
    border: 1.5px solid transparent;
    border-radius: 8px;
    font-size: 0.95rem;
    color: #111827;
    box-sizing: border-box;
    transition: border-color 0.15s, background-color 0.15s;
  }

  input:focus {
    background-color: #ffffff;
    border-color: #047857;
    outline: 3px solid rgba(4, 120, 87, 0.2);
    outline-offset: 0;
  }

  input[aria-invalid='true'] {
    border-color: #dc2626;
    background-color: #fef2f2;
  }

  .password-input-wrap {
    position: relative;
    display: flex;
    align-items: center;
  }

  .password-input-wrap input {
    padding-right: 4rem;
  }

  .toggle-visibility {
    position: absolute;
    right: 0.65rem;
    background: none;
    border: none;
    color: #4b5563;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    padding: 0.3rem 0.45rem;
    border-radius: 4px;
  }

  .toggle-visibility:hover {
    color: #111827;
    background-color: #e5e7eb;
  }

  .field-error {
    color: #dc2626;
    font-size: 0.8rem;
    margin-top: 0.35rem;
  }

  .checkbox-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0.75rem 0 1.25rem;
  }

  .checkbox-row input[type='checkbox'] {
    width: 16px;
    height: 16px;
    accent-color: #2563eb;
    cursor: pointer;
  }

  .checkbox-row label {
    margin: 0;
    font-weight: 400;
    font-size: 0.875rem;
    color: #4b5563;
    cursor: pointer;
  }

  .primary-btn {
    width: 100%;
    padding: 0.85rem;
    background-color: #047857;
    color: #ffffff;
    border: none;
    border-radius: 8px;
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.15s;
  }

  .primary-btn:hover:not(:disabled) {
    background-color: #065f46;
  }

  .primary-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  button:focus-visible,
  input[type='checkbox']:focus-visible {
    outline: 3px solid rgba(4, 120, 87, 0.35);
    outline-offset: 2px;
  }

  .divider {
    border: none;
    border-top: 1px solid #e5e7eb;
    margin: 1.5rem 0 1.25rem;
  }

  .card-footer {
    text-align: center;
    font-size: 0.875rem;
    color: #6b7280;
  }

  .card-footer p {
    margin: 0;
  }

  .text-link {
    background: none;
    border: none;
    color: #047857;
    font-weight: 600;
    font-size: inherit;
    cursor: pointer;
    padding: 0.15rem 0.25rem;
    border-radius: 4px;
  }

  .text-link.small {
    font-size: 0.825rem;
  }

  .text-link:hover {
    text-decoration: underline;
  }
</style>
