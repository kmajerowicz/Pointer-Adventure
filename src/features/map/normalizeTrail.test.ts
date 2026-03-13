import { describe, it, expect } from 'vitest'
import {
  extractTrailColor,
  isPTTK,
  normalizeSurface,
  normalizeDifficulty,
  normalizeElement,
  bboxHash,
  buildOverpassQuery,
  type OverpassElement,
} from './normalizeTrail'

describe('extractTrailColor', () => {
  it('returns blue for osmc:symbol blue:white:blue_bar', () => {
    expect(extractTrailColor({ 'osmc:symbol': 'blue:white:blue_bar' })).toBe('blue')
  })

  it('returns red for colour tag red', () => {
    expect(extractTrailColor({ colour: 'red' })).toBe('red')
  })

  it('returns null for unrecognized color', () => {
    expect(extractTrailColor({ 'osmc:symbol': 'purple:white:bar' })).toBeNull()
  })
})

describe('isPTTK', () => {
  it('returns true when operator contains pttk (case insensitive)', () => {
    expect(isPTTK({ operator: 'PTTK Oddział Kraków' })).toBe(true)
  })

  it('returns true when network is rwn', () => {
    expect(isPTTK({ network: 'rwn' })).toBe(true)
  })

  it('returns true when network is lwn', () => {
    expect(isPTTK({ network: 'lwn' })).toBe(true)
  })

  it('returns true when network is nwn', () => {
    expect(isPTTK({ network: 'nwn' })).toBe(true)
  })

  it('returns false for generic OSM way', () => {
    expect(isPTTK({ highway: 'footway' })).toBe(false)
  })
})

describe('normalizeSurface', () => {
  it('maps ground to dirt', () => {
    expect(normalizeSurface('ground')).toBe('dirt')
  })

  it('maps gravel to gravel', () => {
    expect(normalizeSurface('gravel')).toBe('gravel')
  })

  it('maps asphalt to asphalt', () => {
    expect(normalizeSurface('asphalt')).toBe('asphalt')
  })

  it('maps compacted to mixed', () => {
    expect(normalizeSurface('compacted')).toBe('mixed')
  })

  it('maps undefined to unknown', () => {
    expect(normalizeSurface(undefined)).toBe('unknown')
  })
})

describe('normalizeDifficulty', () => {
  it('maps hiking to easy', () => {
    expect(normalizeDifficulty('hiking')).toBe('easy')
  })

  it('maps mountain_hiking to moderate', () => {
    expect(normalizeDifficulty('mountain_hiking')).toBe('moderate')
  })

  it('maps demanding_mountain_hiking to hard', () => {
    expect(normalizeDifficulty('demanding_mountain_hiking')).toBe('hard')
  })

  it('maps undefined to unknown', () => {
    expect(normalizeDifficulty(undefined)).toBe('unknown')
  })
})

describe('normalizeElement', () => {
  it('converts an Overpass way element with geometry to Partial Route with LineString', () => {
    const el: OverpassElement = {
      type: 'way',
      id: 12345,
      tags: { name: 'Test Trail', highway: 'path' },
      geometry: [
        { lat: 50.0, lon: 19.0 },
        { lat: 50.1, lon: 19.1 },
      ],
    }
    const result = normalizeElement(el)
    expect(result).not.toBeNull()
    expect(result!.geometry).toMatchObject({ type: 'LineString' })
    expect(result!.center_lat).toBeCloseTo(50.05)
    expect(result!.center_lon).toBeCloseTo(19.05)
    expect(result!.source_id).toBe('osm:way:12345')
  })

  it('converts an Overpass relation with members to MultiLineString geometry', () => {
    const el: OverpassElement = {
      type: 'relation',
      id: 99,
      tags: { name: 'Route Rel', type: 'route', network: 'rwn' },
      members: [
        {
          type: 'way',
          ref: 1,
          role: '',
          geometry: [
            { lat: 50.0, lon: 19.0 },
            { lat: 50.1, lon: 19.1 },
          ],
        },
        {
          type: 'way',
          ref: 2,
          role: '',
          geometry: [
            { lat: 50.1, lon: 19.1 },
            { lat: 50.2, lon: 19.2 },
          ],
        },
      ],
    }
    const result = normalizeElement(el)
    expect(result).not.toBeNull()
    expect(result!.geometry).toMatchObject({ type: 'MultiLineString' })
  })

  it('returns null when element has no geometry', () => {
    const el: OverpassElement = {
      type: 'way',
      id: 1,
      tags: {},
    }
    expect(normalizeElement(el)).toBeNull()
  })

  it('sets source=pttk and trail_color for PTTK relation', () => {
    const el: OverpassElement = {
      type: 'relation',
      id: 200,
      tags: {
        name: 'Szlak PTTK',
        network: 'rwn',
        'osmc:symbol': 'red:white:red_bar',
      },
      members: [
        {
          type: 'way',
          ref: 10,
          role: '',
          geometry: [
            { lat: 50.0, lon: 19.0 },
            { lat: 50.1, lon: 19.1 },
          ],
        },
      ],
    }
    const result = normalizeElement(el)
    expect(result).not.toBeNull()
    expect(result!.source).toBe('pttk')
    expect(result!.trail_color).toBe('red')
  })

  it('sets source=osm and trail_color=null for generic footway', () => {
    const el: OverpassElement = {
      type: 'way',
      id: 300,
      tags: { highway: 'footway' },
      geometry: [
        { lat: 49.0, lon: 18.0 },
        { lat: 49.1, lon: 18.1 },
      ],
    }
    const result = normalizeElement(el)
    expect(result).not.toBeNull()
    expect(result!.source).toBe('osm')
    expect(result!.trail_color).toBeNull()
  })
})

describe('bboxHash', () => {
  it('rounds to 2 decimal places and produces south,west,north,east string', () => {
    expect(bboxHash(50.123, 49.456, 19.789, 18.012)).toBe('49.46,18.01,50.12,19.79')
  })
})

describe('buildOverpassQuery', () => {
  it('produces correct Overpass QL with bbox in south,west,north,east order and [timeout:25]', () => {
    const query = buildOverpassQuery({ north: 50.1, south: 49.9, east: 19.1, west: 18.9 })
    expect(query).toContain('[out:json][timeout:25]')
    expect(query).toContain('49.9,18.9,50.1,19.1')
  })

  it('query contains dogs!=no filter and highway exclusions', () => {
    const query = buildOverpassQuery({ north: 50.1, south: 49.9, east: 19.1, west: 18.9 })
    expect(query).toContain('dogs!=no')
    expect(query).toMatch(/highway!=.*primary|primary.*highway!=/)
    expect(query).toContain('out geom;')
  })
})
