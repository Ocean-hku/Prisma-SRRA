import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { useQuizStore } from './store/useQuizStore'
import { questions, personalityTypes } from './data/questions_v2'

const initDemo = () => {
  const p = new URLSearchParams(window.location.search)
  const v = (p.get('demo') || '').trim()
  if (!v) return
  const id = /^type_\d+$/i.test(v) ? v.toLowerCase() : 'type_1'
  const demoType = personalityTypes.find(t => t.id === id) ?? personalityTypes[0]
  const coreDims = ['social', 'rational', 'rebellious', 'ambition'] as const

  const coreMaxAbs = coreDims.reduce((acc, dim) => ({ ...acc, [dim]: 0 }), {} as Record<(typeof coreDims)[number], number>)
  questions.forEach((q) => {
    coreDims.forEach((dim) => {
      let best = 0
      q.options.forEach((opt) => {
        best = Math.max(best, Math.abs(((opt.weights as any)[dim] ?? 0) as number))
      })
      coreMaxAbs[dim] += best
    })
  })
  coreDims.forEach((dim) => {
    if (!Number.isFinite(coreMaxAbs[dim]) || coreMaxAbs[dim] <= 0) coreMaxAbs[dim] = 1
  })

  const scores = {
    social: 0, rational: 0, rebellious: 0, ambition: 0,
    selfEsteem: 0, selfClarity: 0, coreValue: 0, attachmentSecurity: 0,
    emotionalInvolvement: 0, boundaryDependency: 0, worldview: 0,
    ruleFlexibility: 0, lifeMeaning: 0, motivation: 0, decisionStyle: 0,
    executionMode: 0, socialInitiative: 0, interpersonalBoundary: 0, expressionAuthenticity: 0
  } as Record<string, number>

  coreDims.forEach((dim) => {
    scores[dim] = (demoType.centroid[dim] / 8) * coreMaxAbs[dim]
  })

  useQuizStore.setState({
    answers: {},
    scores: scores as any,
    scenarioScores: {},
    isFinished: true,
  })
}

initDemo()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
