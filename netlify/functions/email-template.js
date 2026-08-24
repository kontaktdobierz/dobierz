// Wspólny szablon e-maili Domierz — używany przez wszystkie wiadomości
// transakcyjne (potwierdzenie zamówienia, płatność, gotowe materiały, feedback).
// Trzymamy go w jednym miejscu, żeby każdy mail wyglądał tak samo.

function budujMail({ naglowek, tresc, podsumowanie, ctaTekst, ctaUrl, stopka }) {
  const wierszePodsumowania = (podsumowanie || [])
    .map(
      ([etykieta, wartosc]) => `
        <tr>
          <td style="padding:8px 0; border-top:1px dashed #C9C4B4; font-family:'Courier New', monospace; font-size:12px; color:#4A554E; text-transform:uppercase; letter-spacing:0.04em; width:40%;">${etykieta}</td>
          <td style="padding:8px 0; border-top:1px dashed #C9C4B4; font-size:14px; color:#1F2A24;">${wartosc}</td>
        </tr>`
    )
    .join("");

  const blokPodsumowania = podsumowanie && podsumowanie.length
    ? `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0; border-collapse:collapse;">
        ${wierszePodsumowania}
      </table>`
    : "";

  const blokCta = ctaTekst && ctaUrl
    ? `
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0;">
        <tr>
          <td style="background:#1F2A24; padding:14px 26px;">
            <a href="${ctaUrl}" style="font-family:'Courier New', monospace; font-size:14px; color:#FBFAF6; text-decoration:none; letter-spacing:0.02em;">${ctaTekst}</a>
          </td>
        </tr>
      </table>`
    : "";

  return `
<!DOCTYPE html>
<html lang="pl">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0; padding:0; background:#F1F0EA; font-family:Arial, Helvetica, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F1F0EA; padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px; background:#FBFAF6; border:1px solid #C9C4B4;">
          <tr>
            <td style="padding:28px 32px 0;">
              <div style="font-family:Georgia, serif; font-weight:700; font-size:20px; color:#1F2A24;">
                Do<span style="color:#A8402F;">mierz</span>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 8px;">
              <h1 style="font-family:Georgia, serif; font-size:22px; color:#1F2A24; margin:0 0 14px; line-height:1.25;">${naglowek}</h1>
              <p style="font-size:15px; line-height:1.6; color:#4A554E; margin:0;">${tresc}</p>
              ${blokPodsumowania}
              ${blokCta}
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px 28px; border-top:1px solid #C9C4B4; margin-top:20px;">
              <p style="font-size:12px; color:#4A554E; margin:16px 0 0;">${stopka || "Domierz — dopasowanie CV i listu motywacyjnego pod ogłoszenie."}</p>
              <p style="font-size:12px; color:#4A554E; margin:4px 0 0;">kontakt@domierz.pl</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

module.exports = { budujMail };
