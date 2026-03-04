import { KHQR, TAG, CURRENCY } from "ts-khqr";

const payloadRaw = process.argv[2];

if (!payloadRaw) {
  console.error("Missing payload argument");
  process.exit(1);
}

let payload;
try {
  payload = JSON.parse(payloadRaw);
} catch (error) {
  console.error("Invalid JSON payload", error);
  process.exit(1);
}

const result = KHQR.generate({
  tag: TAG.INDIVIDUAL,
  accountID: payload.accountID,
  merchantName: payload.merchantName,
  merchantCity: payload.merchantCity || "Phnom Penh",
  currency: payload.currency === "USD" ? CURRENCY.USD : CURRENCY.KHR,
  amount: Number(payload.amount),
  billNumber: payload.billNumber,
  storeLabel: payload.storeLabel || "FitandSleek",
  terminalLabel: payload.terminalLabel || "FitandSleekWeb",
  phoneNumber: payload.phoneNumber || "",
  expirationTimestamp: payload.expirationTimestamp,
});

if (result?.status?.code !== 0 || !result?.data?.qr || !result?.data?.md5) {
  const message = result?.status?.message || "KHQR generation returned empty result";
  console.error(message);
  process.exit(1);
}

console.log(
  JSON.stringify({
    qr: result.data.qr,
    md5: result.data.md5,
  })
);
