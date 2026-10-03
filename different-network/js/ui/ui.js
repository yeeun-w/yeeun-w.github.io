/** DOM 텍스트 UI (방 이름, 토스트, 표지판, 대사, 화면 전환) */
G.UI = class {
  constructor() {
    const $ = (id) => document.getElementById(id);
    this.el = { room: $('room-name'), sign: $('sign'), toast: $('toast'), dialog: $('dialog'), hint: $('hint') };
    this.screens = { title: $('screen-title'), pause: $('screen-pause'), ending: $('screen-ending') };
    this.timers = { room: 0, toast: 0, dialog: 0 };
    this.currentSign = null;
  }

  _show(el, on) { el.classList.toggle('show', on); }

  showRoomName(name, sub) {
    const el = this.el.room;
    el.textContent = '';
    const b = document.createElement('b'); b.textContent = name; el.appendChild(b);
    if (sub) { const s = document.createElement('small'); s.textContent = sub; el.appendChild(s); }
    this._show(el, true);
    this.timers.room = 2.4;
  }

  setSign(text) {
    if (text === this.currentSign) return;
    this.currentSign = text;
    if (text) this.el.sign.textContent = text;
    this._show(this.el.sign, !!text);
  }

  toast(text, t = 2) { this.el.toast.textContent = text; this._show(this.el.toast, true); this.timers.toast = t; }

  dialog(speaker, text, color = '#ffffff', t = 5) {
    const d = this.el.dialog;
    d.querySelector('.speaker').textContent = speaker;
    d.querySelector('.speaker').style.color = color;
    d.querySelector('.text').textContent = text;
    d.style.borderColor = color;
    this._show(d, true);
    this.timers.dialog = t;
  }

  setHint(text) { this.el.hint.textContent = text; }

  clearTransient() {
    for (const k of ['room', 'toast', 'dialog']) { this.timers[k] = 0; this._show(this.el[k], false); }
    this.setSign(null);
  }

  update(dt) {
    for (const k of ['room', 'toast', 'dialog']) {
      if (this.timers[k] > 0) { this.timers[k] -= dt; if (this.timers[k] <= 0) this._show(this.el[k], false); }
    }
  }

  showScreen(name, html) {
    this.hideScreens();
    const s = this.screens[name];
    if (html != null) s.querySelector('.content').innerHTML = html;
    s.classList.remove('hidden');
  }
  hideScreens() { Object.values(this.screens).forEach((s) => s.classList.add('hidden')); }
};
