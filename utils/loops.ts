const LOOPS_API_KEY = process.env.LOOPS_API_KEY;
const LOOPS_BASE = 'https://app.loops.so/api/v1';

export async function addContactToLoops({ email, firstName, plan = 'trial' }: { email: string; firstName?: string; plan?: string }) {
  try {
    const res = await fetch(`${LOOPS_BASE}/contacts/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${LOOPS_API_KEY}` },
      body: JSON.stringify({ email, firstName: firstName || '', userGroup: 'recontent_users', plan, source: 'signup' }),
    });
    const data = await res.json();
    if (!res.ok) console.error('Loops contact create failed:', data);
  } catch (err) {
    console.error('Loops error:', err);
  }
}

export async function updateLoopsPlan(email: string, plan: string) {
  try {
    await fetch(`${LOOPS_BASE}/contacts/update`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${LOOPS_API_KEY}` },
      body: JSON.stringify({ email, plan }),
    });
  } catch (err) {
    console.error('Loops update error:', err);
  }
}