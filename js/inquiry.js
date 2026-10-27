import { inquiryConfig } from './inquiry-config.js';
import { canSubmit, createDelivery } from './inquiry-delivery.mjs';
const form = document.querySelector('#project-inquiry');
if (form) {
  const submit = form.querySelector('[type="submit"]');
  const status = form.querySelector('#inquiry-status');
  const activation = document.querySelector('#inquiry-activation');
  const active = canSubmit(inquiryConfig, location.origin);
  const fields = [...form.querySelectorAll('[data-validate]')];
  const messages = { name: 'Enter your full name (at least 2 characters).', email: 'Enter a valid email address.', service: 'Choose a service.', details: 'Describe your project in at least 20 characters.', consent: 'Please agree to the use of your details to respond to this enquiry.' };
  function validate(field) {
    field.setCustomValidity('');
    if (field.required && !field.value.trim()) field.setCustomValidity(messages[field.name]);
    if (field.name === 'name' && field.value.trim().length < 2) field.setCustomValidity(messages.name);
    if (field.name === 'details' && field.value.trim().length < 20) field.setCustomValidity(messages.details);
    const valid = field.validity.valid;
    field.setAttribute('aria-invalid', String(!valid));
    const error = document.getElementById(field.id + '-error');
    error.textContent = valid ? '' : messages[field.name];
    return valid;
  }
  fields.forEach(field => {
    field.addEventListener('blur', () => validate(field));
    field.addEventListener('input', () => { if (field.getAttribute('aria-invalid') === 'true') validate(field); });
    field.addEventListener('change', () => validate(field));
  });
  const send = createDelivery(inquiryConfig, fetch, location.origin);
  if (active) {
    submit.disabled = false;
    activation.textContent = inquiryConfig.testMode ? 'TEST MODE — REAL SUBMISSIONS' : 'Project enquiry';
    status.textContent = '';
  }
  let pending = false;
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (pending) return;
    if (!active) { status.textContent = 'Awaiting activation. Please use the direct email or WhatsApp links above.'; return; }
    const invalid = fields.filter(field => !validate(field));
    if (invalid.length) { status.textContent = 'Please correct the highlighted fields.'; invalid[0].focus(); return; }
    pending = true; submit.disabled = true; form.setAttribute('aria-busy', 'true');
    status.textContent = 'Sending your enquiry…'; submit.textContent = 'Sending…';
    const values = Object.fromEntries(new FormData(form));
    const result = await send(values);
    if (result.state === 'accepted') {
      status.textContent = 'Your enquiry has been accepted by the form service. Thank you for getting in touch.';
      form.reset(); fields.forEach(f => f.removeAttribute('aria-invalid'));
    } else {
      status.textContent = 'Submission could not be confirmed. Your entries are preserved. Email ahmedm.abduldaiem@gmail.com or try again.';
    }
    pending = false; submit.disabled = false; submit.textContent = 'Send enquiry'; form.removeAttribute('aria-busy');
  });
}
