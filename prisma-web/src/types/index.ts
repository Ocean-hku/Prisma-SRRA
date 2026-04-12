export type CoreDimension = 'social' | 'rational' | 'rebellious' | 'ambition';

export type ExtDimension = 
  | 'selfEsteem' | 'selfClarity' | 'coreValue' 
  | 'attachmentSecurity' | 'emotionalInvolvement' | 'boundaryDependency' 
  | 'worldview' | 'ruleFlexibility' | 'lifeMeaning' 
  | 'motivation' | 'decisionStyle' | 'executionMode' 
  | 'socialInitiative' | 'interpersonalBoundary' | 'expressionAuthenticity';

export type Dimension = CoreDimension | ExtDimension;

export interface Option {
  id: string;
  text: string;
  weights: Partial<Record<Dimension, number>>;
}

export interface Question {
  id: number;
  scenario: string;
  level?: string; 
  text: string;
  options: Option[];
}

export interface PersonalityType {
  id: string;
  name: string; 
  friendlyName?: string;
  imageUrl?: string; 
  centroid: Record<CoreDimension, number>; 
  color: string;
  description: string;
  crashScene: string;
  secretCare: string;
  defenseMech: string;
  romanceBlock: string;
  socialPersona: string;
  complementary: string;
  landmine: string;
  teamComm: string;
  feelUnderstood: string;
  healthyBoundary: string;
  worldline: string;
  microExperiment: string;
  normalState: string;
  stressedState: string;
  innerLandscape: string;
}
