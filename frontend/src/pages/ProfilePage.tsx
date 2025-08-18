import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Avatar,
  Grid,
  Card,
  CardContent,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Person,
  Email,
  Work,
  LocationOn,
  School,
  Code,
  Save,
  PhotoCamera,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const ProfilePage: React.FC = () => {
  const { user, userProfile, updateUserProfile } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    displayName: userProfile?.displayName || '',
    email: userProfile?.email || '',
    role: userProfile?.role || 'candidate',
    company: '',
    location: '',
    bio: '',
    skills: [] as string[],
    experience: '',
    education: '',
    github: '',
    linkedin: '',
    website: '',
    notifications: {
      email: true,
      sms: false,
      marketing: false,
    }
  });

  const [newSkill, setNewSkill] = useState('');

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const handleSelectChange = (field: string) => (e: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const handleNotificationChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [field]: e.target.checked
      }
    }));
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }));
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await updateUserProfile({
        displayName: formData.displayName,
        // Add other fields as needed
      });
      
      toast.success('Profile updated successfully!');
    } catch (err: any) {
      console.error('Profile update error:', err);
      const errorMessage = err.message || 'Failed to update profile. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Mock photo upload - in real app, this would upload to storage
      console.log('Uploading photo:', file);
      toast.success('Photo upload functionality would be implemented here');
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Profile Settings
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Profile Picture & Basic Info */}
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Box sx={{ position: 'relative', display: 'inline-block', mb: 2 }}>
                    <Avatar
                      sx={{ 
                        width: 120, 
                        height: 120,
                        mx: 'auto',
                        mb: 2,
                        fontSize: '2rem'
                      }}
                      src={userProfile?.photoURL || undefined}
                    >
                      {userProfile?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                    </Avatar>
                    <Button
                      component="label"
                      variant="contained"
                      size="small"
                      startIcon={<PhotoCamera />}
                      sx={{
                        position: 'absolute',
                        bottom: 16,
                        right: -8,
                        minWidth: 'auto',
                        borderRadius: '50%',
                        p: 1
                      }}
                    >
                      <input
                        hidden
                        accept="image/*"
                        type="file"
                        onChange={handlePhotoUpload}
                      />
                    </Button>
                  </Box>
                  
                  <Typography variant="h6">
                    {userProfile?.displayName || 'User'}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {userProfile?.email}
                  </Typography>
                  
                  <Chip
                    label={userProfile?.role || 'candidate'}
                    color="primary"
                    size="small"
                    sx={{ textTransform: 'capitalize' }}
                  />
                </CardContent>
              </Card>
            </Grid>

            {/* Form Fields */}
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Personal Information
                  </Typography>
                  
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Full Name"
                        value={formData.displayName}
                        onChange={handleInputChange('displayName')}
                        InputProps={{
                          startAdornment: <Person sx={{ mr: 1, color: 'action.active' }} />
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Email"
                        value={formData.email}
                        onChange={handleInputChange('email')}
                        disabled
                        InputProps={{
                          startAdornment: <Email sx={{ mr: 1, color: 'action.active' }} />
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>Role</InputLabel>
                        <Select
                          value={formData.role}
                          onChange={handleSelectChange('role')}
                          label="Role"
                        >
                          <MenuItem value="candidate">Candidate</MenuItem>
                          <MenuItem value="recruiter">Recruiter</MenuItem>
                          <MenuItem value="hiring_manager">Hiring Manager</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Location"
                        value={formData.location}
                        onChange={handleInputChange('location')}
                        InputProps={{
                          startAdornment: <LocationOn sx={{ mr: 1, color: 'action.active' }} />
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Bio"
                        multiline
                        rows={3}
                        value={formData.bio}
                        onChange={handleInputChange('bio')}
                        placeholder="Tell us about yourself..."
                      />
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 3 }} />

                  <Typography variant="h6" gutterBottom>
                    Professional Information
                  </Typography>
                  
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Current Company"
                        value={formData.company}
                        onChange={handleInputChange('company')}
                        InputProps={{
                          startAdornment: <Work sx={{ mr: 1, color: 'action.active' }} />
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>Experience Level</InputLabel>
                        <Select
                          value={formData.experience}
                          onChange={handleSelectChange('experience')}
                          label="Experience Level"
                        >
                          <MenuItem value="junior">0-2 years (Junior)</MenuItem>
                          <MenuItem value="mid">3-5 years (Mid-level)</MenuItem>
                          <MenuItem value="senior">6-10 years (Senior)</MenuItem>
                          <MenuItem value="lead">10+ years (Lead/Principal)</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Education"
                        value={formData.education}
                        onChange={handleInputChange('education')}
                        InputProps={{
                          startAdornment: <School sx={{ mr: 1, color: 'action.active' }} />
                        }}
                      />
                    </Grid>
                  </Grid>

                  {/* Skills */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                      <Code sx={{ mr: 1 }} />
                      Skills
                    </Typography>
                    
                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                      <TextField
                        size="small"
                        placeholder="Add a skill..."
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
                      />
                      <Button variant="outlined" onClick={handleAddSkill}>
                        Add
                      </Button>
                    </Box>
                    
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {formData.skills.map((skill) => (
                        <Chip
                          key={skill}
                          label={skill}
                          onDelete={() => handleRemoveSkill(skill)}
                          color="primary"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </Box>

                  <Divider sx={{ my: 3 }} />

                  <Typography variant="h6" gutterBottom>
                    Social Links
                  </Typography>
                  
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="GitHub"
                        value={formData.github}
                        onChange={handleInputChange('github')}
                        placeholder="https://github.com/username"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="LinkedIn"
                        value={formData.linkedin}
                        onChange={handleInputChange('linkedin')}
                        placeholder="https://linkedin.com/in/username"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Personal Website"
                        value={formData.website}
                        onChange={handleInputChange('website')}
                        placeholder="https://yourwebsite.com"
                      />
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 3 }} />

                  <Typography variant="h6" gutterBottom>
                    Notification Preferences
                  </Typography>
                  
                  <Box sx={{ mb: 3 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.notifications.email}
                          onChange={handleNotificationChange('email')}
                        />
                      }
                      label="Email notifications"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.notifications.sms}
                          onChange={handleNotificationChange('sms')}
                        />
                      }
                      label="SMS notifications"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.notifications.marketing}
                          onChange={handleNotificationChange('marketing')}
                        />
                      }
                      label="Marketing emails"
                    />
                  </Box>

                  <Box sx={{ display: 'flex', gap: 2, pt: 2 }}>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={loading}
                      startIcon={loading ? <CircularProgress size={20} /> : <Save />}
                    >
                      {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => window.location.reload()}
                    >
                      Cancel
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </form>
      </Box>
    </Container>
  );
};

export default ProfilePage;