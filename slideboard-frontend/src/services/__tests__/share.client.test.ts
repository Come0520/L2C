import { describe, it, expect, beforeEach, vi, Mock } from 'vitest'

import { shareService } from '@/services/share.client'

describe('shareService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // 重置 fetch mock
    global.fetch = vi.fn()
  })

  describe('generateToken', () => {
    it('should generate a token successfully for quote resource', async () => {
      // Arrange
      const mockToken = {
        id: 'token1',
        resource_type: 'quote',
        resource_id: 'quote1',
        token: 'abc123',
        expires_at: null,
        is_active: true,
        created_at: '2023-01-01T00:00:00Z'
      }
      
      ;(global.fetch as Mock).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ token: mockToken })
      })

      // Act
      const result = await shareService.generateToken('quote', 'quote1', 7)

      // Assert
      expect(global.fetch).toHaveBeenCalledWith('/api/sharing/tokens', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ resourceType: 'quote', resourceId: 'quote1', expiresInDays: 7 })
      })
      
      expect(result).toEqual({
        id: 'token1',
        resourceType: 'quote',
        resourceId: 'quote1',
        token: 'abc123',
        expiresAt: null,
        isActive: true,
        createdAt: '2023-01-01T00:00:00Z'
      })
    })

    it('should generate a token successfully for order resource', async () => {
      // Arrange
      const mockToken = {
        id: 'token2',
        resource_type: 'order',
        resource_id: 'order1',
        token: 'def456',
        expires_at: '2023-01-08T00:00:00Z',
        is_active: true,
        created_at: '2023-01-01T00:00:00Z'
      }
      
      ;(global.fetch as Mock).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ token: mockToken })
      })

      // Act
      const result = await shareService.generateToken('order', 'order1')

      // Assert
      expect(global.fetch).toHaveBeenCalledWith('/api/sharing/tokens', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ resourceType: 'order', resourceId: 'order1', expiresInDays: 7 })
      })
      
      expect(result).toEqual({
        id: 'token2',
        resourceType: 'order',
        resourceId: 'order1',
        token: 'def456',
        expiresAt: '2023-01-08T00:00:00Z',
        isActive: true,
        createdAt: '2023-01-01T00:00:00Z'
      })
    })

    it('should throw error when generate token fails', async () => {
      // Arrange
      ;(global.fetch as Mock).mockResolvedValue({
        ok: false
      })

      // Act & Assert
      await expect(shareService.generateToken('quote', 'quote1')).rejects.toThrow('Failed to generate token')
    })
  })

  describe('getActiveToken', () => {
    it('should return active token when exists', async () => {
      // Arrange
      const mockToken = {
        id: 'token3',
        resource_type: 'quote',
        resource_id: 'quote1',
        token: 'ghi789',
        expires_at: null,
        is_active: true,
        created_at: '2023-01-01T00:00:00Z'
      }
      
      ;(global.fetch as Mock).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ token: mockToken })
      })

      // Act
      const result = await shareService.getActiveToken('quote', 'quote1')

      // Assert
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/sharing/tokens?resourceType=quote&resourceId=quote1'), {
        method: 'GET'
      })
      
      expect(result).toEqual({
        id: 'token3',
        resourceType: 'quote',
        resourceId: 'quote1',
        token: 'ghi789',
        expiresAt: null,
        isActive: true,
        createdAt: '2023-01-01T00:00:00Z'
      })
    })

    it('should return null when no active token exists', async () => {
      // Arrange
      ;(global.fetch as Mock).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ token: null })
      })

      // Act
      const result = await shareService.getActiveToken('order', 'order1')

      // Assert
      expect(global.fetch).toHaveBeenCalled()
      expect(result).toBeNull()
    })

    it('should throw error when get active token fails', async () => {
      // Arrange
      ;(global.fetch as Mock).mockResolvedValue({
        ok: false
      })

      // Act & Assert
      await expect(shareService.getActiveToken('quote', 'quote1')).rejects.toThrow('Failed to get active token')
    })
  })

  describe('validateToken', () => {
    it('should validate token successfully', async () => {
      // Arrange
      const mockValidationResult = {
        resourceType: 'quote',
        resource: { id: 'quote1', name: 'Test Quote' }
      }
      
      ;(global.fetch as Mock).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockValidationResult)
      })

      // Act
      const result = await shareService.validateToken('abc123')

      // Assert
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/sharing/validate?token=abc123'), {
        method: 'GET'
      })
      
      expect(result).toEqual(mockValidationResult)
    })

    it('should throw error when token is invalid', async () => {
      // Arrange
      ;(global.fetch as Mock).mockResolvedValue({
        ok: false
      })

      // Act & Assert
      await expect(shareService.validateToken('invalid-token')).rejects.toThrow('Invalid or expired token')
    })
  })

  describe('revokeToken', () => {
    it('should revoke token successfully', async () => {
      // Arrange
      ;(global.fetch as Mock).mockResolvedValue({
        ok: true
      })

      // Act
      await shareService.revokeToken('token1')

      // Assert
      expect(global.fetch).toHaveBeenCalledWith('/api/sharing/tokens/token1', {
        method: 'DELETE'
      })
    })

    it('should throw error when revoke token fails', async () => {
      // Arrange
      ;(global.fetch as Mock).mockResolvedValue({
        ok: false
      })

      // Act & Assert
      await expect(shareService.revokeToken('token1')).rejects.toThrow('Failed to revoke token')
    })
  })
})