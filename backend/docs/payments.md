# Payments Integration (Credits Top-up)

This backend now supports a unified checkout flow for credits top-up:

- `POST /api/v1/payments/checkout`
- `GET /api/v1/payments/return/:provider`
- `POST /api/v1/payments/ipn/:provider`
- `GET /api/v1/payments/status/:orderCode`

## Current status

- `VNPAY`: implemented (signed checkout URL + signature verification for return/IPN).
- `MoMo`: implemented (create order API + return/IPN signature verification).
- `ZaloPay`: implemented (create order API + callback MAC verification + query status fallback).

## Required env vars

Use `.env.example` values:

- `PAYMENT_DEFAULT_PROVIDER`
- `PAYMENT_RETURN_PATH`
- `VNPAY_TMN_CODE`
- `VNPAY_HASH_SECRET`
- `VNPAY_PAY_URL`
- `MOMO_PARTNER_CODE`
- `MOMO_ACCESS_KEY`
- `MOMO_SECRET_KEY`
- `MOMO_ENDPOINT`
- `MOMO_REQUEST_TYPE`
- `MOMO_LANG`
- `ZALOPAY_APP_ID`
- `ZALOPAY_KEY1`
- `ZALOPAY_KEY2`
- `ZALOPAY_ENDPOINT`

## Web flow

1. Frontend calls `POST /payments/checkout`.
2. Backend creates `payment_order` (`pending`) and returns `paymentUrl`.
3. Frontend redirects user to `paymentUrl`.
4. Gateway calls return/IPN endpoint.
5. Backend verifies signature and marks order:
   - `paid` -> add credits transaction automatically.
   - `failed` -> no credit added.

## Provider callback formats

- `VNPAY` IPN: query-string callback, backend responds `{ RspCode, Message }`.
- `MoMo` IPN: JSON body callback, backend responds `{ resultCode, message }`.
- `ZaloPay` callback: JSON body (`data`, `mac`), backend responds `{ return_code, return_message }`.

## Mobile flow

Use the same backend API from Flutter/React Native:

1. Request checkout from app (or your backend facade).
2. Open `paymentUrl` via `WebView` (VNPAY) or deep-link/app switch (MoMo/ZaloPay).
3. Poll `GET /payments/status/:orderCode` to update UI status in-app.
