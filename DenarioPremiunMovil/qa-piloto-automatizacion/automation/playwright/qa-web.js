'use strict';
// qa-web.js — helper: conecta a la sesión web persistente abierta por qa-web-open.js
const { chromium } = require('playwright');
const path = require('path');

const BASE = 'http://denariocaribe.ddns.net:8080/DenarioPremium';
const IMG = path.resolve(__dirname, '..', 'reports', '4k', 'req_crud_bancos_20260904', 'img');

async function web() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9333');
  const ctx = b.contexts()[0];
  const pg = ctx.pages().find(p => p.url().includes('Denario')) || ctx.pages()[0];
  await pg.bringToFront();
  return pg;
}
const shot = (pg, name, opts = {}) => pg.screenshot({ path: path.join(IMG, name), ...opts });
const sleep = ms => new Promise(r => setTimeout(r, ms));

module.exports = { web, shot, sleep, BASE, IMG };
