import { parseQuery } from '../utils/queryParser';

describe('SQL Editor Query Parser', () => {
  it('should parse a simple SELECT query', () => {
    const query = 'SELECT * FROM creatures';
    const result = parseQuery(query);
    
    expect(result.operation).toBe('SELECT');
    expect(result.tableName).toBe('creatures');
    expect(result.columns).toEqual(['*']);
    expect(result.where).toBeUndefined();
    expect(result.limit).toBeUndefined();
  });

  it('should parse a SELECT query with specific columns', () => {
    const query = 'SELECT id, name FROM categories';
    const result = parseQuery(query);
    
    expect(result.operation).toBe('SELECT');
    expect(result.tableName).toBe('categories');
    expect(result.columns).toEqual(['id', 'name']);
  });

  it('should parse a SELECT query with WHERE clause', () => {
    const query = "SELECT * FROM creatures WHERE name = 'Shark'";
    const result = parseQuery(query);
    
    expect(result.operation).toBe('SELECT');
    expect(result.tableName).toBe('creatures');
    expect(result.columns).toEqual(['*']);
    expect(result.where).toEqual({
      column: 'name',
      operator: '=',
      value: 'Shark'
    });
  });

  it('should parse a SELECT query with LIMIT', () => {
    const query = 'SELECT * FROM profiles LIMIT 5';
    const result = parseQuery(query);
    
    expect(result.operation).toBe('SELECT');
    expect(result.tableName).toBe('profiles');
    expect(result.columns).toEqual(['*']);
    expect(result.limit).toBe(5);
  });

  it('should parse a complex SELECT query with WHERE and LIMIT', () => {
    const query = "SELECT id, name FROM sightings WHERE user_id = 'user123' LIMIT 10";
    const result = parseQuery(query);
    
    expect(result.operation).toBe('SELECT');
    expect(result.tableName).toBe('sightings');
    expect(result.columns).toEqual(['id', 'name']);
    expect(result.where).toEqual({
      column: 'user_id',
      operator: '=',
      value: 'user123'
    });
    expect(result.limit).toBe(10);
  });

  it('should throw an error for invalid query syntax', () => {
    const query = 'INVALID QUERY';
    
    expect(() => parseQuery(query)).toThrow();
  });

  it('should throw an error for unsupported operations', () => {
    const query = 'UPDATE creatures SET name = "New Name"';
    
    expect(() => parseQuery(query)).toThrow();
  });
});