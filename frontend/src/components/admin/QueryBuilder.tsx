import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Grid,
  Divider,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  PlayArrow as ExecuteIcon,
  Code as CodeIcon,
  TableChart as TableIcon,
} from '@mui/icons-material';
import { Editor } from '@monaco-editor/react';
import { DatabaseQuery } from '../../types/admin';

interface QueryBuilderProps {
  onQueryChange: (query: string) => void;
  onExecute: () => void;
  disabled?: boolean;
  initialQuery?: string;
}

interface FilterCondition {
  id: string;
  field: string;
  operator: string;
  value: string;
  valueType: 'string' | 'number' | 'boolean' | 'date';
}

interface OrderByCondition {
  id: string;
  field: string;
  direction: 'asc' | 'desc';
}

const QueryBuilder: React.FC<QueryBuilderProps> = ({
  onQueryChange,
  onExecute,
  disabled = false,
  initialQuery = '',
}) => {
  const [mode, setMode] = useState<'visual' | 'code'>('visual');
  const [filters, setFilters] = useState<FilterCondition[]>([]);
  const [orderBy, setOrderBy] = useState<OrderByCondition[]>([]);
  const [limit, setLimit] = useState<number | undefined>(undefined);
  const [codeQuery, setCodeQuery] = useState(initialQuery);

  const operators = [
    { value: '==', label: 'Equals' },
    { value: '!=', label: 'Not Equals' },
    { value: '<', label: 'Less Than' },
    { value: '<=', label: 'Less Than or Equal' },
    { value: '>', label: 'Greater Than' },
    { value: '>=', label: 'Greater Than or Equal' },
    { value: 'array-contains', label: 'Array Contains' },
    { value: 'in', label: 'In Array' },
    { value: 'not-in', label: 'Not In Array' },
  ];

  const commonFields = [
    'id',
    'email',
    'displayName',
    'role',
    'status',
    'createdAt',
    'updatedAt',
    'lastSignIn',
    'isActive',
    'companyId',
    'plan',
    'domain',
    'industry',
    'userCount',
    'healthScore',
  ];

  useEffect(() => {
    if (mode === 'visual') {
      generateQueryFromVisual();
    }
  }, [filters, orderBy, limit, mode]);

  useEffect(() => {
    if (initialQuery && mode === 'code') {
      setCodeQuery(initialQuery);
    }
  }, [initialQuery]);

  const generateQueryFromVisual = () => {
    const query: any = {};

    if (filters.length > 0) {
      query.where = filters.map(filter => {
        let value: any = filter.value;
        
        // Type conversion based on valueType
        switch (filter.valueType) {
          case 'number':
            value = parseFloat(filter.value) || 0;
            break;
          case 'boolean':
            value = filter.value.toLowerCase() === 'true';
            break;
          case 'date':
            value = filter.value; // Keep as string for now, can be enhanced
            break;
          default:
            value = filter.value;
        }

        return [filter.field, filter.operator, value];
      });
    }

    if (orderBy.length > 0) {
      query.orderBy = orderBy.map(order => [order.field, order.direction]);
    }

    if (limit !== undefined && limit > 0) {
      query.limit = limit;
    }

    const queryString = JSON.stringify(query, null, 2);
    setCodeQuery(queryString);
    onQueryChange(queryString);
  };

  const addFilter = () => {
    const newFilter: FilterCondition = {
      id: Date.now().toString(),
      field: '',
      operator: '==',
      value: '',
      valueType: 'string',
    };
    setFilters([...filters, newFilter]);
  };

  const removeFilter = (id: string) => {
    setFilters(filters.filter(f => f.id !== id));
  };

  const updateFilter = (id: string, updates: Partial<FilterCondition>) => {
    setFilters(filters.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const addOrderBy = () => {
    const newOrderBy: OrderByCondition = {
      id: Date.now().toString(),
      field: '',
      direction: 'asc',
    };
    setOrderBy([...orderBy, newOrderBy]);
  };

  const removeOrderBy = (id: string) => {
    setOrderBy(orderBy.filter(o => o.id !== id));
  };

  const updateOrderBy = (id: string, updates: Partial<OrderByCondition>) => {
    setOrderBy(orderBy.map(o => o.id === id ? { ...o, ...updates } : o));
  };

  const handleCodeChange = (value: string | undefined) => {
    const newValue = value || '';
    setCodeQuery(newValue);
    onQueryChange(newValue);
  };

  const validateQuery = () => {
    if (mode === 'code') {
      try {
        JSON.parse(codeQuery);
        return true;
      } catch (error) {
        return false;
      }
    }
    return true;
  };

  const isValidQuery = validateQuery();

  return (
    <Card sx={{ bgcolor: '#1e1e1e', border: '1px solid #333' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ color: '#fff' }}>
            Query Builder
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant={mode === 'visual' ? 'contained' : 'outlined'}
              startIcon={<TableIcon />}
              onClick={() => setMode('visual')}
              size="small"
              sx={{ 
                borderColor: '#444', 
                color: mode === 'visual' ? '#fff' : '#ccc',
                bgcolor: mode === 'visual' ? '#ff4444' : 'transparent'
              }}
            >
              Visual
            </Button>
            <Button
              variant={mode === 'code' ? 'contained' : 'outlined'}
              startIcon={<CodeIcon />}
              onClick={() => setMode('code')}
              size="small"
              sx={{ 
                borderColor: '#444', 
                color: mode === 'code' ? '#fff' : '#ccc',
                bgcolor: mode === 'code' ? '#ff4444' : 'transparent'
              }}
            >
              Code
            </Button>
            <Button
              variant="contained"
              startIcon={<ExecuteIcon />}
              onClick={onExecute}
              disabled={disabled || !isValidQuery}
              sx={{ bgcolor: '#4caf50', '&:hover': { bgcolor: '#388e3c' } }}
            >
              Execute
            </Button>
          </Box>
        </Box>

        {!isValidQuery && (
          <Alert severity="error" sx={{ mb: 2, bgcolor: 'rgba(244, 67, 54, 0.1)' }}>
            Invalid query syntax. Please check your JSON format.
          </Alert>
        )}

        {mode === 'visual' ? (
          <Box>
            {/* Filters Section */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" sx={{ color: '#fff' }}>
                  Where Conditions
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={addFilter}
                  size="small"
                  sx={{ borderColor: '#444', color: '#fff' }}
                >
                  Add Filter
                </Button>
              </Box>

              {filters.map((filter, index) => (
                <Box key={filter.id} sx={{ mb: 2 }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={3}>
                      <FormControl fullWidth size="small">
                        <InputLabel sx={{ color: '#ccc' }}>Field</InputLabel>
                        <Select
                          value={filter.field}
                          onChange={(e) => updateFilter(filter.id, { field: e.target.value })}
                          sx={{ color: '#fff', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#444' } }}
                        >
                          {commonFields.map((field) => (
                            <MenuItem key={field} value={field}>{field}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={2}>
                      <FormControl fullWidth size="small">
                        <InputLabel sx={{ color: '#ccc' }}>Operator</InputLabel>
                        <Select
                          value={filter.operator}
                          onChange={(e) => updateFilter(filter.id, { operator: e.target.value })}
                          sx={{ color: '#fff', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#444' } }}
                        >
                          {operators.map((op) => (
                            <MenuItem key={op.value} value={op.value}>{op.label}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={3}>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="Value"
                        value={filter.value}
                        onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                        InputProps={{
                          sx: { color: '#fff', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#444' } }
                        }}
                      />
                    </Grid>
                    <Grid item xs={2}>
                      <FormControl fullWidth size="small">
                        <InputLabel sx={{ color: '#ccc' }}>Type</InputLabel>
                        <Select
                          value={filter.valueType}
                          onChange={(e) => updateFilter(filter.id, { valueType: e.target.value as any })}
                          sx={{ color: '#fff', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#444' } }}
                        >
                          <MenuItem value="string">String</MenuItem>
                          <MenuItem value="number">Number</MenuItem>
                          <MenuItem value="boolean">Boolean</MenuItem>
                          <MenuItem value="date">Date</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={1}>
                      <IconButton
                        onClick={() => removeFilter(filter.id)}
                        sx={{ color: '#f44336' }}
                      >
                        <RemoveIcon />
                      </IconButton>
                    </Grid>
                  </Grid>
                  {index < filters.length - 1 && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 1 }}>
                      <Chip label="AND" size="small" sx={{ bgcolor: '#444', color: '#fff' }} />
                    </Box>
                  )}
                </Box>
              ))}
            </Box>

            <Divider sx={{ bgcolor: '#444', my: 3 }} />

            {/* Order By Section */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" sx={{ color: '#fff' }}>
                  Order By
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={addOrderBy}
                  size="small"
                  sx={{ borderColor: '#444', color: '#fff' }}
                >
                  Add Order
                </Button>
              </Box>

              {orderBy.map((order) => (
                <Box key={order.id} sx={{ mb: 2 }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={5}>
                      <FormControl fullWidth size="small">
                        <InputLabel sx={{ color: '#ccc' }}>Field</InputLabel>
                        <Select
                          value={order.field}
                          onChange={(e) => updateOrderBy(order.id, { field: e.target.value })}
                          sx={{ color: '#fff', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#444' } }}
                        >
                          {commonFields.map((field) => (
                            <MenuItem key={field} value={field}>{field}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={5}>
                      <FormControl fullWidth size="small">
                        <InputLabel sx={{ color: '#ccc' }}>Direction</InputLabel>
                        <Select
                          value={order.direction}
                          onChange={(e) => updateOrderBy(order.id, { direction: e.target.value as 'asc' | 'desc' })}
                          sx={{ color: '#fff', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#444' } }}
                        >
                          <MenuItem value="asc">Ascending</MenuItem>
                          <MenuItem value="desc">Descending</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={2}>
                      <IconButton
                        onClick={() => removeOrderBy(order.id)}
                        sx={{ color: '#f44336' }}
                      >
                        <RemoveIcon />
                      </IconButton>
                    </Grid>
                  </Grid>
                </Box>
              ))}
            </Box>

            <Divider sx={{ bgcolor: '#444', my: 3 }} />

            {/* Limit Section */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" sx={{ color: '#fff', mb: 2 }}>
                Limit
              </Typography>
              <TextField
                size="small"
                type="number"
                placeholder="Number of records (optional)"
                value={limit || ''}
                onChange={(e) => setLimit(e.target.value ? parseInt(e.target.value) : undefined)}
                InputProps={{
                  sx: { color: '#fff', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#444' } }
                }}
                sx={{ width: 200 }}
              />
            </Box>

            {/* Generated Query Preview */}
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1" sx={{ color: '#fff', mb: 1 }}>
                Generated Query
              </Typography>
              <Box sx={{ 
                bgcolor: '#333', 
                p: 2, 
                borderRadius: 1, 
                fontFamily: 'monospace',
                fontSize: '0.875rem',
                overflow: 'auto',
                maxHeight: 200
              }}>
                <pre style={{ margin: 0, color: '#fff' }}>
                  {codeQuery || '{}'}
                </pre>
              </Box>
            </Box>
          </Box>
        ) : (
          <Box sx={{ height: 400 }}>
            <Editor
              language="json"
              value={codeQuery}
              onChange={handleCodeChange}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                wordWrap: 'on',
                lineNumbers: 'on',
                formatOnPaste: true,
                formatOnType: true,
              }}
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default QueryBuilder;