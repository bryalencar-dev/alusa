'use client';
import React from 'react';
import type { Modalidade, Sala, Professor } from '../types';

export interface LookupsValue {
  modalidades: Modalidade[];
  salas: Sala[];
  professores: Professor[];
  loading: {
    modalidades: boolean;
    salas: boolean;
    professores: boolean;
    any: boolean;
  };
  reloadModalidades: () => Promise<Modalidade[]>;
  reloadSalas: () => Promise<Sala[]>;
  reloadProfessores: () => Promise<Professor[]>;
}
export const LookupsContext = React.createContext<LookupsValue>({
  modalidades: [],
  salas: [],
  professores: [],
  loading: { modalidades: false, salas: false, professores: false, any: false },
  reloadModalidades: async () => [],
  reloadSalas: async () => [],
  reloadProfessores: async () => [],
});
export const LookupsProvider = LookupsContext.Provider;
export function useLookups() {
  return React.useContext(LookupsContext);
}
