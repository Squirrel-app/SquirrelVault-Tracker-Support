const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

const OPENAI_API_KEY = defineSecret("OPENAI_API_KEY");

// ===== LIMITS =====
const LIMITS = {
  free: 3,
  pro: 1000,
};
// ==================

function currentPeriodUTC() {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

async function getIsPro(uid) {
  const userSnap = await db.collection("users").doc(uid).get();
  return userSnap.exists && userSnap.data()?.isPro === true;
}

async function getUsageCount(uid, period) {
  const usageSnap = await db.collection("gptUsage").doc(uid).get();
  if (!usageSnap.exists) return 0;

  const data = usageSnap.data();
  if (data.period !== period) return 0;

  return data.count ?? 0;
}

/**
 * Reserve 1 usage slot atomically via transaction.
 * Returns { usedAfterReserve, limit, isPro, period }.
 * If limit reached => returns null (caller will return type: limitReached)
 */
async function reserveUsageSlot(uid, period, limit) {
  const usageRef = db.collection("gptUsage").doc(uid);

  return await db.runTransaction(async (tx) => {
    const snap = await tx.get(usageRef);

    let count = 0;
    if (snap.exists) {
      const data = snap.data();
      if (data.period === period) {
        count = data.count ?? 0;
      }
    }

    if (count >= limit) {
      return null; // limit reached
    }

    const next = count + 1;

    tx.set(
      usageRef,
      {
        period,
        count: next,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return { usedAfterReserve: next };
  });
}

/**
 * Rollback reserved usage slot (best-effort).
 * Decrements count by 1 if period matches and count > 0.
 */
async function rollbackUsageSlot(uid, period) {
  const usageRef = db.collection("gptUsage").doc(uid);

  try {
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(usageRef);
      if (!snap.exists) return;

      const data = snap.data();
      if (data.period !== period) return;

      const count = data.count ?? 0;
      if (count <= 0) return;

      tx.set(
        usageRef,
        {
          count: count - 1,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    });
  } catch (e) {
    // best-effort: don't crash function because rollback failed
    console.error("rollbackUsageSlot failed:", e);
  }
}

// ✅ Read-only usage check (NO increment) — name matches iOS: "gptPreflight"
exports.gptPreflight = onCall(
  { maxInstances: 10 },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError("unauthenticated", "Unauthenticated");

    const period = currentPeriodUTC();
    const isPro = await getIsPro(uid);
    const limit = isPro ? LIMITS.pro : LIMITS.free;
    const used = await getUsageCount(uid, period);

    return {
      type: "usage",
      usage: { isPro, used, limit, period },
    };
  }
);

// ✅ Main GPT call (reserves slot atomically; rollback if OpenAI fails)
exports.askGpt = onCall(
  {
    secrets: [OPENAI_API_KEY],
    maxInstances: 5,
  },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError("unauthenticated", "Unauthenticated");

    const messages = request.data?.messages;
    if (!Array.isArray(messages)) {
      throw new HttpsError("invalid-argument", "messages must be an array");
    }

    const period = currentPeriodUTC();

    const isPro = await getIsPro(uid);
    const limit = isPro ? LIMITS.pro : LIMITS.free;

    // 1) Reserve slot (atomic)
    const reserved = await reserveUsageSlot(uid, period, limit);

    if (!reserved) {
      const used = await getUsageCount(uid, period); // just for correct number
      return {
        type: "limitReached",
        usage: { used, limit, isPro },
      };
    }

    const usedAfterReserve = reserved.usedAfterReserve;

    // 2) Call OpenAI
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY.value()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages,
          temperature: 0.2,
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`OpenAI error ${response.status}: ${text}`);
      }

      const json = await response.json();
      const content = json?.choices?.[0]?.message?.content ?? "";

      return {
        type: "autofill",
        content,
        usage: {
          used: usedAfterReserve,
          limit,
          isPro,
        },
      };
    } catch (err) {
      // 3) Rollback reserved slot (best-effort)
      await rollbackUsageSlot(uid, period);
      throw new HttpsError("internal", err?.message ?? "OpenAI call failed");
    }
  }
);
