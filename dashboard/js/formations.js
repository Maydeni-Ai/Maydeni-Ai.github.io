/**
 * Maydeni AI — Formations / Training Scheduling
 * Calendar-based booking for clients, admin management panel
 */

let formationCurrentMonth = new Date().getMonth();
let formationCurrentYear = new Date().getFullYear();
let formationSelectedDate = null;
let formationAvailableDates = {};
let formationRequestType = 'meeting'; // 'meeting' or 'email'

// ────────────────────────────────────────────────────────
// Entry point — called by navigateTo('formations')
// ────────────────────────────────────────────────────────
async function loadFormationsSection() {
  const isAdmin = api.user && api.user.role === 'admin';
  const clientDiv = document.getElementById('formation-client');
  const adminDiv = document.getElementById('formation-admin');

  if (isAdmin) {
    clientDiv.style.display = 'none';
    adminDiv.style.display = 'block';
    loadAdminFormations();
  } else {
    clientDiv.style.display = 'block';
    adminDiv.style.display = 'none';
    formationRequestType = 'meeting';
    setFormationType('meeting');
    await loadMyFormation();
    renderFormationCalendar();
  }
}

// ════════════════════════════════════════════════════════
// CLIENT — Type toggle (meeting vs email)
// ════════════════════════════════════════════════════════

function setFormationType(type) {
  formationRequestType = type;
  const meetingLabel = document.getElementById('formation-type-meeting-label');
  const emailLabel = document.getElementById('formation-type-email-label');
  const meetingSection = document.getElementById('formation-meeting-section');
  const emailSubmit = document.getElementById('formation-email-submit');

  if (type === 'meeting') {
    meetingLabel.style.borderColor = 'var(--primary, #3b82f6)';
    meetingLabel.style.background = 'rgba(59,130,246,0.06)';
    emailLabel.style.borderColor = 'var(--border)';
    emailLabel.style.background = 'transparent';
    meetingSection.style.display = 'block';
    emailSubmit.style.display = 'none';
  } else {
    emailLabel.style.borderColor = 'var(--primary, #3b82f6)';
    emailLabel.style.background = 'rgba(59,130,246,0.06)';
    meetingLabel.style.borderColor = 'var(--border)';
    meetingLabel.style.background = 'transparent';
    meetingSection.style.display = 'none';
    emailSubmit.style.display = 'block';
  }
  // Re-init lucide icons if available
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

async function submitEmailRequest() {
  const problemField = document.getElementById('formation-problem');
  const problem = (problemField?.value || '').trim();
  if (problem.length < 10) {
    showToast('Veuillez décrire votre problème (minimum 10 caractères)', 'error');
    problemField?.focus();
    return;
  }
  if (!confirm('Envoyer votre demande par email ? Le développeur vous répondra dans les meilleurs délais.')) return;

  try {
    await api.post('/formations/email-request', { problem_description: problem });
    showToast('Demande envoyée ! Vous recevrez une réponse par email.', 'success');
    if (problemField) problemField.value = '';
    await loadMyFormation();
  } catch (e) {
    showToast(e.message || 'Erreur', 'error');
  }
}

// ════════════════════════════════════════════════════════
// CLIENT — Calendar & Booking
// ════════════════════════════════════════════════════════

function changeFormationMonth(delta) {
  formationCurrentMonth += delta;
  if (formationCurrentMonth > 11) { formationCurrentMonth = 0; formationCurrentYear++; }
  if (formationCurrentMonth < 0) { formationCurrentMonth = 11; formationCurrentYear--; }
  formationSelectedDate = null;
  document.getElementById('formation-slots').style.display = 'none';
  renderFormationCalendar();
}

async function renderFormationCalendar() {
  const monthStr = `${formationCurrentYear}-${String(formationCurrentMonth + 1).padStart(2, '0')}`;
  const label = document.getElementById('formation-month-label');
  const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  label.textContent = `${months[formationCurrentMonth]} ${formationCurrentYear}`;

  // Disable prev button if current month is this month or before
  const now = new Date();
  const prevBtn = document.getElementById('formation-prev-month');
  if (formationCurrentYear < now.getFullYear() ||
    (formationCurrentYear === now.getFullYear() && formationCurrentMonth <= now.getMonth())) {
    prevBtn.disabled = true;
    prevBtn.style.opacity = '0.4';
  } else {
    prevBtn.disabled = false;
    prevBtn.style.opacity = '1';
  }

  // Fetch available dates
  try {
    const data = await api.get(`/formations/available-dates?month=${monthStr}`);
    formationAvailableDates = {};
    (data.dates || []).forEach(d => { formationAvailableDates[d.date] = d; });
  } catch (e) {
    console.error('Error loading available dates:', e);
  }

  const calendar = document.getElementById('formation-calendar');
  calendar.innerHTML = '';

  // Day headers
  const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  dayNames.forEach(d => {
    const cell = document.createElement('div');
    cell.textContent = d;
    cell.style.cssText = 'text-align:center;font-size:11px;font-weight:700;color:var(--muted);padding:4px 0;';
    calendar.appendChild(cell);
  });

  // First day of month
  const firstDay = new Date(formationCurrentYear, formationCurrentMonth, 1);
  let startDay = firstDay.getDay(); // 0=Sun
  startDay = startDay === 0 ? 6 : startDay - 1; // Convert to Mon=0

  // Empty cells
  for (let i = 0; i < startDay; i++) {
    calendar.appendChild(document.createElement('div'));
  }

  // Days of month
  const daysInMonth = new Date(formationCurrentYear, formationCurrentMonth + 1, 0).getDate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const minBookDate = new Date(today);
  minBookDate.setDate(minBookDate.getDate() + 2); // 2-day advance

  for (let day = 1; day <= daysInMonth; day++) {
    const cell = document.createElement('div');
    cell.textContent = day;
    cell.style.cssText = 'text-align:center;padding:8px 4px;border-radius:8px;font-size:13px;cursor:default;transition:all .15s;';

    const dateObj = new Date(formationCurrentYear, formationCurrentMonth, day);
    const dateStr = `${formationCurrentYear}-${String(formationCurrentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayOfWeek = dateObj.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isTooSoon = dateObj < minBookDate; // must be 2+ days ahead
    const info = formationAvailableDates[dateStr];

    if (isWeekend || isTooSoon) {
      cell.style.color = 'var(--muted)';
      cell.style.opacity = '0.4';
      if (isTooSoon && !isWeekend && dateObj >= today) cell.title = 'Réservation 2 jours à l\'avance minimum';
    } else if (info && info.full) {
      cell.style.color = '#ef4444';
      cell.style.opacity = '0.6';
      cell.title = 'Complet';
    } else if (info && info.available > 0) {
      cell.style.background = 'var(--primary-light, rgba(59,130,246,0.1))';
      cell.style.color = 'var(--primary, #3b82f6)';
      cell.style.fontWeight = '700';
      cell.style.cursor = 'pointer';
      cell.title = `${info.available} créneaux disponibles`;
      cell.addEventListener('click', () => selectFormationDate(dateStr, day));
    } else if (!isWeekend && !isTooSoon) {
      // Future weekday not in available-dates response (might still have slots)
      cell.style.cursor = 'pointer';
      cell.style.color = 'var(--text)';
      cell.addEventListener('click', () => selectFormationDate(dateStr, day));
    }

    // Highlight selected
    if (dateStr === formationSelectedDate) {
      cell.style.background = 'var(--primary, #3b82f6)';
      cell.style.color = '#fff';
      cell.style.fontWeight = '700';
    }

    calendar.appendChild(cell);
  }
}

async function selectFormationDate(dateStr, day) {
  formationSelectedDate = dateStr;
  renderFormationCalendar(); // re-render to highlight

  const slotsDiv = document.getElementById('formation-slots');
  const slotsTitle = document.getElementById('formation-slots-title');
  const slotsList = document.getElementById('formation-slots-list');

  slotsDiv.style.display = 'block';
  const dateObj = new Date(dateStr + 'T12:00:00');
  const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  slotsTitle.textContent = `${dayNames[dateObj.getDay()]} ${day} — Créneaux disponibles`;
  slotsList.innerHTML = '<div style="color:var(--muted);font-size:13px;">Chargement...</div>';

  try {
    const data = await api.get(`/formations/slots?date=${dateStr}`);
    slotsList.innerHTML = '';

    if (!data.slots || data.slots.length === 0) {
      slotsList.innerHTML = '<div style="color:var(--muted);font-size:13px;">Aucun créneau disponible</div>';
      return;
    }

    data.slots.forEach(slot => {
      const btn = document.createElement('button');
      btn.textContent = `${slot.start} – ${slot.end}`;
      btn.className = 'btn';
      btn.style.cssText = 'font-size:13px;padding:8px 16px;border-radius:8px;';

      if (slot.available) {
        btn.classList.add('btn-primary');
        btn.style.opacity = '1';
        btn.addEventListener('click', () => showBookingConfirmation(dateStr, slot.start, slot.end, day));
      } else {
        btn.disabled = true;
        btn.style.opacity = '0.4';
        btn.style.textDecoration = 'line-through';
        btn.title = 'Déjà réservé';
      }
      slotsList.appendChild(btn);
    });
  } catch (e) {
    slotsList.innerHTML = `<div style="color:#ef4444;font-size:13px;">${e.message || 'Erreur'}</div>`;
  }
}

async function showBookingConfirmation(date, startTime, endTime, day) {
  const problemField = document.getElementById('formation-problem');
  const problem = (problemField?.value || '').trim();

  // Validate problem field — highlight it visually if empty
  if (problem.length < 10) {
    problemField.style.border = '2px solid #ef4444';
    problemField.style.background = 'rgba(239,68,68,0.05)';
    problemField.focus();
    problemField.scrollIntoView({ behavior: 'smooth', block: 'center' });
    // Show inline error
    let errMsg = problemField.parentElement.querySelector('.formation-error');
    if (!errMsg) {
      errMsg = document.createElement('div');
      errMsg.className = 'formation-error';
      errMsg.style.cssText = 'color:#ef4444;font-size:13px;font-weight:600;margin-top:6px;';
      problemField.parentElement.appendChild(errMsg);
    }
    errMsg.textContent = '⚠️ Veuillez décrire votre problème (minimum 10 caractères) avant de réserver.';
    // Clear red border on input
    problemField.addEventListener('input', function handler() {
      if (problemField.value.trim().length >= 10) {
        problemField.style.border = '';
        problemField.style.background = '';
        if (errMsg) errMsg.remove();
        problemField.removeEventListener('input', handler);
      }
    });
    return;
  }

  // Show confirmation panel
  const confirmDiv = document.getElementById('formation-confirm');
  const dateObj = new Date(date + 'T12:00:00');
  const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  const dateLabel = `${dayNames[dateObj.getDay()]} ${dateObj.getDate()} ${months[dateObj.getMonth()]} ${dateObj.getFullYear()}`;

  confirmDiv.style.display = 'block';
  confirmDiv.innerHTML = `
    <div style="background:linear-gradient(135deg,#3b82f6 0%,#1d4ed8 100%);border-radius:12px;padding:20px 24px;color:#fff;animation:fadeIn .3s ease;">
      <h4 style="margin:0 0 12px;font-size:16px;">📋 Confirmer votre rendez-vous</h4>
      <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:12px;">
        <div style="background:rgba(255,255,255,.15);border-radius:8px;padding:10px 16px;flex:1;min-width:140px;">
          <div style="font-size:11px;opacity:.7;margin-bottom:2px;">Date</div>
          <div style="font-weight:700;font-size:15px;">${dateLabel}</div>
        </div>
        <div style="background:rgba(255,255,255,.15);border-radius:8px;padding:10px 16px;flex:1;min-width:140px;">
          <div style="font-size:11px;opacity:.7;margin-bottom:2px;">Créneau</div>
          <div style="font-weight:700;font-size:15px;">${startTime} – ${endTime}</div>
        </div>
      </div>
      <div style="background:rgba(255,255,255,.12);border-radius:8px;padding:10px 14px;margin-bottom:16px;font-size:13px;">
        <div style="font-size:11px;opacity:.7;margin-bottom:4px;">Votre problème</div>
        <div>${sanitize(problem).substring(0, 200)}${problem.length > 200 ? '...' : ''}</div>
      </div>
      <div style="display:flex;gap:10px;">
        <button class="btn" onclick="cancelBookingConfirmation()" style="background:rgba(255,255,255,.2);color:#fff;border:1px solid rgba(255,255,255,.3);flex:1;padding:10px;">Annuler</button>
        <button class="btn" id="formation-confirm-btn" onclick="confirmBooking('${date}', '${startTime}')" style="background:#fff;color:#1d4ed8;font-weight:700;flex:2;padding:10px;font-size:14px;">✅ Confirmer le rendez-vous</button>
      </div>
    </div>`;
  confirmDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function cancelBookingConfirmation() {
  const confirmDiv = document.getElementById('formation-confirm');
  if (confirmDiv) { confirmDiv.style.display = 'none'; confirmDiv.innerHTML = ''; }
}

async function confirmBooking(date, startTime) {
  const problemField = document.getElementById('formation-problem');
  const problem = (problemField?.value || '').trim();
  const confirmBtn = document.getElementById('formation-confirm-btn');
  if (confirmBtn) { confirmBtn.disabled = true; confirmBtn.textContent = '⏳ Réservation en cours...'; }

  try {
    await api.post('/formations/book', { date, start_time: startTime, problem_description: problem });

    // Show success in the confirmation area
    const confirmDiv = document.getElementById('formation-confirm');
    confirmDiv.innerHTML = `
      <div style="background:linear-gradient(135deg,#10b981 0%,#059669 100%);border-radius:12px;padding:24px;color:#fff;text-align:center;animation:fadeIn .3s ease;">
        <div style="font-size:32px;margin-bottom:8px;">✅</div>
        <div style="font-size:18px;font-weight:700;margin-bottom:4px;">Rendez-vous confirmé !</div>
        <div style="font-size:13px;opacity:.85;">Votre meeting est planifié. Le développeur vous enverra le lien de visioconférence.</div>
      </div>`;

    document.getElementById('formation-slots').style.display = 'none';
    formationSelectedDate = null;
    if (problemField) problemField.value = '';

    // Reload my formation to show the green card
    setTimeout(async () => {
      await loadMyFormation();
      renderFormationCalendar();
      // Also fade out confirm card after showing existing booking
      setTimeout(() => { confirmDiv.style.display = 'none'; confirmDiv.innerHTML = ''; }, 3000);
    }, 1500);
  } catch (e) {
    const confirmDiv = document.getElementById('formation-confirm');
    confirmDiv.innerHTML = `
      <div style="background:#fef2f2;border:2px solid #ef4444;border-radius:12px;padding:20px;color:#991b1b;text-align:center;">
        <div style="font-size:24px;margin-bottom:6px;">❌</div>
        <div style="font-weight:700;margin-bottom:4px;">Erreur</div>
        <div style="font-size:13px;">${sanitize(e.message || 'Erreur lors de la réservation')}</div>
        <button class="btn" onclick="cancelBookingConfirmation()" style="margin-top:12px;font-size:13px;">Fermer</button>
      </div>`;
  }
}

async function loadMyFormation() {
  const container = document.getElementById('formation-existing');
  try {
    const data = await api.get('/formations/my');
    const sessions = data.sessions || [];
    const booked = sessions.find(s => s.status === 'booked' || s.status === 'pending' || s.status === 'responded');

    if (booked) {
      container.style.display = 'block';
      const isEmail = booked.request_type === 'email';

      if (isEmail) {
        // Pending/responded email request
        const createdDate = new Date(booked.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
        const isResponded = booked.status === 'responded';
        const gradientBg = isResponded ? 'linear-gradient(135deg,#10b981 0%,#059669 100%)' : 'linear-gradient(135deg,#6366f1 0%,#4f46e5 100%)';
        container.innerHTML = `
          <div style="background:${gradientBg};border-radius:12px;padding:20px 24px;color:#fff;margin-bottom:20px;">
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
              <div>
                <div style="font-size:13px;opacity:.8;margin-bottom:4px;">Demande par email — ${isResponded ? '✅ Répondu' : 'En attente de réponse'}</div>
                <div style="font-size:14px;margin-top:4px;">Envoyée le ${createdDate}</div>
                ${booked.problem_description ? `<div style="font-size:13px;margin-top:8px;padding:8px 12px;background:rgba(255,255,255,.15);border-radius:8px;"><strong>Problème :</strong> ${sanitize(booked.problem_description)}</div>` : ''}
                ${booked.admin_response ? `<div style="font-size:13px;margin-top:8px;padding:12px 14px;background:rgba(255,255,255,.25);border-radius:8px;border-left:3px solid rgba(255,255,255,.6);"><strong>💬 Réponse de l'équipe Maydeni AI :</strong><br><span style="display:block;margin-top:6px;line-height:1.5;">${sanitize(booked.admin_response)}</span></div>` : ''}
              </div>
              ${booked.status === 'pending' ? `<button class="btn" onclick="cancelMyFormation(${booked.id})" style="background:rgba(255,255,255,.2);color:#fff;border:1px solid rgba(255,255,255,.3);font-size:13px;">Annuler</button>` : ''}
            </div>
          </div>`;
      } else {
        // Meeting booking
        const d = new Date(booked.session_date);
        const dateStr = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      container.innerHTML = `
        <div style="background:linear-gradient(135deg,#10b981 0%,#059669 100%);border-radius:12px;padding:20px 24px;color:#fff;margin-bottom:20px;">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
            <div>
              <div style="font-size:13px;opacity:.8;margin-bottom:4px;">Votre prochain rendez-vous</div>
              <div style="font-size:18px;font-weight:700;">${dateStr}</div>
              <div style="font-size:15px;margin-top:2px;">${booked.start_time.slice(0, 5)} – ${booked.end_time.slice(0, 5)}</div>
              ${booked.problem_description ? `<div style="font-size:13px;margin-top:8px;padding:8px 12px;background:rgba(255,255,255,.15);border-radius:8px;"><strong>Problème :</strong> ${sanitize(booked.problem_description)}</div>` : ''}
              ${booked.meeting_link ? `<a href="${sanitize(booked.meeting_link)}" target="_blank" rel="noopener" style="color:#fff;text-decoration:underline;font-size:13px;margin-top:8px;display:inline-block;">Rejoindre la visioconférence</a>` : '<div style="font-size:12px;opacity:.7;margin-top:8px;">Le lien de visioconférence sera ajouté par l\'administrateur</div>'}
            </div>
            <button class="btn" onclick="cancelMyFormation(${booked.id})" style="background:rgba(255,255,255,.2);color:#fff;border:1px solid rgba(255,255,255,.3);font-size:13px;">Annuler</button>
          </div>
        </div>`;
      } // end meeting block
    } else {
      container.style.display = 'none';
      container.innerHTML = '';
    }

    // Show past sessions if any
    const past = sessions.filter(s => s.status !== 'booked' && s.status !== 'pending' && s.status !== 'responded');
    if (past.length > 0 && !booked) {
      container.style.display = 'block';
      container.innerHTML = `
        <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px 20px;margin-bottom:20px;">
          <h4 style="margin:0 0 12px;font-size:14px;color:var(--muted);">Historique</h4>
          ${past.map(s => {
            const typeIcon = s.request_type === 'email' ? '📧' : '🎥';
            const statusLabels = { completed: '✅ Terminée', cancelled: '❌ Annulée', no_show: '⚠️ Absent', responded: '✅ Répondu' };
            const dateInfo = s.session_date ? new Date(s.session_date).toLocaleDateString('fr-FR') + ' ' + s.start_time.slice(0, 5) + '–' + s.end_time.slice(0, 5) : new Date(s.created_at).toLocaleDateString('fr-FR');
            return `<div style="padding:8px 0;border-bottom:1px solid var(--border);font-size:13px;">
              <div style="display:flex;justify-content:space-between;">
                <span>${typeIcon} ${dateInfo}</span>
                <span>${statusLabels[s.status] || s.status}</span>
              </div>
              ${s.admin_response ? `<div style="font-size:12px;color:var(--text);margin-top:4px;padding:6px 10px;background:rgba(16,185,129,0.06);border-radius:6px;border-left:3px solid #10b981;"><strong>Réponse :</strong> ${sanitize(s.admin_response)}</div>` : ''}
            </div>`;
          }).join('')}
        </div>`;
    }
  } catch (e) {
    container.style.display = 'none';
  }
}

async function cancelMyFormation(id) {
  if (!confirm('Annuler votre formation ? Vous pourrez en réserver une nouvelle.')) return;
  try {
    await api.del(`/formations/cancel/${id}`);
    showToast('Formation annulée', 'success');
    await loadMyFormation();
    renderFormationCalendar();
  } catch (e) {
    showToast(e.message || 'Erreur', 'error');
  }
}

// Simple text sanitizer
function sanitize(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ════════════════════════════════════════════════════════
// ADMIN — Sessions management
// ════════════════════════════════════════════════════════

async function loadAdminFormations() {
  const statusFilter = document.getElementById('formation-admin-status')?.value || '';
  const fromDate = document.getElementById('formation-admin-from')?.value || '';
  const toDate = document.getElementById('formation-admin-to')?.value || '';
  const typeFilter = document.getElementById('formation-admin-type')?.value || '';

  const params = new URLSearchParams();
  if (statusFilter) params.append('status', statusFilter);
  if (fromDate) params.append('from', fromDate);
  if (toDate) params.append('to', toDate);
  if (typeFilter) params.append('type', typeFilter);

  const container = document.getElementById('formation-admin-list');
  const statsDiv = document.getElementById('formation-admin-stats');

  container.innerHTML = '<div style="color:var(--muted);padding:20px;text-align:center;">Chargement...</div>';

  try {
    const data = await api.get(`/formations/admin/all?${params.toString()}`);
    let sessions = data.sessions || [];

    // Client-side type filter (backend may not support it yet)
    if (typeFilter) sessions = sessions.filter(s => s.request_type === typeFilter);

    // Stats
    const booked = sessions.filter(s => s.status === 'booked').length;
    const pending = sessions.filter(s => s.status === 'pending').length;
    const completed = sessions.filter(s => s.status === 'completed' || s.status === 'responded').length;
    const cancelled = sessions.filter(s => s.status === 'cancelled').length;
    const noShow = sessions.filter(s => s.status === 'no_show').length;

    statsDiv.innerHTML = `
      <div class="stat-card"><div class="stat-value">${booked}</div><div class="stat-label">Meetings</div></div>
      <div class="stat-card"><div class="stat-value">${pending}</div><div class="stat-label">Emails en attente</div></div>
      <div class="stat-card"><div class="stat-value">${completed}</div><div class="stat-label">Terminées</div></div>
      <div class="stat-card"><div class="stat-value">${cancelled + noShow}</div><div class="stat-label">Annulées/No-show</div></div>
    `;

    if (sessions.length === 0) {
      container.innerHTML = '<div style="color:var(--muted);padding:40px;text-align:center;font-size:14px;">Aucune demande trouvée</div>';
      return;
    }

    container.innerHTML = sessions.map(s => {
      const isEmail = s.request_type === 'email';
      const typeIcon = isEmail ? '📧' : '🎥';
      const typeBadge = isEmail
        ? '<span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;background:#6366f1;color:#fff;margin-right:6px;">EMAIL</span>'
        : '<span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;background:#3b82f6;color:#fff;margin-right:6px;">MEETING</span>';

      let dateInfo;
      if (isEmail) {
        dateInfo = 'Demande email du ' + new Date(s.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
      } else {
        const d = new Date(s.session_date);
        dateInfo = d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) + ' — ' + s.start_time.slice(0, 5) + ' à ' + s.end_time.slice(0, 5);
      }

      const statusColors = { booked: '#3b82f6', completed: '#10b981', cancelled: '#ef4444', no_show: '#f59e0b', pending: '#8b5cf6', responded: '#10b981' };
      const statusLabels = { booked: 'Réservée', completed: 'Terminée', cancelled: 'Annulée', no_show: 'No-show', pending: 'En attente', responded: 'Répondu' };

      return `
        <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px 20px;margin-bottom:12px;">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;">
            <div style="flex:1;min-width:250px;">
              <div style="font-weight:700;font-size:15px;">${typeBadge}${dateInfo}</div>
              <div style="color:var(--muted);font-size:13px;margin-top:4px;">${sanitize(s.tenant_name || '')} — ${sanitize(s.director_name || s.director_email || '')}</div>
              ${s.director_email ? `<div style="font-size:12px;color:var(--muted);">${sanitize(s.director_email)}</div>` : ''}
              ${s.problem_description ? `<div style="font-size:13px;margin-top:8px;padding:8px 12px;background:var(--primary-light, rgba(59,130,246,0.08));border-radius:8px;border-left:3px solid var(--primary,#3b82f6);"><strong>Problème :</strong> ${sanitize(s.problem_description)}</div>` : ''}
              ${s.admin_response ? `<div style="font-size:13px;margin-top:6px;padding:8px 12px;background:rgba(16,185,129,0.08);border-radius:8px;border-left:3px solid #10b981;"><strong>Réponse admin :</strong> ${sanitize(s.admin_response)}</div>` : ''}
              ${s.meeting_link ? `<div style="font-size:12px;color:var(--primary);margin-top:4px;"><a href="${sanitize(s.meeting_link)}" target="_blank" rel="noopener">Lien visio</a></div>` : ''}
              ${s.notes ? `<div style="font-size:12px;color:var(--muted);margin-top:4px;font-style:italic;">${sanitize(s.notes)}</div>` : ''}
            </div>
            <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
              <span style="display:inline-block;padding:4px 10px;border-radius:6px;font-size:12px;font-weight:600;color:#fff;background:${statusColors[s.status] || '#6b7280'};">${statusLabels[s.status] || s.status}</span>
              <button class="btn btn-sm" onclick="editFormationSession(${s.id}, '${s.request_type || 'meeting'}')" style="font-size:12px;">Modifier</button>
            </div>
          </div>
        </div>`;
    }).join('');
  } catch (e) {
    container.innerHTML = `<div style="color:#ef4444;padding:20px;text-align:center;">${e.message || 'Erreur'}</div>`;
  }
}

function editFormationSession(id, requestType) {
  const isEmail = requestType === 'email';
  // Inline edit modal
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,.85);backdrop-filter:blur(6px);z-index:9999;display:flex;align-items:center;justify-content:center;';
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });

  overlay.innerHTML = `
    <div style="background:#ffffff;border-radius:16px;padding:32px;max-width:480px;width:90%;box-shadow:0 25px 60px rgba(0,0,0,.4);max-height:90vh;overflow-y:auto;border:1px solid #E5E7EB;">
      <h3 style="margin:0 0 20px;">${isEmail ? '📧' : '🎥'} Modifier la demande #${id}</h3>
      <div style="margin-bottom:14px;">
        <label style="font-size:13px;font-weight:600;display:block;margin-bottom:4px;">Statut</label>
        <select id="edit-formation-status" class="input" style="width:100%;">
          ${isEmail ? `
            <option value="pending">En attente</option>
            <option value="responded">Répondu</option>
            <option value="cancelled">Annulée</option>
          ` : `
            <option value="booked">Réservée</option>
            <option value="completed">Terminée</option>
            <option value="cancelled">Annulée</option>
            <option value="no_show">No-show</option>
          `}
        </select>
      </div>
      ${isEmail ? `
      <div style="margin-bottom:14px;">
        <label style="font-size:13px;font-weight:600;display:block;margin-bottom:4px;">Réponse au client <span style="color:#ef4444;">*</span></label>
        <textarea id="edit-formation-response" class="input" rows="5" placeholder="Écrivez votre réponse au problème du client..." style="width:100%;resize:vertical;"></textarea>
      </div>
      ` : `
      <div style="margin-bottom:14px;">
        <label style="font-size:13px;font-weight:600;display:block;margin-bottom:4px;">Lien visioconférence</label>
        <input type="url" id="edit-formation-link" class="input" placeholder="https://meet.google.com/..." style="width:100%;">
      </div>
      `}
      <div style="margin-bottom:20px;">
        <label style="font-size:13px;font-weight:600;display:block;margin-bottom:4px;">Notes internes</label>
        <textarea id="edit-formation-notes" class="input" rows="3" style="width:100%;resize:vertical;"></textarea>
      </div>
      <div style="display:flex;gap:10px;justify-content:flex-end;">
        <button class="btn" onclick="this.closest('div[style*=fixed]').remove()">Annuler</button>
        <button class="btn btn-primary" onclick="saveFormationSession(${id})">Enregistrer</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
}

async function saveFormationSession(id) {
  const status = document.getElementById('edit-formation-status')?.value;
  const meeting_link = document.getElementById('edit-formation-link')?.value || '';
  const notes = document.getElementById('edit-formation-notes')?.value || '';
  const admin_response = document.getElementById('edit-formation-response')?.value || '';

  try {
    const body = { status, notes };
    if (meeting_link) body.meeting_link = meeting_link;
    if (admin_response) body.admin_response = admin_response;
    await api.put(`/formations/admin/${id}`, body);
    showToast('Demande mise à jour', 'success');
    document.querySelector('div[style*="position:fixed"][style*="z-index:9999"]')?.remove();
    loadAdminFormations();
  } catch (e) {
    showToast(e.message || 'Erreur', 'error');
  }
}
