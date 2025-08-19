import React from 'react';
import {
  Box,
  Typography,
  Switch,
  FormControlLabel,
  Grid,
  Alert,
  Paper,
  Divider,
  Chip,
  Stack,
} from '@mui/material';
import {
  Videocam,
  ScreenShare,
  Security,
  ContentCopy,
  Warning,
  Info,
} from '@mui/icons-material';

interface ProctoringSettingsProps {
  settings: {
    preventCheating: boolean;
    recordScreen: boolean;
    requireWebcam: boolean;
  };
  onChange: (field: string, value: boolean) => void;
}

export const AssessmentProctoringSettings: React.FC<ProctoringSettingsProps> = ({
  settings,
  onChange,
}) => {
  const handleToggle = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(field, event.target.checked);
  };

  const isProctoringEnabled = settings.recordScreen || settings.requireWebcam;

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Security color="primary" />
        Proctoring & Security Settings
      </Typography>

      <Grid container spacing={3}>
        {/* Basic Anti-Cheating */}
        <Grid item xs={12}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.preventCheating}
                  onChange={handleToggle('preventCheating')}
                  color="primary"
                />
              }
              label={
                <Box>
                  <Typography variant="subtitle1" fontWeight={500}>
                    Prevent Cheating
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Disable copy/paste, right-click, tab switching detection, and browser navigation
                  </Typography>
                </Box>
              }
            />
            {settings.preventCheating && (
              <Box sx={{ mt: 2, pl: 2 }}>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Chip size="small" icon={<ContentCopy />} label="No Copy/Paste" />
                  <Chip size="small" label="No Right Click" />
                  <Chip size="small" label="Tab Switch Detection" />
                  <Chip size="small" label="Fullscreen Mode" />
                </Stack>
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Divider sx={{ my: 1 }} />
        </Grid>

        {/* Advanced Proctoring */}
        <Grid item xs={12}>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
            Advanced Proctoring (Powered by Quadradan)
          </Typography>
        </Grid>

        {/* Webcam Recording */}
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.requireWebcam}
                  onChange={handleToggle('requireWebcam')}
                  color="primary"
                />
              }
              label={
                <Box>
                  <Typography variant="subtitle1" fontWeight={500} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Videocam /> Webcam Recording
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Record candidate's video during assessment
                  </Typography>
                </Box>
              }
            />
            {settings.requireWebcam && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Features:
                </Typography>
                <Stack spacing={0.5} sx={{ mt: 1 }}>
                  <Typography variant="caption">• Face detection</Typography>
                  <Typography variant="caption">• Multiple person detection</Typography>
                  <Typography variant="caption">• Continuous recording</Typography>
                </Stack>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Screen Recording */}
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.recordScreen}
                  onChange={handleToggle('recordScreen')}
                  color="primary"
                />
              }
              label={
                <Box>
                  <Typography variant="subtitle1" fontWeight={500} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <ScreenShare /> Screen Recording
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Record candidate's screen activity
                  </Typography>
                </Box>
              }
            />
            {settings.recordScreen && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Features:
                </Typography>
                <Stack spacing={0.5} sx={{ mt: 1 }}>
                  <Typography variant="caption">• Full screen capture</Typography>
                  <Typography variant="caption">• Application monitoring</Typography>
                  <Typography variant="caption">• Tab switch tracking</Typography>
                </Stack>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Proctoring Info Alert */}
        {isProctoringEnabled && (
          <Grid item xs={12}>
            <Alert severity="info" icon={<Info />}>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Proctoring Enabled
              </Typography>
              <Typography variant="body2">
                When proctoring is enabled:
              </Typography>
              <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                <li>Candidates will be notified before starting the assessment</li>
                <li>They must provide consent and complete a system check</li>
                <li>AI will analyze the session and provide a trust score</li>
                <li>Recordings are stored securely for 30 days</li>
                <li>You can review recordings and incidents after completion</li>
              </ul>
            </Alert>
          </Grid>
        )}

        {/* Privacy Warning */}
        {isProctoringEnabled && (
          <Grid item xs={12}>
            <Alert severity="warning" icon={<Warning />}>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Privacy & Compliance
              </Typography>
              <Typography variant="body2">
                Ensure you have proper consent and comply with local privacy laws when using proctoring. 
                Candidates will be explicitly asked for consent before the assessment begins.
              </Typography>
            </Alert>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default AssessmentProctoringSettings;