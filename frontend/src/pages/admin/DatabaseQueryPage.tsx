import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Grid,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  Box as TabPanel,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Save as SaveIcon,
  History as HistoryIcon,
  Download as DownloadIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { Editor } from '@monaco-editor/react';
import { QueryResult, DatabaseQuery } from '../../types/admin';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const DatabaseQueryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedCollection, setSelectedCollection] = useState('users');
  const [query, setQuery] = useState(`// Simple query example
{
  "where": [
    ["status", "==", "active"]
  ],
  "limit": 10
}`);
  const [queryResults, setQueryResults] = useState<QueryResult | null>(null);
  const [savedQueries, setSavedQueries] = useState<DatabaseQuery[]>([]);
  const [queryHistory, setQueryHistory] = useState<QueryResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'read' | 'write'>('read');

  const collections = [
    'users',
    'companies',
    'assessments',
    'candidates',
    'audit_logs',
    'system_metrics',
    'feature_flags',
  ];

  useEffect(() => {
    loadSavedQueries();
    loadQueryHistory();
  }, []);

  const loadSavedQueries = async () => {
    // Simulate loading saved queries
    setSavedQueries([
      {
        id: '1',
        name: 'Active Users',
        query: '{"where": [["status", "==", "active"]], "limit": 100}',
        collection: 'users',
        createdAt: new Date(),
        createdBy: 'admin@ellaai.com',
      },
      {
        id: '2',
        name: 'Recent Signups',
        query: '{"where": [["createdAt", ">=", "2024-01-01"]], "orderBy": [["createdAt", "desc"]], "limit": 50}',
        collection: 'users',
        createdAt: new Date(),
        createdBy: 'admin@ellaai.com',
      },
    ]);
  };

  const loadQueryHistory = async () => {
    // Simulate loading query history
    setQueryHistory([
      {
        id: '1',
        timestamp: new Date(Date.now() - 1000 * 60 * 30),
        query: '{"where": [["role", "==", "admin"]]}',
        result: [],
        executionTime: 45,
        recordCount: 3,
      },
    ]);
  };

  const executeQuery = async () => {
    setLoading(true);
    try {
      // Parse query
      let queryObj;
      try {
        queryObj = JSON.parse(query);
      } catch (error) {
        throw new Error('Invalid JSON query format');
      }

      // Simulate query execution
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockResult: QueryResult = {
        id: Date.now().toString(),
        timestamp: new Date(),
        query: query,
        result: [
          { id: '1', email: 'user1@example.com', role: 'candidate', status: 'active' },
          { id: '2', email: 'user2@example.com', role: 'recruiter', status: 'active' },
        ],
        executionTime: 156,
        recordCount: 2,
      };

      setQueryResults(mockResult);
      setQueryHistory(prev => [mockResult, ...prev]);
      setShowConfirmDialog(false);
    } catch (error: any) {
      console.error('Query execution failed:', error);
      setQueryResults({
        id: Date.now().toString(),
        timestamp: new Date(),
        query: query,
        result: [],
        executionTime: 0,
        recordCount: 0,
        error: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteClick = () => {
    const isWriteQuery = query.toLowerCase().includes('update') || 
                        query.toLowerCase().includes('delete') || 
                        query.toLowerCase().includes('set');
    
    setConfirmAction(isWriteQuery ? 'write' : 'read');
    setShowConfirmDialog(true);
  };

  const saveQuery = async () => {
    const name = prompt('Enter query name:');
    if (!name) return;

    const newQuery: DatabaseQuery = {
      id: Date.now().toString(),
      name,
      query,
      collection: selectedCollection,
      createdAt: new Date(),
      createdBy: 'admin@ellaai.com',
    };

    setSavedQueries(prev => [newQuery, ...prev]);
  };

  const loadSavedQuery = (savedQuery: DatabaseQuery) => {
    setQuery(savedQuery.query);
    setSelectedCollection(savedQuery.collection);
    setActiveTab(0);
  };

  const exportResults = () => {
    if (!queryResults) return;

    const dataStr = JSON.stringify(queryResults.result, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `query_results_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ color: '#fff', fontWeight: 'bold', mb: 3 }}>
        Database Query Tool
      </Typography>

      <Alert 
        severity="warning" 
        sx={{ mb: 3, bgcolor: 'rgba(255, 152, 0, 0.1)', border: '1px solid #ff9800' }}
      >
        <Typography variant="body2">
          <strong>Warning:</strong> This tool provides direct database access. 
          All queries are logged and monitored. Use with extreme caution.
        </Typography>
      </Alert>

      <Box sx={{ borderBottom: 1, borderColor: '#444', mb: 2 }}>
        <Tabs 
          value={activeTab} 
          onChange={(_, newValue) => setActiveTab(newValue)}
          sx={{ '& .MuiTab-root': { color: '#ccc' }, '& .Mui-selected': { color: '#ff4444' } }}
        >
          <Tab label="Query Editor" />
          <Tab label="Saved Queries" />
          <Tab label="Query History" />
        </Tabs>
      </Box>

      <CustomTabPanel value={activeTab} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card sx={{ bgcolor: '#1e1e1e', border: '1px solid #333', mb: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
                  <FormControl size="small" sx={{ minWidth: 200 }}>
                    <InputLabel sx={{ color: '#ccc' }}>Collection</InputLabel>
                    <Select
                      value={selectedCollection}
                      onChange={(e) => setSelectedCollection(e.target.value)}
                      sx={{ color: '#fff', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#444' } }}
                    >
                      {collections.map((collection) => (
                        <MenuItem key={collection} value={collection}>
                          {collection}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <Button
                    variant="contained"
                    startIcon={<PlayIcon />}
                    onClick={handleExecuteClick}
                    disabled={loading}
                    sx={{ bgcolor: '#ff4444', '&:hover': { bgcolor: '#cc3333' } }}
                  >
                    Execute Query
                  </Button>

                  <Button
                    variant="outlined"
                    startIcon={<SaveIcon />}
                    onClick={saveQuery}
                    sx={{ borderColor: '#444', color: '#fff' }}
                  >
                    Save Query
                  </Button>
                </Box>

                <Box sx={{ height: 400, border: '1px solid #444', borderRadius: 1 }}>
                  <Editor
                    language="json"
                    value={query}
                    onChange={(value) => setQuery(value || '')}
                    theme="vs-dark"
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      wordWrap: 'on',
                      lineNumbers: 'on',
                      folding: true,
                      bracketPairColorization: { enabled: true },
                    }}
                  />
                </Box>
              </CardContent>
            </Card>

            {/* Query Results */}
            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress sx={{ color: '#ff4444' }} />
              </Box>
            )}

            {queryResults && !loading && (
              <Card sx={{ bgcolor: '#1e1e1e', border: '1px solid #333' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ color: '#fff' }}>
                      Query Results
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Chip 
                        label={`${queryResults.recordCount} records`} 
                        size="small" 
                        sx={{ bgcolor: '#333', color: '#fff' }}
                      />
                      <Chip 
                        label={`${queryResults.executionTime}ms`} 
                        size="small" 
                        sx={{ bgcolor: '#333', color: '#fff' }}
                      />
                      <Button
                        size="small"
                        startIcon={<DownloadIcon />}
                        onClick={exportResults}
                        sx={{ color: '#ff4444' }}
                      >
                        Export
                      </Button>
                    </Box>
                  </Box>

                  {queryResults.error ? (
                    <Alert severity="error" sx={{ bgcolor: 'rgba(244, 67, 54, 0.1)' }}>
                      {queryResults.error}
                    </Alert>
                  ) : (
                    <TableContainer component={Paper} sx={{ bgcolor: '#2a2a2a', maxHeight: 400 }}>
                      <Table stickyHeader size="small">
                        <TableHead>
                          <TableRow>
                            {queryResults.result.length > 0 && 
                              Object.keys(queryResults.result[0]).map((key) => (
                                <TableCell key={key} sx={{ bgcolor: '#333', color: '#fff', fontWeight: 'bold' }}>
                                  {key}
                                </TableCell>
                              ))
                            }
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {queryResults.result.map((row, index) => (
                            <TableRow key={index}>
                              {Object.values(row).map((value, cellIndex) => (
                                <TableCell key={cellIndex} sx={{ color: '#fff', borderColor: '#444' }}>
                                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </CardContent>
              </Card>
            )}
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ bgcolor: '#1e1e1e', border: '1px solid #333' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>
                  Query Examples
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Button
                    variant="text"
                    size="small"
                    sx={{ justifyContent: 'flex-start', color: '#ccc', textTransform: 'none' }}
                    onClick={() => setQuery(`{
  "where": [
    ["status", "==", "active"]
  ],
  "limit": 10
}`)}
                  >
                    Find active records
                  </Button>
                  <Button
                    variant="text"
                    size="small"
                    sx={{ justifyContent: 'flex-start', color: '#ccc', textTransform: 'none' }}
                    onClick={() => setQuery(`{
  "where": [
    ["createdAt", ">=", "2024-01-01"]
  ],
  "orderBy": [
    ["createdAt", "desc"]
  ]
}`)}
                  >
                    Recent records
                  </Button>
                  <Button
                    variant="text"
                    size="small"
                    sx={{ justifyContent: 'flex-start', color: '#ccc', textTransform: 'none' }}
                    onClick={() => setQuery(`{
  "where": [
    ["role", "in", ["admin", "system_admin"]]
  ]
}`)}
                  >
                    Find admin users
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </CustomTabPanel>

      <CustomTabPanel value={activeTab} index={1}>
        <Card sx={{ bgcolor: '#1e1e1e', border: '1px solid #333' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>
              Saved Queries
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: '#ccc', borderColor: '#444' }}>Name</TableCell>
                    <TableCell sx={{ color: '#ccc', borderColor: '#444' }}>Collection</TableCell>
                    <TableCell sx={{ color: '#ccc', borderColor: '#444' }}>Created</TableCell>
                    <TableCell sx={{ color: '#ccc', borderColor: '#444' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {savedQueries.map((savedQuery) => (
                    <TableRow key={savedQuery.id}>
                      <TableCell sx={{ color: '#fff', borderColor: '#444' }}>
                        {savedQuery.name}
                      </TableCell>
                      <TableCell sx={{ color: '#fff', borderColor: '#444' }}>
                        {savedQuery.collection}
                      </TableCell>
                      <TableCell sx={{ color: '#fff', borderColor: '#444' }}>
                        {savedQuery.createdAt.toLocaleDateString()}
                      </TableCell>
                      <TableCell sx={{ borderColor: '#444' }}>
                        <Button
                          size="small"
                          onClick={() => loadSavedQuery(savedQuery)}
                          sx={{ color: '#ff4444' }}
                        >
                          Load
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </CustomTabPanel>

      <CustomTabPanel value={activeTab} index={2}>
        <Card sx={{ bgcolor: '#1e1e1e', border: '1px solid #333' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>
              Query History
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: '#ccc', borderColor: '#444' }}>Timestamp</TableCell>
                    <TableCell sx={{ color: '#ccc', borderColor: '#444' }}>Query</TableCell>
                    <TableCell sx={{ color: '#ccc', borderColor: '#444' }}>Records</TableCell>
                    <TableCell sx={{ color: '#ccc', borderColor: '#444' }}>Time</TableCell>
                    <TableCell sx={{ color: '#ccc', borderColor: '#444' }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {queryHistory.map((historyItem) => (
                    <TableRow key={historyItem.id}>
                      <TableCell sx={{ color: '#fff', borderColor: '#444' }}>
                        {historyItem.timestamp.toLocaleString()}
                      </TableCell>
                      <TableCell sx={{ color: '#fff', borderColor: '#444', maxWidth: 200 }}>
                        <Typography noWrap variant="body2">
                          {historyItem.query}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ color: '#fff', borderColor: '#444' }}>
                        {historyItem.recordCount}
                      </TableCell>
                      <TableCell sx={{ color: '#fff', borderColor: '#444' }}>
                        {historyItem.executionTime}ms
                      </TableCell>
                      <TableCell sx={{ borderColor: '#444' }}>
                        <Chip 
                          label={historyItem.error ? 'Error' : 'Success'} 
                          size="small"
                          color={historyItem.error ? 'error' : 'success'}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </CustomTabPanel>

      {/* Confirmation Dialog */}
      <Dialog 
        open={showConfirmDialog} 
        onClose={() => setShowConfirmDialog(false)}
        PaperProps={{ sx: { bgcolor: '#2a2a2a', color: '#fff' } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon sx={{ color: '#ff9800' }} />
          Confirm Database Query
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            You are about to execute a {confirmAction} query on the <strong>{selectedCollection}</strong> collection.
          </Typography>
          {confirmAction === 'write' && (
            <Alert severity="error" sx={{ mt: 2 }}>
              <strong>WARNING:</strong> This is a write operation that may modify or delete data. 
              This action cannot be undone.
            </Alert>
          )}
          <Typography variant="body2" sx={{ mt: 2, color: '#ccc' }}>
            Query: {query.substring(0, 100)}...
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowConfirmDialog(false)} sx={{ color: '#ccc' }}>
            Cancel
          </Button>
          <Button 
            onClick={executeQuery} 
            variant="contained"
            sx={{ bgcolor: '#ff4444', '&:hover': { bgcolor: '#cc3333' } }}
          >
            Execute
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DatabaseQueryPage;