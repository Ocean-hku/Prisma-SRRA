import { create } from 'zustand';
import { questions } from '../data/questions_v2';
import { Dimension, CoreDimension, ExtDimension } from '../types';

interface AnswerRecord {
  optionId: string;
  weights: Partial<Record<Dimension, number>>;
  scenario: string;
}

interface QuizState {
  answers: Record<number, AnswerRecord>;
  scores: Record<Dimension, number>;
  scenarioScores: Record<string, number>;
  isFinished: boolean;
  answerQuestion: (questionId: number, optionId: string, weights: Partial<Record<Dimension, number>>, scenario: string) => void;
  resetQuiz: () => void;
}

const initialScores: Record<Dimension, number> = {
  social: 0, rational: 0, rebellious: 0, ambition: 0,
  selfEsteem: 0, selfClarity: 0, coreValue: 0, attachmentSecurity: 0,
  emotionalInvolvement: 0, boundaryDependency: 0, worldview: 0,
  ruleFlexibility: 0, lifeMeaning: 0, motivation: 0, decisionStyle: 0,
  executionMode: 0, socialInitiative: 0, interpersonalBoundary: 0, expressionAuthenticity: 0
};

export const useQuizStore = create<QuizState>((set) => ({
  answers: {},
  scores: { ...initialScores },
  scenarioScores: {},
  isFinished: false,

  answerQuestion: (questionId, optionId, weights, scenario) =>
    set((state) => {
      const newAnswers = { ...state.answers, [questionId]: { optionId, weights, scenario } };
      
      // Recalculate scores from all answers
      const newScores = { ...initialScores };
      const newScenarioScores: Record<string, number> = {};

      Object.values(newAnswers).forEach(ans => {
        (Object.keys(ans.weights) as Dimension[]).forEach(dim => {
          newScores[dim] += ans.weights[dim] || 0;
        });
        // We can track a combined magnitude or specific score per scenario
        // Let's just track how many questions answered in this scenario to see if we need it,
        // or we can sum the core dimensions per scenario. Let's sum absolute core weights per scenario
        const coreSum = ['social', 'rational', 'rebellious', 'ambition'].reduce((sum, dim) => 
          sum + ((ans.weights as any)[dim] || 0), 0);
        newScenarioScores[ans.scenario] = (newScenarioScores[ans.scenario] || 0) + coreSum;
      });

      const isFinished = Object.keys(newAnswers).length >= questions.length;

      return {
        answers: newAnswers,
        scores: newScores,
        scenarioScores: newScenarioScores,
        isFinished,
      };
    }),

  resetQuiz: () =>
    set({
      answers: {},
      scores: { ...initialScores },
      scenarioScores: {},
      isFinished: false,
    }),
}));
