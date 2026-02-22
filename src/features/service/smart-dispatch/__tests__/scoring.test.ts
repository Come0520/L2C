import { describe, it, expect } from 'vitest';
import { calculateWorkerScore } from '../scoring';

describe('Smart Dispatch - calculateWorkerScore', () => {
    it('should calculate score correctly when no location is provided', () => {
        const worker = { id: 'w1', skills: ['CURTAIN'] };
        const task = { category: 'CURTAIN' };

        const score = calculateWorkerScore(worker, task);
        expect(score).toBe(55); // 50 (base) + 5 (no location)
    });

    it('should calculate score correctly for distance <= 5km', () => {
        const worker = { id: 'w1', skills: ['CURTAIN'], addressGeo: { lat: 30.0, lng: 120.0 } };
        const task = { category: 'CURTAIN', location: { lat: 30.01, lng: 120.0 } };

        const score = calculateWorkerScore(worker, task);
        expect(score).toBe(80); // 50 (base) + 30
    });

    it('should calculate score correctly for 5km < distance <= 10km', () => {
        const worker = { id: 'w1', skills: ['CURTAIN'], addressGeo: { lat: 30.0, lng: 120.0 } };
        const task = { category: 'CURTAIN', location: { lat: 30.07, lng: 120.0 } };

        const score = calculateWorkerScore(worker, task);
        expect(score).toBe(70); // 50 (base) + 20
    });

    it('should calculate score correctly for 10km < distance <= 20km', () => {
        const worker = { id: 'w1', skills: ['CURTAIN'], addressGeo: { lat: 30.0, lng: 120.0 } };
        const task = { category: 'CURTAIN', location: { lat: 30.15, lng: 120.0 } };

        const score = calculateWorkerScore(worker, task);
        expect(score).toBe(60); // 50 (base) + 10
    });

    it('should calculate score correctly for 20km < distance <= 50km', () => {
        const worker = { id: 'w1', skills: ['CURTAIN'], addressGeo: { lat: 30.0, lng: 120.0 } };
        const task = { category: 'CURTAIN', location: { lat: 30.3, lng: 120.0 } };

        const score = calculateWorkerScore(worker, task);
        expect(score).toBe(55); // 50 (base) + 5 
    });

    it('should calculate score correctly for distance > 50km', () => {
        const worker = { id: 'w1', skills: ['CURTAIN'], addressGeo: { lat: 30.0, lng: 120.0 } };
        const task = { category: 'CURTAIN', location: { lat: 31.0, lng: 120.0 } };

        const score = calculateWorkerScore(worker, task);
        expect(score).toBe(50); // 50 (base) + 0 
    });
});
