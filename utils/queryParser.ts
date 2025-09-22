/**
 * Utility to parse simple SQL-like queries for the SQL editor
 */

export interface ParsedQuery {
  operation: 'SELECT';
  tableName: string;
  columns: string[];
  where?: {
    column: string;
    operator: string;
    value: string;
  };
  limit?: number;
}

export const parseQuery = (queryString: string): ParsedQuery => {
  // Basic SELECT query parser
  const selectRegex = /^select\s+(.*?)\s+from\s+(\w+)(?:\s+where\s+(.+?))?(?:\s+limit\s+(\d+))?;?$/i;
  const match = queryString.trim().match(selectRegex);
  
  if (!match) {
    throw new Error('Invalid query format. Supported: SELECT columns FROM table [WHERE condition] [LIMIT number]');
  }
  
  const [, columnsString, tableName, whereClause, limitString] = match;
  
  // Parse columns
  const columns = columnsString === '*' ? ['*'] : columnsString.split(',').map(col => col.trim());
  
  // Parse WHERE clause if present
  let where;
  if (whereClause) {
    // Handle different value types (strings with quotes, numbers, etc.)
    const whereRegex = /^(\w+)\s*(=|!=|<|>|<=|>=)\s*(.+)$/i;
    const whereMatch = whereClause.trim().match(whereRegex);
    
    if (whereMatch) {
      const [, column, operator, valueStr] = whereMatch;
      // Remove quotes if present and trim
      let value = valueStr.trim();
      if ((value.startsWith("'") && value.endsWith("'")) || 
          (value.startsWith('"') && value.endsWith('"'))) {
        value = value.substring(1, value.length - 1);
      }
      
      where = {
        column,
        operator,
        value
      };
    } else {
      throw new Error('Invalid WHERE clause format. Supported: column = value');
    }
  }
  
  // Parse LIMIT if present
  const limit = limitString ? parseInt(limitString, 10) : undefined;
  
  return {
    operation: 'SELECT',
    tableName,
    columns,
    where,
    limit
  };
};