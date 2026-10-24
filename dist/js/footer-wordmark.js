import { WORDMARK_PATH } from './wordmark.js';

// Match the existing full-link gradient rather than restarting it at the logo.
// Roobert400 metrics: prefix5.051em + former brand4.115em; existing gap/arrow
// widths remain unchanged. Each document contains one footer and these two IDs.
export function renderFooterWordmark(){
 const stops='<stop offset="0" stop-color="#6d2944"/><stop offset=".5" stop-color="#b16e78"/><stop offset="1" stop-color="#a56e3c"/>';
 return `<svg class="footer-wordmark" viewBox="0 0 281 60" aria-hidden="true" focusable="false"><defs><linearGradient id="footer-brand-gradient-wide" gradientUnits="userSpaceOnUse" x1="-344.9164034" y1="0" x2="399.1886158" y2="0">${stops}</linearGradient><linearGradient id="footer-brand-gradient-narrow" gradientUnits="userSpaceOnUse" x1="-344.9164034" y1="0" x2="389.3916758" y2="0">${stops}</linearGradient></defs><path fill="url(#footer-brand-gradient-wide)" fill-rule="evenodd" d="${WORDMARK_PATH}"/></svg>`;
}
