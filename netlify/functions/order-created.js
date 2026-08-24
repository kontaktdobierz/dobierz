// netlify/functions/order-created.js
//
// Ta funkcja jest wywoływana przez Netlify za każdym razem, gdy ktoś wyśle
// formularz zamówienia na stronie. Podłączenie: Site settings → Forms →
// Form notifications → Add notification → Outgoing webhook →
// Event to listen for: "New form submission" → URL:
//   https://TWOJA-STRONA.netlify.app/.netlify/functions/order-created
//
// Co robi:
//   1. zapisuje całe zamówienie w Netlify Blobs (wbudowana baza klucz-wartość),
//   2. wysyła klientowi mail "Otrzymaliśmy Twoje zamówienie" (Resend),
//   3. wysyła Tobie (WLASCICIEL_EMAIL) powiadomienie o nowym zamówieniu.
//
// Wymagane zmienne środowiskowe (Site settings → Environment variables):
//   BREVO_API_KEY    — klucz API z brevo.com (Settings → SMTP & API → API Keys)
//   WLASCICIEL_EMAIL — adres, na który mają przychodzić powiadomienia o zamówieniach
//   MAIL_NADAWCA     — Twój zweryfikowany w Brevo adres nadawcy, np. kontakt@domierz.pl

const { getStore } = require("@netlify/blobs");
const { budujMail } = require("./email-template");

const PAKIETY = {
  "mam-cv": { nazwa: "Mam CV", cena: "29 zł" },
  "cv-od-zera": { nazwa: "CV od zera", cena: "49 zł" },
  "aplikuje-szeroko": { nazwa: "Aplikuję szeroko (3 ogłoszenia)", cena: "79 zł" },
};

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch (err) {
    return { statusCode: 400, body: "Nieprawidłowy payload" };
  }

  // Netlify owija dane w dodatkową warstwę: { payload: { data: {...} } }.
  // Ten kod działa niezależnie od tego, czy warstwa "payload" jest, czy nie.
  const payload = body.payload || body;
  const dane = payload.data || {};

  console.log("Odebrane pola formularza:", JSON.stringify(dane));

  const pakietKlucz = dane["pakiet"];
  const pakiet = PAKIETY[pakietKlucz] || { nazwa: "Nieznany pakiet", cena: "-" };

  const id = "ord_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);

  const zamowienie = {
    id,
    status: "nowe", // nowe -> oplacone -> gotowe
    utworzono: new Date().toISOString(),
    pakietKlucz,
    pakietNazwa: pakiet.nazwa,
    pakietCena: pakiet.cena,
    imie: dane["imie i nazwisko"] || "",
    email: dane["email"] || "",
    telefon: dane["telefon"] || "",
    ogloszenie1: dane["link do ogloszenia"] || dane["link do ogloszenia 1"] || "",
    ogloszenie2: dane["link do ogloszenia 2"] || "",
    ogloszenie3: dane["link do ogloszenia 3"] || "",
    szkola: dane["szkola-kierunek"] || "",
    rokNauki: dane["rok-nauki-ukonczenia"] || "",
    doswiadczenie: dane["doswiadczenie-zawodowe"] || "",
    umiejetnosci: dane["umiejetnosci-mocne-strony"] || "",
    uwagi: dane["uwagi"] || "",
  };

  // 1. Zapis zamówienia
  try {
    const store = getStore("zamowienia");
    await store.setJSON(id, zamowienie);
  } catch (err) {
    console.error("Błąd zapisu do Blobs:", err);
  }

  // 2. Mail do klienta
  if (zamowienie.email) {
    await wyslijMail({
      do: zamowienie.email,
      temat: "Otrzymaliśmy Twoje zamówienie — Domierz",
      html: budujMail({
        naglowek: "Otrzymaliśmy Twoje zamówienie",
        tresc: `Cześć${zamowienie.imie ? " " + zamowienie.imie : ""}! Dziękujemy za zamówienie w Domierz. Sprawdzamy zgłoszenie i wkrótce wyślemy Ci maila z danymi do płatności.`,
        podsumowanie: [
          ["Pakiet", `${zamowienie.pakietNazwa} — ${zamowienie.pakietCena}`],
          ["Numer zamówienia", zamowienie.id],
        ],
        stopka: "Masz pytania? Po prostu odpisz na tego maila.",
      }),
    });
  } else {
    console.warn("Brak adresu e-mail klienta w zgłoszeniu — mail nie został wysłany.", zamowienie.id);
  }

  // 3. Powiadomienie dla właściciela
  if (process.env.WLASCICIEL_EMAIL) {
    await wyslijMail({
      do: process.env.WLASCICIEL_EMAIL,
      temat: `Nowe zamówienie: ${zamowienie.pakietNazwa} — ${zamowienie.imie}`,
      html: `<pre style="font-family:monospace; font-size:13px;">${JSON.stringify(zamowienie, null, 2)}</pre>`,
    });
  }

  return { statusCode: 200, body: "OK" };
};

async function wyslijMail({ do: odbiorca, temat, html }) {
  if (!odbiorca || !process.env.BREVO_API_KEY) {
    console.warn("Brak odbiorcy lub BREVO_API_KEY — pomijam wysyłkę.");
    return;
  }
  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": process.env.BREVO_API_KEY,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        sender: {
          name: "Domierz",
          email: process.env.MAIL_NADAWCA || "kontakt@domierz.pl",
        },
        to: [{ email: odbiorca }],
        subject: temat,
        htmlContent: html,
      }),
    });
    if (!res.ok) {
      console.error("Brevo error:", res.status, await res.text());
    }
  } catch (err) {
    console.error("Błąd wysyłki maila:", err);
  }
}
