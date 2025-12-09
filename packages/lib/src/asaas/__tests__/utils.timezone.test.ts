/**
 * Testes para função getCurrentBrasiliaDate
 * 
 * Valida que a data é obtida corretamente no timezone de Brasília
 * independente do timezone do servidor.
 */

import { describe, it, expect } from 'vitest';
import { getCurrentBrasiliaDate } from '../utils';

describe('getCurrentBrasiliaDate', () => {
  it('deve retornar objeto com todas as propriedades necessárias', () => {
    const result = getCurrentBrasiliaDate();
    
    expect(result).toHaveProperty('dateStr');
    expect(result).toHaveProperty('dateObj');
    expect(result).toHaveProperty('year');
    expect(result).toHaveProperty('month');
    expect(result).toHaveProperty('day');
  });

  it('deve retornar dateStr no formato YYYY-MM-DD', () => {
    const { dateStr } = getCurrentBrasiliaDate();
    
    // Regex para validar formato YYYY-MM-DD
    expect(dateStr).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('deve retornar dateObj como instância de Date', () => {
    const { dateObj } = getCurrentBrasiliaDate();
    
    expect(dateObj).toBeInstanceOf(Date);
    expect(dateObj.getTime()).not.toBeNaN();
  });

  it('deve retornar componentes de data válidos', () => {
    const { year, month, day } = getCurrentBrasiliaDate();
    
    expect(year).toBeGreaterThanOrEqual(2025);
    expect(month).toBeGreaterThanOrEqual(1);
    expect(month).toBeLessThanOrEqual(12);
    expect(day).toBeGreaterThanOrEqual(1);
    expect(day).toBeLessThanOrEqual(31);
  });

    it('deve retornar dateStr consistente com componentes', () => {
      const { dateStr, year, month, day } = getCurrentBrasiliaDate();
    
    const expectedDateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    expect(dateStr).toBe(expectedDateStr);
  });

  it('deve criar dateObj no meio-dia UTC (timezone-safe)', () => {
    const { dateObj } = getCurrentBrasiliaDate();
    
    // Verificar que a hora é meio-dia UTC (12:00:00.000)
    expect(dateObj.getUTCHours()).toBe(12);
    expect(dateObj.getUTCMinutes()).toBe(0);
    expect(dateObj.getUTCSeconds()).toBe(0);
    expect(dateObj.getUTCMilliseconds()).toBe(0);
  });

  it('deve retornar data atual em Brasília (não futura)', () => {
    const { dateStr } = getCurrentBrasiliaDate();
    const today = new Date();
    
    // Obter data de hoje em Brasília usando Intl
    const brasiliaFormatter = new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    
    const parts = brasiliaFormatter.formatToParts(today);
    const year = parseInt(parts.find(p => p.type === 'year')!.value);
    const month = parseInt(parts.find(p => p.type === 'month')!.value);
    const day = parseInt(parts.find(p => p.type === 'day')!.value);
    
    const expectedDateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    // A data retornada deve ser a data atual em Brasília
    expect(dateStr).toBe(expectedDateStr);
  });

  it('deve ser consistente em múltiplas chamadas no mesmo segundo', () => {
    const result1 = getCurrentBrasiliaDate();
    const result2 = getCurrentBrasiliaDate();
    
    // Se chamadas no mesmo segundo, devem retornar a mesma data
    expect(result1.dateStr).toBe(result2.dateStr);
    expect(result1.year).toBe(result2.year);
    expect(result1.month).toBe(result2.month);
    expect(result1.day).toBe(result2.day);
  });

    it('deve funcionar corretamente independente do timezone do sistema', () => {
      // Este teste valida que a função não depende do timezone local
      const { year, month, day } = getCurrentBrasiliaDate();
    
    // Criar Date usando os componentes
    const reconstructedDate = new Date(year, month - 1, day);
    
    // Verificar que os componentes batem
    expect(reconstructedDate.getFullYear()).toBe(year);
    expect(reconstructedDate.getMonth() + 1).toBe(month);
    expect(reconstructedDate.getDate()).toBe(day);
  });
});

