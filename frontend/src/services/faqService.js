import api from './api'
import { sampleFaqs } from './faqMock'
import { createId, sleep } from '../utils/helpers'

/**
 * FAQ knowledge-base service — the single boundary between the FAQ
 * Management screen and FAQ data.
 *
 * Mock mode keeps an in-memory store so add / edit / delete actually
 * change what the table renders. Flip USE_MOCK to false when the Flask
 * backend exposes /faqs: every function already has the corresponding
 * axios call written and ready.
 */
const USE_MOCK = false

/** Module-level store — mutations survive re-renders in mock mode. */
let store = null

function loadStore() {
  if (!store) store = structuredClone(sampleFaqs)
  return store
}

/**
 * In-flight GET /faqs promise — concurrent callers (e.g. React
 * StrictMode's double mount) share one network request instead of
 * firing duplicates, and the slot is freed once the request settles.
 */
let faqsRequest = null

/** GET /faqs — list every knowledge-base entry. */
export async function getFaqs() {
  if (USE_MOCK) {
    await sleep(250)
    return structuredClone(loadStore())
  }
  if (!faqsRequest) {
    faqsRequest = api
      .get('/faqs')
      .then(({ data }) => data)
      .finally(() => {
        faqsRequest = null
      })
  }
  return faqsRequest
}

/** POST /faqs — create an entry. @param {{question: string, answer: string, category: string, status: string}} input */
export async function createFaq(input) {
  if (USE_MOCK) {
    await sleep(300)
    const entry = { id: createId(), ...input, updatedAt: new Date().toISOString().slice(0, 10) }
    loadStore().unshift(entry)
    return structuredClone(entry)
  }
  const { data } = await api.post('/faqs', input)
  return data
}

/** PUT /faqs/:id — update an existing entry. */
export async function updateFaq(id, input) {
  if (USE_MOCK) {
    await sleep(300)
    const rows = loadStore()
    const index = rows.findIndex((row) => row.id === id)
    if (index === -1) throw new Error('This FAQ entry no longer exists.')
    rows[index] = { ...rows[index], ...input, updatedAt: new Date().toISOString().slice(0, 10) }
    return structuredClone(rows[index])
  }
  const { data } = await api.put(`/faqs/${id}`, input)
  return data
}

/** DELETE /faqs/:id */
export async function deleteFaq(id) {
  if (USE_MOCK) {
    await sleep(300)
    const rows = loadStore()
    store = rows.filter((row) => row.id !== id)
    return { id }
  }
  const { data } = await api.delete(`/faqs/${id}`)
  return data
}
